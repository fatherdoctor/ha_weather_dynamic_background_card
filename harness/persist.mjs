// WDB1c checks for fix/persist-memory: drives `manager` across simulated reloads (a new page on the same origin, so
// localStorage carries over) with a controllable Date.now; no renderer mounted.
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const MIN = 60000, BASE = Date.UTC(2026, 9, 23, 12, 0, 0);
for (const f of process.argv.slice(2)) {
  const src = fs.readFileSync(f, 'utf8');
  const ctx = await browser.newContext();
  await ctx.route('http://wdb.test/**', (r) => r.fulfill({ contentType: 'text/html', body: '<html><body></body></html>' }));
  const errors = [];
  // one "page load" = a fresh page with the clock at `at` minutes; `steps` run in it in order
  const load = async (at, steps) => {
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.addInitScript((now) => { window.__now = now; Date.now = () => window.__now; }, BASE + at * MIN);
    await page.goto('http://wdb.test/');
    await page.addScriptTag({ content: src });
    const out = await page.evaluate(({ steps, MIN, BASE }) => {
      let writes = 0;
      const orig = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) { if (k.includes(':memory:')) writes++; return orig.call(this, k, v); };
      const st = (state) => ({ state, attributes: {} });
      const hass = (e, c) => ({ config: { latitude: 30 }, themes: { darkMode: false },
        states: { 'sun.sun': { state: 'above_horizon', attributes: { elevation: 30, azimuth: 180 } }, [e]: st(c) } });
      const res = [];
      for (const s of steps) {
        if (s.at !== undefined) window.__now = BASE + s.at * MIN;
        if (s.raw) { localStorage.setItem(s.raw[0], s.raw[1]); continue; }
        manager.config = { ...manager.config, weather_entity: s.e || 'weather.home', hysteresis: s.h ?? 10 };
        manager.hass = s.nohass ? null : hass(s.e || 'weather.home', s.c);
        for (let i = 0; i < (s.n || 1); i++) manager.refresh();
        res.push({ c: s.c, shown: manager.shown, cand: manager.candidate,
          sinceMin: manager.since ? (manager.since - BASE) / MIN : 0, rainbow: manager.lastInput.rainbow, cond: manager.lastInput.condition, neutral: !!manager.lastInput.neutral });
      }
      return { res, writes };
    }, { steps, MIN, BASE });
    await page.close();
    return out;
  };
  const show = (name, o) => { console.log('  ' + name.padEnd(34), 'writes', o.writes); for (const r of o.res) console.log('     ', JSON.stringify(r)); };
  console.log(f.split('/').pop());
  show('A1 rain at 0', await load(0, [{ c: 'rainy' }]));
  show('A2 reload at 5, cloudy', await load(5, [{ c: 'cloudy' }, { c: 'cloudy', at: 14 }, { c: 'cloudy', at: 15 }]));
  show('B1 clear 20, cloudy from 22', await load(20, [{ c: 'clear-night', e: 'weather.b' }, { c: 'cloudy', at: 22, e: 'weather.b' }]));
  show('B2 reload 25: cloudy due at 32', await load(25, [{ c: 'cloudy', e: 'weather.b' }, { c: 'cloudy', at: 31, e: 'weather.b' }, { c: 'cloudy', at: 32, e: 'weather.b' }]));
  show('C reload 60: record 28 min old', await load(60, [{ c: 'sunny' }]));
  show('D other entity at 61', await load(61, [{ c: 'rainy', e: 'weather.other' }]));
  show('D2 back to home at 62', await load(62, [{ c: 'sunny' }]));
  show('E corrupt record', await load(63, [{ raw: ['ha-weather-dynamic-background-card:memory:weather.bad', '{oops'] }, { c: 'rainy', e: 'weather.bad' }]));
  show('E2 future-dated record', await load(64, [{ raw: ['ha-weather-dynamic-background-card:memory:weather.fut', JSON.stringify({ shown: 'snowy', seen: BASE + 999 * MIN, lastWet: BASE + 999 * MIN })] }, { c: 'sunny', e: 'weather.fut' }]));
  show('F hysteresis 0: rain at 70', await load(70, [{ c: 'rainy', h: 0 }]));
  show('F2 reload 75, h 0: rainbow kept', await load(75, [{ c: 'sunny', h: 0 }]));
  show('G 50 refreshes in one minute', await load(80, [{ c: 'sunny', n: 50 }, { c: 'sunny', at: 81, n: 50 }]));
  show('H no hass yet: nothing written', await load(90, [{ c: 'x', nohass: true, e: 'weather.nh' }]));
  // with fix/neutral-sky (the patches build): an outage at load keeps a fresh remembered sky, an old one goes neutral
  show('I1 rain at 100 (weather.o)', await load(100, [{ c: 'rainy', e: 'weather.o' }]));
  show('I2 reload 103, entity unavailable', await load(103, [{ c: 'unavailable', e: 'weather.o' }]));
  show('I3 reload 200, entity unavailable', await load(200, [{ c: 'unavailable', e: 'weather.o' }]));
  console.log('  page errors', errors.length, JSON.stringify(errors));
  await ctx.close();
}
await browser.close();
