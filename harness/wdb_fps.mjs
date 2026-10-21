// Count loop() callbacks vs drawn frames for 3 s of rain at each quality, then after rapid stop/kick pairs.
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const f of process.argv.slice(2)) {
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  await page.setContent('<html><body style="margin:0"></body></html>');
  await page.addScriptTag({ content: fs.readFileSync(f, 'utf8') });
  const res = await page.evaluate(async () => {
    const out = {};
    let raf = 0; const orig = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => orig((t) => { raf++; cb(t); });
    const r = new SkyRenderer(); r.mount(document.body);
    const cfg = { intensity: 100, sun_azimuth: true, show_rainbow: true };
    let calls = 0, draws = 0; const L = r.loop.bind(r), D = r.draw.bind(r);
    r.loop = (t) => { calls++; L(t); }; r._loop = (t) => r.loop(t); r.draw = (ts) => { draws++; D(ts); };
    for (const q of ['low', 'auto', 'high']) {
      r.setMode({ animate: true, quality: q, flash: false });
      r.setScene(computeScene({ condition: 'rainy', elevation: 20 }, cfg));
      r.kick();
      await new Promise((ok) => setTimeout(ok, 500));
      calls = draws = raf = 0;
      await new Promise((ok) => setTimeout(ok, 3000));
      out[q] = { callsPerS: +(calls / 3).toFixed(1), drawsPerS: +(draws / 3).toFixed(1), rafPerS: +(raf / 3).toFixed(1) };
      r.stop();
      await new Promise((ok) => setTimeout(ok, 200));
    }
    r.setMode({ animate: true, quality: 'low', flash: false });
    r.kick();
    for (let i = 0; i < 5; i++) { r.stop(); r.kick(); await new Promise((ok) => setTimeout(ok, 7)); }
    await new Promise((ok) => setTimeout(ok, 300));
    calls = draws = raf = 0;
    await new Promise((ok) => setTimeout(ok, 3000));
    out.afterStopKick = { callsPerS: +(calls / 3).toFixed(1), drawsPerS: +(draws / 3).toFixed(1) };
    r.stop();
    calls = 0;
    await new Promise((ok) => setTimeout(ok, 500));
    out.callsAfterStop = calls;
    return out;
  });
  console.log(f.split('/').pop(), JSON.stringify(res));
  await page.close();
}
await browser.close();
