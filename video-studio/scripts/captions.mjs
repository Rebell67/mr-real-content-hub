#!/usr/bin/env node
// Wort-für-Wort-Untertitel als Sub-Composition erzeugen.
//
//   node scripts/captions.mjs reels/<slug>          (npm run captions -- reels/<slug>)
//
// Quelle: reels/<slug>/captions.json, sonst transcript.json.
// captions.json (optional, zum Korrigieren & Steuern):
//   {
//     "words": [ { "text": "Diesen", "start": 0.12, "end": 0.37 }, … ],   // korrigiertes Transkript
//     "highlight": ["Nebenkosten", "Kaufpreis"],    // Wörter in Brand-Grün
//     "hide": [[3.2, 6.0]],                         // Zeitfenster ohne Untertitel (z. B. Hook-Karte)
//     "maxWords": 2, "maxChars": 16,                // Chunk-Größe
//     "y": 1180,                                     // vertikale Position (Mitte), px von oben
//     "box": true                                    // dunkle Pille hinter dem Text (bei hellem Bild)
//   }
// Zahlen, %, € werden automatisch Gold. Ausgabe: reels/<slug>/compositions/mr-captions.html
// Einbinden in index.html als Slot (siehe CLAUDE.md).

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const reelDir = resolve(process.argv[2] || ".");
const cfgPath = existsSync(join(reelDir, "captions.json")) ? join(reelDir, "captions.json") : null;
const cfg = cfgPath ? JSON.parse(readFileSync(cfgPath, "utf8")) : {};
const words = (cfg.words || JSON.parse(readFileSync(join(reelDir, "transcript.json"), "utf8"))).filter((w) => w.text?.trim());
const maxWords = cfg.maxWords ?? 2;
const maxChars = cfg.maxChars ?? 16;
const y = cfg.y ?? 1180;
const box = cfg.box ?? false; // dunkle Hinterlegung (z. B. bei hellem Hemd/Hintergrund)
const hide = cfg.hide || [];
const highlight = new Set((cfg.highlight || []).map(bare));

// --- Chunks bilden ---------------------------------------------------------
const chunks = [];
let cur = [];
for (const w of words) {
  const text = cur.map((c) => c.text).join(" ");
  const breakBefore =
    cur.length >= maxWords ||
    (cur.length && (text + " " + w.text).length > maxChars) ||
    (cur.length && /[.!?,:;]$/.test(cur.at(-1).text)) ||
    (cur.length && w.start - cur.at(-1).end > 0.35) ||
    (cur.length && (isStrong(w) || isStrong(cur.at(-1)))); // starke Wörter stehen allein
  if (breakBefore) {
    chunks.push(cur);
    cur = [];
  }
  cur.push(w);
}
if (cur.length) chunks.push(cur);

const items = chunks
  .map((c, i) => {
    const start = c[0].start;
    const nextStart = chunks[i + 1]?.[0].start ?? c.at(-1).end + 0.4;
    const end = Math.min(Math.max(c.at(-1).end + 0.15, start + 0.25), nextStart);
    return { words: c, start, end };
  })
  .filter((c) => !hide.some(([a, b]) => c.start < b && c.end > a));

// --- HTML -----------------------------------------------------------------
const spans = items
  .map((c, i) => {
    const inner = c.words
      .map((w) => {
        const t = clean(w.text);
        const cls = isNumber(t) ? "num" : highlight.has(bare(t)) ? "hl" : "";
        return cls ? `<em class="${cls}">${esc(t)}</em>` : esc(t);
      })
      .join(" ");
    return `        <div class="cap" id="cap-${i}"><span class="pill">${inner}</span></div>`;
  })
  .join("\n");

const tweens = items
  .map(
    (c, i) =>
      `          [${c.start.toFixed(3)}, ${c.end.toFixed(3)}, ${c.words.some((w) => isStrong(w)) ? 1 : 0}]`,
  )
  .join(",\n");

const out = `<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <!-- generiert von scripts/captions.mjs – Änderungen in captions.json, dann neu erzeugen -->
  </head>
  <body>
    <template>
      <style>
        @font-face {
          font-family: "Space Grotesk";
          src: url("assets/fonts/SpaceGrotesk-Variable.woff2") format("woff2");
          font-weight: 300 700;
        }
        #root {
          position: absolute;
          inset: 0;
        }
        .cap {
          position: absolute;
          left: 60px;
          right: 60px;
          top: ${y - 60}px;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          font-family: "Space Grotesk", sans-serif;
          font-weight: 700;
          font-size: 84px;
          letter-spacing: -0.02em;
          color: #ffffff;
          text-shadow: 0 4px 0 rgba(0, 0, 0, 0.55), 0 0 24px rgba(0, 0, 0, 0.6);
          -webkit-text-stroke: 2px rgba(8, 10, 15, 0.55);
          white-space: nowrap;
        }
        .cap em {
          font-style: normal;
          margin: 0 0.18em;
        }
        .cap em:first-child { margin-left: 0; }
        .cap em:last-child { margin-right: 0; }
        .cap .pill {
          display: inline-block;
          ${box ? "padding: 8px 30px 14px; border-radius: 26px; background: rgba(8, 10, 15, 0.82); box-shadow: 0 14px 34px -10px rgba(0, 0, 0, 0.6);" : ""}
        }
        .cap .hl { color: #00c389; }
        .cap .num { color: #f7c14b; }
      </style>
      <div id="root" data-composition-id="mr-captions" data-width="1080" data-height="1920">
${spans}
      </div>
      <script>
        (() => {
          // [start, end, stark]
          const cues = [
${tweens}
          ];
          const tl = gsap.timeline({ paused: true });
          cues.forEach(([start, end, strong], i) => {
            const el = "#cap-" + i;
            tl.set(el, { opacity: 1 }, start);
            tl.fromTo(
              el,
              { scale: strong ? 1.35 : 0.82, y: strong ? 0 : 14 },
              { scale: 1, y: 0, duration: strong ? 0.22 : 0.14, ease: strong ? "back.out(2.2)" : "power2.out" },
              start,
            );
            tl.set(el, { opacity: 0 }, end);
          });
          window.__timelines["mr-captions"] = tl;
        })();
      </script>
    </template>
  </body>
</html>
`;
writeFileSync(join(reelDir, "compositions", "mr-captions.html"), out);
console.log(`✓ ${items.length} Untertitel-Einblendungen → compositions/mr-captions.html`);

function bare(t) {
  return String(t).toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
}
function clean(t) {
  // Satzzeichen am Ende weglassen (wirkt in Kurz-Untertiteln ruhiger), Zahlen behalten ihr %/€
  return String(t).trim().replace(/[.,;:!?]+$/u, "");
}
function isNumber(t) {
  return /\d/.test(t) || /^(prozent|euro|€|%|tausend|millionen?)$/i.test(bare(t));
}
function isStrong(w) {
  const t = clean(w.text);
  return isNumber(t) || highlight.has(bare(t));
}
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
