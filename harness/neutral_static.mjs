// Usage: neutral_static.mjs <build.js> <outdir>. Neutral scene with animations off (drawStatic) plus frost, smog and the warning glow; reports page errors.
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const [f, outDir] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 800, height: 500 } });
const errs = [];
page.on('pageerror', (e) => errs.push(String(e)));
page.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') errs.push(m.text()); });
await page.setContent('<html><body style="margin:0"></body></html>');
await page.addScriptTag({ content: fs.readFileSync(f, 'utf8') });
const out = await page.evaluate(() => {
  const r = new SkyRenderer(); r.mount(document.body);
  r.setMode({ animate: false, quality: 'auto', flash: false });
  const cfg = { ...DEFAULTS, intensity: 100, show_frost: true };
  const s = computeScene({ condition: 'unavailable', neutral: true, elevation: 30, moonPhase: 0.5, temperature: -8, pm25: 160, warning: 2 }, cfg);
  r.setScene(s);
  return { frost: +s.frost.toFixed(2), smog: +s.smog.toFixed(2), warning: s.warning, sun: s.sun, clouds: s.cloudCount, fog: s.fog, rain: s.rain };
});
await page.waitForTimeout(1200);
await page.screenshot({ path: `${outDir}/neutral-static-fx.png` });
console.log(JSON.stringify(out), 'errors', JSON.stringify(errs));
await browser.close();
