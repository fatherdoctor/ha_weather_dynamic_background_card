// Pixel-diff two PNGs in Chromium: prints changed-pixel count and max channel delta.
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const [,, a, b] = process.argv;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
const r = await page.evaluate(async ([a, b]) => {
  const load = (s) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = 'data:image/png;base64,' + s; });
  const [ia, ib] = [await load(a), await load(b)];
  const px = (i) => { const c = new OffscreenCanvas(i.width, i.height); const x = c.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, i.width, i.height).data; };
  const [da, db] = [px(ia), px(ib)];
  let n = 0, m = 0;
  for (let k = 0; k < da.length; k += 4) { const d = Math.max(Math.abs(da[k] - db[k]), Math.abs(da[k + 1] - db[k + 1]), Math.abs(da[k + 2] - db[k + 2])); if (d > 0) n++; if (d > m) m = d; }
  return { pixels: da.length / 4, changed: n, maxDelta: m };
}, [fs.readFileSync(a).toString('base64'), fs.readFileSync(b).toString('base64')]);
console.log(JSON.stringify(r));
await browser.close();
