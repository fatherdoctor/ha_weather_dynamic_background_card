// With transitions on: the sun and rainbow glide (midway after 3 s of 6 s) and the layout props never change.
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.setContent('<html><body style="margin:0"></body></html>');
await page.addScriptTag({ content: fs.readFileSync(process.argv[2], 'utf8') });
console.log(JSON.stringify(await page.evaluate(async () => {
  const r = new SkyRenderer(); r.mount(document.body); r.setMode({ animate: false, quality: 'low', flash: false });
  const cfg = { intensity: 100, sun_azimuth: true, show_rainbow: true };
  const $ = (id) => r.el.shadowRoot.getElementById(id);
  const cx = (id) => { const b = $(id).getBoundingClientRect(); return Math.round(b.x + b.width / 2); };
  r.setScene(computeScene({ condition: 'partlycloudy', coverage: 40, elevation: 10, azimuth: 120, rainbow: true }, cfg));
  await new Promise((ok) => setTimeout(ok, 6500));
  const a = [cx('sun'), cx('rainbow')];
  r.setScene(computeScene({ condition: 'partlycloudy', coverage: 40, elevation: 10, azimuth: 240, rainbow: true }, cfg));
  await new Promise((ok) => setTimeout(ok, 3000));
  const m = [cx('sun'), cx('rainbow'), getComputedStyle($('sun')).left, getComputedStyle($('rainbow')).left];
  await new Promise((ok) => setTimeout(ok, 3500));
  return { start: a, mid: m, end: [cx('sun'), cx('rainbow')] };
})));
await browser.close();
