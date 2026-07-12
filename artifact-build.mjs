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

console.log('body bytes:', body.length);
console.log('@import removed:', !/@import/.test(css));
console.log('leftover font-url garbage:', css.slice(0, 80));
