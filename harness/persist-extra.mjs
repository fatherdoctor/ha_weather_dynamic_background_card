// WDB1cr probes for the weather memory (P1-P4). Each "load" is a fresh page on one origin (localStorage carries over)
// with Date.now under test control; states carry Home Assistant's last_updated like real ones.
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const MIN = 60000, BASE = Date.UTC(2026, 9, 23, 12, 0, 0);
const KEY = 'ha-weather-dynamic-background-card:memory:';
let failed = 0;
for (const f of process.argv.slice(2)) {
  const src = fs.readFileSync(f, 'utf8');
  const ctx = await browser.newContext();
  await ctx.route('http://wdb.test/**', (r) => r.fulfill({ contentType: 'text/html', body: '<html><body></body></html>' }));
  const errors = [];
  // run `fn(api)` in a fresh page with the clock at `at` minutes
  const load = async (at, fn, arg) => {
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.addInitScript((now) => { window.__now = now; Date.now = () => window.__now; }, BASE + at * MIN);
    await page.goto('http://wdb.test/');
    await page.addScriptTag({ content: src });
    const out = await page.evaluate(async ({ fn, arg, MIN, BASE, KEY }) => {
      const io = { reads: 0, writes: 0 };
      const gi = Storage.prototype.getItem, si = Storage.prototype.setItem;
      Storage.prototype.getItem = function (k) { if (k.includes(':memory:')) io.reads++; return gi.call(this, k); };
      Storage.prototype.setItem = function (k, v) { if (k.includes(':memory:')) io.writes++; return si.call(this, k, v); };
      const iso = (m) => new Date(BASE + m * MIN).toISOString();
      const clock = (m) => { window.__now = BASE + m * MIN; };
      const hass = (e, c, lu) => ({ config: { latitude: 30 }, themes: { darkMode: false }, states: {
        'sun.sun': { state: 'above_horizon', attributes: { elevation: 30, azimuth: 180 } },
        [e]: { state: c, attributes: {}, last_updated: iso(lu), last_changed: iso(lu) } } });
      const drive = (e, c, lu, h = 10) => { manager.config = { ...manager.config, weather_entity: e, hysteresis: h }; manager.hass = hass(e, c, lu); manager.refresh(); };
      const rec = (e) => JSON.parse(localStorage.getItem(KEY + e) || 'null');
      const api = { io, clock, hass, drive, rec, MIN, BASE, KEY };
      return await (0, eval)('(' + fn + ')')(api, arg);
    }, { fn: fn.toString(), arg, MIN, BASE, KEY });
    await page.close();
    return out;
  };
  const checks = [];
  const ok = (name, pass, detail) => checks.push({ name, pass: !!pass, detail: JSON.stringify(detail) });

  // P1: through the real element - append, setConfig, then hass. A rain->cloudy change pending since 22 survives a
  // reload at 25 and shows at 32; nothing reads the memory before hass.
  await load(20, ({ drive }) => drive('weather.lc', 'rainy', 20));
  await load(22, ({ drive }) => drive('weather.lc', 'cloudy', 22));
  const p1 = await load(25, ({ io, hass, clock }) => {
    const el = document.createElement('ha-weather-dynamic-background-card');
    document.body.appendChild(el);
    el.setConfig({ weather_entity: 'weather.lc', hysteresis: 10 });
    const before = { reads: io.reads, writes: io.writes, shown: manager.shown };
    el.hass = hass('weather.lc', 'cloudy', 22);
    const at25 = { shown: manager.shown, cand: manager.candidate, since: (manager.since - window.__now) / 60000 + 25 };
    clock(31); el.hass = hass('weather.lc', 'cloudy', 22);
    const at31 = manager.shown;
    clock(32); el.hass = hass('weather.lc', 'cloudy', 22);
    return { before, at25, at31, at32: manager.shown };
  });
  ok('P1 no memory read/write before hass', p1.before.reads === 0 && p1.before.writes === 0, p1.before);
  ok('P1 pending change keeps its start (22)', p1.at25.shown === 'rainy' && p1.at25.cand === 'cloudy' && Math.round(p1.at25.since) === 22, p1.at25);
  ok('P1 change shows at 32, not before', p1.at31 === 'rainy' && p1.at32 === 'cloudy', [p1.at31, p1.at32]);

  // P2: a sunny entity last reported at 40, refreshed and updated by unrelated states until 100: the record says 40,
  // so a reload at 101 during an outage does not restore it as fresh.
  const p2 = await load(41, ({ drive, clock, rec }) => {
    drive('weather.p2', 'sunny', 40);
    for (const m of [50, 70, 90, 100]) { clock(m); drive('weather.p2', 'sunny', 40); manager.refresh(); }
    return rec('weather.p2');
  });
  ok('P2 seen = the entity report (40), not refresh time', p2 && Math.round((p2.seen - BASE) / MIN) === 40, p2 && (p2.seen - BASE) / MIN);
  const p2b = await load(101, ({ drive }) => { drive('weather.p2', 'unavailable', 101); return { shown: manager.shown, cond: manager.lastInput.condition }; });
  ok('P2 outage reload at 101: old sky not restored', p2b.shown !== 'sunny', p2b);

  // P3: one write a minute per entity, coalesced
  const p3 = await load(200, ({ drive, io, clock, rec }) => {
    drive('weather.p3', 'sunny', 200);
    const first = io.writes;
    for (let i = 0; i < 100; i++) drive('weather.p3', i % 2 ? 'sunny' : 'cloudy', 200);
    const burst = io.writes - first;
    clock(200.9999); drive('weather.p3', 'sunny', 200);
    clock(201.0001); drive('weather.p3', 'sunny', 200);
    const boundary = io.writes - first - burst;
    clock(201.5); drive('weather.p3', 'cloudy', 201.5);
    const held = io.writes;
    clock(202.6); manager.refresh();
    return { first, burst, boundary, heldWrite: io.writes - held >= 0 && held, after: io.writes, cand: rec('weather.p3').candidate };
  });
  ok('P3 100 alternating updates at one instant: 0 extra writes', p3.burst === 0, p3);
  ok('P3 unchanged weather across a minute boundary: 0 writes', p3.boundary === 0, p3);
  ok('P3 a held change is written once the minute is up', p3.cand === 'cloudy', p3);

  // P4: whole-record rejection
  const fresh = BASE + 299 * MIN;
  const p4 = await load(300, ({ drive, rec, KEY, BASE, MIN }, fresh) => {
    localStorage.setItem(KEY + 'weather.bogus', JSON.stringify({ shown: 'bogus', candidate: null, since: 0, lastWet: 0, seen: fresh }));
    localStorage.setItem(KEY + 'weather.fut', JSON.stringify({ shown: 'cloudy', candidate: null, since: 0, lastWet: BASE + 999 * MIN, seen: fresh }));
    localStorage.setItem(KEY + 'weather.arr', JSON.stringify([1, 2]));
    localStorage.setItem(KEY + 'weather.cand', JSON.stringify({ shown: null, candidate: 'rainy', since: fresh, lastWet: 0, seen: 0 }));
    const r = {};
    for (const e of ['weather.bogus', 'weather.fut', 'weather.arr', 'weather.cand']) {
      drive(e, 'sunny', 300);
      r[e] = { shown: manager.shown, cand: manager.candidate, rainbow: manager.lastInput.rainbow };
    }
    return r;
  }, fresh);
  ok('P4 unknown shown condition: record ignored', p4['weather.bogus'].shown === 'sunny', p4['weather.bogus']);
  ok('P4 future lastWet: whole record ignored', p4['weather.fut'].shown === 'sunny' && !p4['weather.fut'].rainbow, p4['weather.fut']);
  ok('P4 not an object / pending without shown: ignored', p4['weather.arr'].shown === 'sunny' && p4['weather.cand'].cand === null, p4);

  console.log(f.split('/').pop());
  for (const c of checks) { if (!c.pass) failed++; console.log('  ', c.pass ? 'PASS' : 'FAIL', c.name.padEnd(52), c.detail); }
  console.log('   page errors', errors.length, JSON.stringify(errors));
  if (errors.length) failed++;
  await ctx.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
