// Usage: render.mjs <build.js> <outdir>. Render the neutral scene (day, dusk, night) with SkyRenderer and screenshot it; reports page errors.
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
for (const [name, el] of [['day', 30], ['dusk', -3], ['night', -25]]) {
  await page.evaluate((el) => {
    window.r = window.r || (() => { const r = new SkyRenderer(); r.mount(document.body); return r; })();
    r.setMode({ animate: true, quality: 'auto', flash: false });
    const cfg = { ...DEFAULTS, intensity: 100, show_moon: true, show_stars: true, show_rainbow: true };
    r.setScene(computeScene({ condition: 'unavailable', neutral: true, elevation: el, moonPhase: 0.5 }, cfg));
    r.kick();
  }, el);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${outDir}/neutral-${name}.png` });
}
console.log('errors', JSON.stringify(errs));
await browser.close();
