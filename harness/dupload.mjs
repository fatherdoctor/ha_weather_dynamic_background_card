// Usage: dupload.mjs <a.js> <b.js>. Load two builds the way HA loads a `type: js` resource (classic scripts, shared global scope) and as real module scripts.
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const [a, b] = process.argv.slice(2);
for (const mode of ['classic', 'module']) {
  const page = await browser.newPage();
  const log = [];
  page.on('pageerror', (e) => log.push('ERROR ' + String(e).slice(0, 160)));
  page.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') log.push(m.type() + ' ' + m.text().slice(0, 200)); });
  await page.setContent('<html><body></body></html>');
  for (const f of [a, b]) {
    if (mode === 'classic') await page.addScriptTag({ content: fs.readFileSync(f, 'utf8') });
    else await page.addScriptTag({ type: 'module', content: fs.readFileSync(f, 'utf8') });
    await page.waitForTimeout(100);
  }
  const info = await page.evaluate(() => ({
    managerVersion: window.__haWeatherDynamicBackground?.version ?? null,
    defined: !!customElements.get('ha-weather-dynamic-background-card'),
    customCards: (window.customCards || []).length,
  }));
  console.log(mode, a.split('/').pop(), '+', b.split('/').pop(), JSON.stringify(info));
  for (const l of log) console.log('   ', l);
  await page.close();
}
await browser.close();
