#!/usr/bin/env node
// Soundeffekte aus einer Cue-Liste in die Komposition schreiben.
//
//   node scripts/sfx.mjs reels/<slug>          (npm run sfx -- reels/<slug>)
//
// reels/<slug>/sfx.json:
//   [ { "t": 1.25, "s": "pop" }, { "t": 2.0, "s": "whoosh-fast", "v": 0.6, "note": "Karte rein" } ]
//   t = Zeitpunkt in Sekunden (Reel-Zeit), s = Datei aus assets/sfx/ ohne .mp3, v = Lautstärke (optional)
//
// Schreibt <audio data-capcut="sfx"> zwischen <!-- SFX:START --> und <!-- SFX:END --> in index.html
// (Marker werden vor </div> des Root angelegt, falls nicht vorhanden) und kopiert die Bibliothek ins Reel.

import { cpSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const STUDIO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LIB = join(STUDIO, "assets/sfx");
const reelDir = resolve(process.argv[2] || ".");
const cues = JSON.parse(readFileSync(join(reelDir, "sfx.json"), "utf8"));
const indexPath = join(reelDir, "index.html");
let html = readFileSync(indexPath, "utf8");

// Standard-Lautstärken (siehe assets/sfx/README.md)
// Bibliothek ist auf −20 dBFS Spitzen-RMS normalisiert; 1.0 ≈ 5 dB unter der Stimme.
const DEFAULT_VOL = {
  "pop": 0.6,
  "pop-high": 0.55,
  "pop-low": 0.55,
  "whoosh": 0.55,
  "whoosh-fast": 0.55,
  "whoosh-short": 0.55,
  "whoosh-deep": 0.6,
  "whoosh-reverse": 0.5,
  "whoosh-cinematic": 0.6,
  "typing": 0.5,
  "key-press": 0.5,
  "click": 0.6,
  "click-soft": 0.55,
  "tick": 0.5,
  "counter-roll": 0.55,
  "ping": 0.6,
  "sparkle": 0.5,
  "impact-short": 0.7,
  "impact-bass-1": 0.65,
  "impact-bass-2": 0.65,
  "riser": 0.5,
  "riser-short": 0.5,
  "error": 0.6,
  "glitch-short": 0.55,
  "glitch-1": 0.5,
  "glitch-2": 0.45,
  "glitch-3": 0.5,
  "chime": 0.5,
  "notification": 0.5,
};

const durCache = {};
function duration(name) {
  if (!(name in durCache)) {
    durCache[name] = Number(
      execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", join(LIB, `${name}.mp3`)], { encoding: "utf8" }),
    );
  }
  return durCache[name];
}

const rootDur = Number(html.match(/data-composition-id="main"[\s\S]*?data-duration="([\d.]+)"/)?.[1] ?? Infinity);
// Überlappende Effekte auf eigene Spuren verteilen (Spur 10, 11, 12 …), sonst warnt der Linter
const laneEnds = [];
const tags = cues
  .slice()
  .sort((a, b) => a.t - b.t)
  .map((c, i) => {
    if (!existsSync(join(LIB, `${c.s}.mp3`))) throw new Error(`Unbekannter Sound "${c.s}" (Cue ${i}, t=${c.t})`);
    const d = Math.min(duration(c.s), rootDur - c.t);
    if (d <= 0.02) return null;
    const v = c.v ?? DEFAULT_VOL[c.s] ?? 0.55;
    let lane = laneEnds.findIndex((end) => end <= c.t);
    if (lane === -1) lane = laneEnds.push(0) - 1;
    laneEnds[lane] = c.t + d;
    const note = c.note ? ` <!-- ${c.note.replace(/--/g, "–")} -->` : "";
    return `      <audio id="sfx-${String(i + 1).padStart(3, "0")}" data-capcut="sfx" src="assets/sfx/${c.s}.mp3" data-start="${c.t}" data-duration="${d.toFixed(3)}" data-track-index="${10 + lane}" data-volume="${v}"></audio>${note}`;
  })
  .filter(Boolean);

const block = `<!-- SFX:START (generiert von scripts/sfx.mjs aus sfx.json – nicht von Hand bearbeiten) -->\n${tags.join("\n")}\n      <!-- SFX:END -->`;
if (/<!-- SFX:START[\s\S]*?<!-- SFX:END -->/.test(html)) {
  html = html.replace(/<!-- SFX:START[\s\S]*?<!-- SFX:END -->/, block);
} else {
  // vor dem schließenden Tag des Root-Elements einfügen (letztes </div> vor dem Timeline-Script)
  const scriptIdx = html.lastIndexOf("<script>");
  const closeIdx = html.lastIndexOf("</div>", scriptIdx);
  html = html.slice(0, closeIdx) + `  ${block}\n    ` + html.slice(closeIdx);
}
writeFileSync(indexPath, html);
cpSync(LIB, join(reelDir, "assets/sfx"), { recursive: true });
console.log(`✓ ${tags.length} Soundeffekte in ${indexPath}`);
