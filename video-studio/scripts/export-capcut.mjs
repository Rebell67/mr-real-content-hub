#!/usr/bin/env node
// Reel → CapCut-Paket (getrennte Ebenen zum Nachbearbeiten)
//
//   node scripts/export-capcut.mjs reels/<slug>      (oder: npm run capcut -- reels/<slug>)
//
// Ergebnis in reels/<slug>/capcut/:
//   1-fertig.mp4        das komplette Reel (zum direkten Posten)
//   2-video.mp4         nur Bild + Stimme: Schnitte & Zooms, ohne Untertitel/Grafiken/Musik
//   3-overlays.mov      Untertitel + Grafiken mit Transparenz (ProRes 4444) – auf Spur über 2-video legen
//   4-untertitel.srt    Untertitel als Text (CapCut: Text → Untertitel importieren) – Alternative zu den gebrannten
//   5-musik.*/sfx/      Musik- und Soundeffekt-Dateien im Original (ohne Ducking)
//   LIESMICH.txt        Import-Anleitung
//
// Ebenen-Konvention in der Komposition (index.html des Reels):
//   data-capcut="base"   A-Roll/B-Roll-Videos (inkl. Ton der Stimme)
//   data-capcut="music"  Musik-<audio>
//   data-capcut="sfx"    Soundeffekt-<audio>
//   alles andere        = Overlay (Untertitel, Karten, Grafiken) – als Sub-Composition-Slot
//                         (leeres <div data-composition-src=…>) auf Root-Ebene, damit es sich abtrennen lässt

import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";

const HF = "hyperframes@0.8.138";
const reelDir = resolve(process.argv[2] || ".");
const slug = basename(reelDir);
const out = join(reelDir, "capcut");
const indexPath = join(reelDir, "index.html");
if (!existsSync(indexPath)) {
  console.error(`Keine index.html in ${reelDir}`);
  process.exit(1);
}
mkdirSync(join(out, "sfx"), { recursive: true });
const html = readFileSync(indexPath, "utf8");

// --- Varianten der Komposition erzeugen -------------------------------------

/**
 * Entfernt Elemente einer Ebene aus der Komposition. (data-hidden reicht nicht: Sub-Composition-
 * Slots werden damit beim Rendern nicht ausgeblendet.) Overlays sind laut Konvention leere
 * Slot-Elemente (Sub-Compositions) bzw. selbstschließende Clips auf Root-Ebene.
 */
function hideLayers(src, layers, { transparent = false, hideOverlays = false } = {}) {
  const element = /<(div|section|video|audio|img)\b([^>]*)>(\s*<\/\1>)?/g;
  let s = src.replace(element, (m, tag, attrs) => {
    const layer = attrs.match(/data-capcut="(\w+)"/)?.[1];
    if (layer) return layers.includes(layer) ? "" : m;
    const isRoot = /data-composition-id="main"/.test(attrs);
    const isClip = /\bdata-start=/.test(attrs);
    const isEmpty = m.endsWith(`</${tag}>`) || tag === "img";
    return hideOverlays && isClip && !isRoot && isEmpty ? "" : m;
  });
  if (transparent) {
    s = s.replace(
      "</head>",
      `<style>html,body,#root{background:transparent !important}</style>\n</head>`,
    );
  }
  return s;
}

function render(variantHtml, name, args) {
  const rel = `.capcut-${name}.html`;
  const file = join(reelDir, rel);
  writeFileSync(file, variantHtml);
  try {
    execFileSync("npx", ["--yes", HF, "render", "-c", rel, ...args], { cwd: reelDir, stdio: "inherit" });
  } finally {
    rmSync(file, { force: true });
  }
}

console.log("\n▸ 1/4 Fertiges Reel");
const finalExisting = join(reelDir, "renders", `${slug}.mp4`);
if (existsSync(finalExisting) && process.argv.includes("--reuse-final")) {
  copyFileSync(finalExisting, join(out, "1-fertig.mp4"));
} else {
  execFileSync("npx", ["--yes", HF, "render", "-o", join(out, "1-fertig.mp4")], { cwd: reelDir, stdio: "inherit" });
}

