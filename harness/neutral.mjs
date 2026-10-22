// Neutral sky checks: drives the page's `manager` with fake hass objects; no renderer mounted.
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const f of process.argv.slice(2)) {
  const page = await browser.newPage();
  const warns = [];
  page.on('console', (m) => { if (m.type() === 'warning') warns.push(m.text()); });
  await page.setContent('<html><body></body></html>');
  await page.addScriptTag({ content: fs.readFileSync(f, 'utf8') });
  const res = await page.evaluate(() => {
    const st = (state, attrs = {}) => ({ state, attributes: attrs });
    const hass = (w) => ({ config: { latitude: 30 }, themes: { darkMode: false },
      states: { 'sun.sun': st('above_horizon', { elevation: 30, azimuth: 180 }), ...(w ? { 'weather.home': w } : {}) } });
    const pick = (s) => ({ cond: s.condition, sun: +s.sun.toFixed(2), clouds: +s.cloudCount.toFixed(2), sheet: +s.sheet.toFixed(2),
      rain: s.rain, stars: +s.stars.toFixed(2), grad: s.gradient.slice(16, 60) });
    const out = {};
    manager.config = { ...manager.config, weather_entity: 'weather.home' };
    manager.hass = hass(st('unavailable')); manager.refresh(); out.firstUnavailable = pick(manager.scene);
    manager.hass = hass(st('unknown')); manager.refresh(); out.firstUnknown = pick(manager.scene);
    manager.hass = hass(null); manager.refresh(); out.missing = pick(manager.scene);
    manager.sim.condition = 'rainy'; manager.refresh(); out.simRainy = pick(manager.scene); manager.sim.condition = '';
    manager.sim.effect = 'rainbow'; manager.refresh(); out.simRainbow = pick(manager.scene); manager.sim.effect = '';
    manager.hass = hass(st('cloudy', { cloud_coverage: 95 })); manager.refresh(); out.recovered = pick(manager.scene);
    manager.hass = hass(st('unavailable')); manager.refresh(); out.laterOutage = pick(manager.scene);
    return out;
  });
  console.log(f.split('/').pop());
  for (const [k, v] of Object.entries(res)) console.log(' ', k.padEnd(16), JSON.stringify(v));
  console.log('  warnings', warns.length, JSON.stringify(warns));
  await page.close();
}
await browser.close();
