// WDB1cr probes for pause_entity (A1, A2): rapid screensaver flapping must not start a second animation chain, and
// while paused the layer is a still picture - no loop callbacks, no running CSS animations, no cloud generation, no
// sky fade, and the canvases keep their pixels through a quality change; the resume applies what waited.
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
let failed = 0;
for (const f of process.argv.slice(2)) {
  const src = fs.readFileSync(f, 'utf8');
  const ctx = await browser.newContext();
  await ctx.route('http://wdb.test/**', (r) => r.fulfill({ contentType: 'text/html', body: '<html><body></body></html>' }));
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('http://wdb.test/');
  await page.addScriptTag({ content: src });
  const out = await page.evaluate(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const hass = (p, w = 'rainy', el = 30, warn = 'off') => ({ config: { latitude: 30 }, themes: { darkMode: false }, states: {
      'sun.sun': { state: 'above_horizon', attributes: { elevation: el, azimuth: 180 } },
      'weather.home': { state: w, attributes: { cloud_coverage: 90 } },
      'binary_sensor.warn': { state: warn, attributes: {} },
      'switch.ss': { state: p, attributes: {} } } });
    manager.config = { ...manager.config, weather_entity: 'weather.home', warning_entity: 'binary_sensor.warn', hysteresis: 0, animations: true, pause_entity: 'switch.ss' };
    const set = (h) => { manager.hass = h; manager.refresh(); };
    const checks = [];
    const ok = (name, pass, detail) => checks.push({ name, pass: !!pass, detail });
    // A1: five immediate on/off pairs, then count loop callbacks for 1 s, then pause and count again
    set(hass('off'));
    manager.attachTo(document.body);
    let r = manager.renderer, calls = 0;
    const wrapLoop = (x) => { if (x.__l) return; const o = x.loop.bind(x); x.loop = (t) => { calls++; return o(t); }; x.__l = true; };
    wrapLoop(r);
    await wait(300);
    for (let i = 0; i < 5; i++) { set(hass('on')); set(hass('off')); }
    calls = 0; await wait(1000);
    const flap = calls;
    ok('A1 flapping: one chain (callbacks/s <= 70)', flap > 0 && flap <= 70, flap);
    set(hass('on'));
    await wait(100); calls = 0; await wait(1000);
    ok('A1 after pause: zero loop callbacks', calls === 0, calls);
    // A2: fog + warning glow + clouds, paused before the cloud decks finish
    set(hass('off', 'fog', 30, 'on'));
    manager.detach();
    manager.renderer = null; // a fresh renderer, so its cloud decks are still being generated
    manager.attachTo(document.body);
    r = manager.renderer; wrapLoop(r);
    let gens = 0;
    const og = r.genStep.bind(r); r.genStep = () => { gens++; return og(); };
    await wait(150);
    const running = () => r.el.shadowRoot.getAnimations().filter((a) => a.playState === 'running').length;
    const runBefore = running();
    const genBefore = gens, decksPending = r.decks.some((d) => !d.done);
    set(hass('on', 'fog', 30, 'on'));
    // a pixel on the effects canvas stands in for the last drawn frame
    r.ctx.setTransform(1, 0, 0, 1, 0, 0); r.ctx.fillStyle = '#ff0000'; r.ctx.fillRect(0, 0, 2, 2);
    gens = 0; calls = 0;
    await wait(1000);
    ok('A2 CSS animations running before pause (fog, glow)', runBefore >= 2, runBefore);
    ok('A2 cloud decks still generating at pause', genBefore > 0 && decksPending, genBefore);
    ok('A2 paused: no running CSS animations', running() === 0, running());
    ok('A2 paused: no cloud-generation steps', gens === 0, gens);
    ok('A2 paused: no loop callbacks', calls === 0, calls);
    // a sun move while paused must not start a sky fade or its settle timer
    const gradBefore = r.gradient, bBefore = r.$('skyB').style.background;
    set(hass('on', 'fog', 2, 'on'));
    await wait(300);
    ok('A2 paused: scene change waits (no sky fade)', r.gradient === gradBefore && r.$('skyB').style.background === bBefore, '');
    // quality change and window resize while paused keep the frame
    const qBefore = r.mode.quality;
    manager.setDevice({ quality: qBefore === 'high' ? 'low' : 'high' });
    window.dispatchEvent(new Event('resize'));
    const px = r.ctx.getImageData(0, 0, 1, 1).data;
    ok('A2 paused: quality change + resize keep the frame', px[0] === 255 && px[3] === 255, Array.from(px).join(','));
    // resume: the waiting scene, mode and resize apply and the loop runs
    gens = 0; calls = 0;
    set(hass('off', 'fog', 2, 'on'));
    await wait(1000);
    ok('A2 resume: quality applied', r.mode.quality !== qBefore, r.mode.quality);
    ok('A2 resume: scene applied', r.gradient !== gradBefore, '');
    ok('A2 resume: CSS animations running again', running() >= 2, running());
    ok('A2 resume: loop runs', calls > 0, calls);
    manager.setDevice({ quality: 'auto' });
    return checks;
  });
  console.log(f.split('/').pop());
  for (const c of out) { if (!c.pass) failed++; console.log('  ', c.pass ? 'PASS' : 'FAIL', c.name.padEnd(52), c.detail); }
  console.log('   page errors', errors.length, JSON.stringify(errors));
  if (errors.length) failed++;
  await ctx.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