console.log("\n▸ 2/4 Video-Ebene (Bild + Stimme)");
render(hideLayers(html, ["music", "sfx"], { hideOverlays: true }), "video", ["-o", join(out, "2-video.mp4")]);

console.log("\n▸ 3/4 Overlay-Ebene (transparent)");
render(hideLayers(html, ["base", "music", "sfx"], { transparent: true }), "overlays", [
  "--format", "mov", "-o", join(out, "3-overlays.mov"),
]);

console.log("\n▸ 4/4 Untertitel & Audio-Dateien");
const capPath = existsSync(join(reelDir, "captions.json")) ? join(reelDir, "captions.json") : join(reelDir, "transcript.json");
if (existsSync(capPath)) {
  writeFileSync(join(out, "4-untertitel.srt"), toSrt(JSON.parse(readFileSync(capPath, "utf8"))));
}
const audioFiles = [...html.matchAll(/<audio\b[^>]*>/g)].map((m) => m[0]);
let musicN = 0;
for (const tag of audioFiles) {
  const src = tag.match(/\ssrc="([^"]+)"/)?.[1];
  const layer = tag.match(/data-capcut="(\w+)"/)?.[1];
  if (!src || !existsSync(join(reelDir, src))) continue;
  if (layer === "music") copyFileSync(join(reelDir, src), join(out, `5-musik${musicN++ ? `-${musicN}` : ""}${extname(src)}`));
  else if (layer === "sfx") copyFileSync(join(reelDir, src), join(out, "sfx", basename(src)));
}

writeFileSync(
  join(out, "LIESMICH.txt"),
  `CapCut-Paket: ${slug}

Schnell posten: 1-fertig.mp4 – fertig, nichts zu tun.

Nachbearbeiten in CapCut (Desktop):
 1. Neues Projekt 9:16 → 2-video.mp4 auf die Hauptspur (Schnitte, Zooms und Stimme sind drin).
 2. 3-overlays.mov darüber auf eine Overlay-Spur, bei 0:00 ausrichten
    (Untertitel + Grafiken, transparent). Einzelne Stellen ausblenden: Clip teilen + Teil löschen.
 3. Untertitel lieber in CapCut editierbar? Statt 3-overlays.mov:
    Text → Untertitel → Lokale Untertitel importieren → 4-untertitel.srt, dann CapCut-Stil wählen.
 4. Musik: 5-musik.* auf eine Audiospur (Lautstärke ca. −20 dB, unter der Stimme) –
    oder in Instagram einen Trend-Sound wählen.
 5. Soundeffekte liegen in sfx/ (Zeitpunkte siehe 1-fertig.mp4).
`,
);
console.log(`\n✓ CapCut-Paket: ${out}`);

// ---------------------------------------------------------------------------

function toSrt(input) {
  const words = (Array.isArray(input) ? input : input.words || []).filter((w) => w.text);
  const cues = [];
  let cur = [];
  for (const w of words) {
    const first = cur[0];
    if (first && (cur.length >= 3 || w.end - first.start > 1.4 || /[.!?,:;]$/.test(cur.at(-1).text))) {
      cues.push(cur);
      cur = [];
    }
    cur.push(w);
  }
  if (cur.length) cues.push(cur);
  return cues
    .map((c, i) => {
      const end = Math.min(c.at(-1).end, cues[i + 1]?.[0].start ?? Infinity);
      return `${i + 1}\n${ts(c[0].start)} --> ${ts(end)}\n${c.map((w) => w.text).join(" ")}\n`;
    })
    .join("\n");
}

function ts(sec) {
  const ms = Math.max(0, Math.round(sec * 1000));
  const p = (n, l = 2) => String(n).padStart(l, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
}
