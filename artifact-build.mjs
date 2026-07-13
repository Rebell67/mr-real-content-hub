import fs from 'fs';

// Build a body-only HTML file for the Artifact host. Instead of a <style> tag
// (which the publish pipeline stripped last time), the CSS is embedded as a
// JS string and injected at runtime – it cannot get lost that way.
const cssFile = fs.readdirSync('dist/assets').find((f) => f.endsWith('.css'));
const jsFile = fs.readdirSync('dist/assets').find((f) => f.endsWith('.js'));
let css = fs.readFileSync('dist/assets/' + cssFile, 'utf8');
const js = fs.readFileSync('dist/assets/' + jsFile, 'utf8');

// Strip the external Google-Fonts @import (blocked by the artifact CSP).
// Note: the import URL itself contains ";" so match up to the closing quote.
css = css.replace(/@import\s*(?:url\()?["'][^"']*["']\)?\s*;/g, '');

const cssJson = JSON.stringify(css);
const injector = `<script>(function(){var s=document.createElement('style');s.textContent=${cssJson};document.head.appendChild(s);document.title='Mr Real · Content OS';})();</script>`;

const safeJs = js.replace(/<\/script>/g, '<\\/script>');
const body = `${injector}\n<div id="root"></div>\n<script type="module">${safeJs}</script>\n`;
fs.writeFileSync('mr-real-content-os.html', body);

// Local test wrapper mimicking the Artifact skeleton (head/body wrap).
const test = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${body}</body></html>`;
fs.writeFileSync('dist/artifact-test.html', test);

// Full standalone file for running directly on a PC (double-click, no server).
// Loads the brand fonts from Google when online; falls back to system fonts offline.
const favicon = encodeURIComponent(fs.readFileSync('public/favicon.svg', 'utf8').trim());
const full = [
  '<!doctype html><html lang="de"><head>',
  '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
  '<title>Mr Real · Content OS</title>',
  `<link rel="icon" href="data:image/svg+xml,${favicon}">`,
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap">',
  `</head><body>${body}</body></html>`,
].join('');
fs.writeFileSync('MrReal-ContentOS.html', full);

console.log('artifact body bytes:', body.length);
console.log('standalone bytes:', full.length);
console.log('@import removed:', !/@import/.test(css));
