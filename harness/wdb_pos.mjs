// Compare sun and rainbow placement between two builds of the card, transitions off.
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const [,, dir] = process.argv;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const out = {};
for (const name of ['old', 'new']) {
  for (const [w, h] of [[1280, 800], [800, 1280]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.setContent('<html><body style="margin:0;background:#000"></body></html>');
    await page.addScriptTag({ content: fs.readFileSync(`${dir}/${name}.js`, 'utf8') });
    const res = await page.evaluate(async () => {
      const r = new SkyRenderer();
      r.mount(document.body);
      const st = document.createElement('style');
      st.textContent = '*{transition:none!important}';
      r.el.shadowRoot.appendChild(st);
      r.setMode({ animate: false, quality: 'low', flash: false });
      const cfg = { intensity: 100, sun_azimuth: true, show_rainbow: true };
      const out = [];
      for (const [az, el] of [[120, 14], [250, 5], [200, 30]]) {
        const scene = computeScene({ condition: 'partlycloudy', coverage: 40, elevation: el, azimuth: az, rainbow: true }, cfg);
        r.setScene(scene);
        await new Promise((ok) => setTimeout(ok, 50));
        const c = (id) => { const b = r.el.shadowRoot.getElementById(id).getBoundingClientRect(); return [+(b.x + b.width / 2).toFixed(1), +(b.y + b.height / 2).toFixed(1), +b.width.toFixed(1)]; };
        out.push({ az, el, sunX: scene.sunX, sunY: scene.sunY, rainbow: scene.rainbow, sun: c('sun'), rb: c('rainbow'),
          blend: (r.el.shadowRoot.getElementById('rainbow').parentElement ? getComputedStyle(r.el.shadowRoot.getElementById('rainbow').parentElement).mixBlendMode : '-') + '/' + getComputedStyle(r.el.shadowRoot.getElementById('rainbow')).mixBlendMode });
      }
      return out;
    });
    await page.screenshot({ path: `${dir}/${name}-${w}x${h}.png` });
    out[`${name} ${w}x${h}`] = res;
    await page.close();
  }
}
await browser.close();
console.log(JSON.stringify(out, null, 1));
