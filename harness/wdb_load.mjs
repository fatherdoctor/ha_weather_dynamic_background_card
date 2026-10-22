// Review checks (WDB1ar): drawn frames per second under a busy main thread (a ~9 ms block every 16 ms, quality high),
// then watchdog() on a healthy and on a stalled loop, and release(): one request pending at most, none after release.
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const f of process.argv.slice(2)) {
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  await page.setContent('<html><body style="margin:0"></body></html>');
  await page.addScriptTag({ content: fs.readFileSync(f, 'utf8') });
  const res = await page.evaluate(async () => {
    const out = {};
    const r = new SkyRenderer(); r.mount(document.body);
    const cfg = { intensity: 100, sun_azimuth: true, show_rainbow: true };
    let draws = 0; const D = r.draw.bind(r); r.draw = (ts) => { draws++; D(ts); };
    for (const q of ['high']) {
      r.setMode({ animate: true, quality: q, flash: false });
      r.setScene(computeScene({ condition: 'rainy', elevation: 20 }, cfg));
      r.kick();
      await new Promise((ok) => setTimeout(ok, 500));
      const busy = setInterval(() => { const e = performance.now() + 9; while (performance.now() < e); }, 16);
      await new Promise((ok) => setTimeout(ok, 500));
      draws = 0;
      await new Promise((ok) => setTimeout(ok, 5000));
      out[q + "Busy"] = +(draws / 5).toFixed(1);
      clearInterval(busy);
      r.stop();
    }
    // a stop() with a timer pending, then kick(): exactly one chain; and a watchdog() call mid-chain restarts nothing
    if (!r.watchdog) return out;
    r.setMode({ animate: true, quality: "low", flash: false }); r.kick();
    await new Promise((ok) => setTimeout(ok, 300));
    const before = { raf: r.rafId, timer: r.waitTimer, running: r.running };
    r.watchdog();
    const after = { raf: r.rafId, timer: r.waitTimer, running: r.running };
    out.watchdogMidChain = { before, after, same: before.raf === after.raf && before.timer === after.timer };
    r.lastWall = performance.now() - 6000; // pretend the loop stalled
    r.watchdog();
    out.watchdogStalled = { running: r.running, pending: !!(r.rafId || r.waitTimer) };
    draws = 0; await new Promise((ok) => setTimeout(ok, 1000)); out.drawsAfterWatchdog = draws;
    r.release(); draws = 0; await new Promise((ok) => setTimeout(ok, 500)); out.drawsAfterRelease = draws;
    out.pendingAfterRelease = !!(r.rafId || r.waitTimer);
    return out;
  });
  console.log(f.split('/').pop(), JSON.stringify(res));
  await page.close();
}
await browser.close();
