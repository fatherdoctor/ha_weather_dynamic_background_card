// Load builds in order as classic scripts on one page; report warnings, errors, the running version and manager count.
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const combo of process.argv.slice(2)) {
  const files = combo.split(',');
  const page = await browser.newPage();
  const log = [];
  page.on('pageerror', (e) => log.push('ERROR ' + e));
  page.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') log.push(m.type() + ' ' + m.text()); });
  await page.setContent('<html><body></body></html>');
  for (const f of files) await page.addScriptTag({ content: `{\n${fs.readFileSync(f, 'utf8')}\n}` });
  const info = await page.evaluate(() => ({
    managerVersion: window.__haWeatherDynamicBackground?.version ?? null,
    defined: !!customElements.get('ha-weather-dynamic-background-card'),
    customCards: (window.customCards || []).length,
  }));
  console.log(files.map((f) => f.split('/').pop()).join(' + '), JSON.stringify(info));
  for (const l of log) console.log('   ', l);
  await page.close();
}
await browser.close();
