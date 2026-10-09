// Rendert follow.html Frame für Frame als transparente PNGs.
// Nutzung: node render.mjs <out-dir>
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const out = process.argv[2] ?? 'frames';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto('file://' + fileURLToPath(new URL('./follow.html', import.meta.url)));
await page.evaluate(() => document.fonts.ready);
const { fps, dur } = await page.evaluate(() => ({ fps: window.FPS, dur: window.DURATION }));
const n = Math.round(fps * dur);
for (let i = 0; i < n; i++) {
  await page.evaluate((t) => window.render(t), i / fps);
  await page.screenshot({ path: `${out}/f_${String(i).padStart(4, '0')}.png`, omitBackground: true });
}
await browser.close();
console.log(`${n} frames @ ${fps}fps`);
