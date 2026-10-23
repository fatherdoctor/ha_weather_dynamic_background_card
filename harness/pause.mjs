// WDB1c checks for fix/pause-entity: mounts the layer through `manager` on a plain page, drives fake hass objects
// and a stubbed navigator.getBattery(), and counts drawn frames per 1.5 s window.
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const f of process.argv.slice(2)) {
  const src = fs.readFileSync(f, 'utf8');
  for (const battery of [true, false]) {
    const ctx = await browser.newContext();
    await ctx.route('http://wdb.test/**', (r) => r.fulfill({ contentType: 'text/html', body: '<html><body></body></html>' }));
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    if (battery) await page.addInitScript(() => {
      const b = new EventTarget(); b.charging = false; b.level = 0.8; window.__batt = b;
      navigator.getBattery = () => Promise.resolve(b);
    });
    else await page.addInitScript(() => { delete Navigator.prototype.getBattery; });
    await page.goto('http://wdb.test/');
    await page.addScriptTag({ content: src });
    const out = await page.evaluate(async () => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const hass = (p) => ({ config: { latitude: 30 }, themes: { darkMode: false }, states: {
        'sun.sun': { state: 'above_horizon', attributes: { elevation: 30, azimuth: 180 } },
        'weather.home': { state: 'rainy', attributes: { cloud_coverage: 90 } },
        ...(p === undefined ? {} : { 'switch.panel_screensaver': { state: p, attributes: {} } }) } });
      const cfg = (extra) => ({ ...manager.config, weather_entity: 'weather.home', hysteresis: 0, animations: true, ...extra });
      manager.config = cfg({ pause_entity: 'switch.panel_screensaver' });
      manager.hass = hass('off');
      manager.attachTo(document.body);
      // the patches build replaces the renderer on every attach (fix/release-on-detach), so wrap whichever is current
      let draws = 0;
      const wrap = () => { const r = manager.renderer; if (r.__wrapped) return r; const orig = r.draw.bind(r); r.draw = (ts) => { draws++; return orig(ts); }; r.__wrapped = true; return r; };
      wrap();
      const measure = async (label) => { const r = wrap(); await wait(300); draws = 0; await wait(1500); return { label, draws, running: r.running, paused: r.paused, quality: r.mode.quality }; };
      const res = [];
      const step = async (label, h, c) => { if (c) manager.config = cfg(c); manager.hass = h; manager.refresh(); res.push(await measure(label)); };
      await step('screensaver off', hass('off'));
      await step('screensaver on', hass('on'));
      await step('on + 3 hass updates', hass('on'));
      manager.refresh(); manager.refresh(); manager.renderer.kick();
      res.push(await measure('on + refresh + kick()'));
      await step('screensaver off again', hass('off'));
      await step('entity unavailable', hass('unavailable'));
      await step('entity missing', hass(undefined));
      await step('no pause_entity, state on', hass('on'), { pause_entity: '' });
      manager.config = cfg({ pause_entity: 'switch.panel_screensaver' }); manager.hass = hass('on'); manager.refresh();
      manager.detach(); manager.attachTo(document.body);
      res.push(await measure('remount while on'));
      await step('off after remount', hass('off'));
      // battery
      await step('battery_saver on, auto', hass('off'), { pause_entity: 'switch.panel_screensaver', battery_saver: true });
      await wait(50); manager.refresh();
      res.push(await measure('  (after getBattery resolves)'));
      if (window.__batt) { window.__batt.charging = true; window.__batt.dispatchEvent(new Event('chargingchange')); }
      res.push(await measure('charger connected'));
      if (window.__batt) { window.__batt.charging = false; window.__batt.dispatchEvent(new Event('chargingchange')); }
      res.push(await measure('charger removed'));
      manager.setDevice({ quality: 'high' });
      res.push(await measure('device quality high, discharging'));
      manager.setDevice({ quality: 'auto' });
      await step('battery_saver off, discharging', hass('off'), { pause_entity: 'switch.panel_screensaver', battery_saver: false });
      const schema = WeatherDynamicBackgroundCardForm();
      return { res, schema };
      function WeatherDynamicBackgroundCardForm() {
        const C = customElements.get('ha-weather-dynamic-background-card');
        const f = C.getConfigForm();
        const names = []; const walk = (a) => a.forEach((x) => (x.schema ? walk(x.schema) : names.push(x.name)));
        walk(f.schema);
        return names.filter((n) => ['pause_entity', 'battery_saver'].includes(n)).map((n) => `${n}: ${f.computeLabel({ name: n })} / ${f.computeHelper({ name: n })?.slice(0, 40)}`);
      }
    });
    console.log(f.split('/').pop(), battery ? '(getBattery stubbed, discharging)' : '(no getBattery)');
    for (const x of out.res) console.log('  ', x.label.padEnd(34), 'draws', String(x.draws).padStart(3), 'running', x.running, 'paused', x.paused, 'quality', x.quality);
    console.log('   form:', JSON.stringify(out.schema));
    console.log('   page errors', errors.length, JSON.stringify(errors));
    await ctx.close();
  }
}
await browser.close();
