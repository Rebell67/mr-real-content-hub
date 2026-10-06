#!/usr/bin/env node
// Rohclip → vorbereitetes Reel-Projekt (reels/<slug>/)
//
//   node scripts/new-reel.mjs <rohclip.mp4> [slug] [Optionen]
//   npm run new-reel -- assets/footage/clip.mov besichtigung-tipps
//
// Schritte:
//   1. Reel-Ordner aus dem Brand-Kit anlegen (Fonts, Bausteine, hyperframes.json)
//   2. Rohclip analysieren (Auflösung, fps, HDR, Dauer)
//   3. Pass 1: Pausen (Audio-Stille) raus → 9:16 / 1080×1920 / 30 fps, SDR, −14 LUFS
//   4. Transkribieren (Whisper, Deutsch)
//   5. Pass 2: Füllwörter („äh", „ähm" …) raus, neu transkribieren
//   6. Ergebnis: assets/tight.mp4 + transcript.json (Wort-Timing für Untertitel) + edit.json
//
// Optionen:
//   --silence-db <dB>     Stille-Schwelle (Standard −35)
//   --min-silence <s>     kürzeste Pause, die rausfliegt (Standard 0.45)
//   --pad <s>             Luft vor/nach Sprache (Standard 0.12)
//   --no-fillers          Füllwörter nicht schneiden
//   --model <name>        Whisper-Modell (Standard small; medium/large-v3 = genauer)
//   --force               bestehenden Reel-Ordner überschreiben

import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, renameSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const HF = "hyperframes@0.8.138";
const STUDIO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FILLERS = ["äh", "ähm", "öh", "öhm", "hm", "hmm", "mhm", "ehm", "em", "äääh"];

const { values: opt, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    "silence-db": { type: "string", default: "-35" },
    "min-silence": { type: "string", default: "0.45" },
    pad: { type: "string", default: "0.12" },
    "no-fillers": { type: "boolean", default: false },
    model: { type: "string", default: "small" },
    force: { type: "boolean", default: false },
  },
});

const [input, slugArg] = positionals;
if (!input || !existsSync(input)) {
  console.error("Aufruf: npm run new-reel -- <rohclip> [slug]");
  process.exit(1);
}
const slug = slugify(slugArg || basename(input, extname(input)));
const reelDir = join(STUDIO, "reels", slug);
const pad = Number(opt.pad);
const minSilence = Number(opt["min-silence"]);

if (existsSync(reelDir) && !opt.force) {
  console.error(`reels/${slug} existiert schon (--force zum Überschreiben).`);
  process.exit(1);
}

step(`Reel-Ordner reels/${slug}`);
mkdirSync(join(reelDir, "assets"), { recursive: true });
cpSync(join(STUDIO, "assets/fonts"), join(reelDir, "assets/fonts"), { recursive: true });
cpSync(join(STUDIO, "compositions"), join(reelDir, "compositions"), { recursive: true });
cpSync(join(STUDIO, "hyperframes.json"), join(reelDir, "hyperframes.json"));
writeFileSync(
  join(reelDir, "meta.json"),
  JSON.stringify({ id: slug, name: slug, source: basename(input) }, null, 2) + "\n",
);
writeFileSync(
  join(reelDir, "package.json"),
  JSON.stringify(
    {
      name: `reel-${slug}`,
      private: true,
      type: "module",
      scripts: {
        dev: `npx --yes ${HF} preview`,
        check: `npx --yes ${HF} check`,
        snapshot: `npx --yes ${HF} snapshot`,
        render: `npx --yes ${HF} render -o renders/${slug}.mp4`,
      },
    },
    null,
    2,
  ) + "\n",
);
const rawPath = join(reelDir, "assets", `raw${extname(input).toLowerCase()}`);
cpSync(input, rawPath);

step("Rohclip analysieren");
const info = probe(rawPath);
console.log(
  `  ${info.width}×${info.height} · ${info.fps.toFixed(2)} fps · ${info.duration.toFixed(1)} s` +
    `${info.hdr ? " · HDR → wird nach SDR gemappt" : ""}${info.hasAudio ? "" : " · KEIN AUDIO"}`,
);
if (!info.hasAudio) {
  console.error("Der Clip hat keine Tonspur – Pausenschnitt nicht möglich.");
  process.exit(1);
}

step("Pass 1: Pausen raus (Audio-Stille)");
const silences = detectSilence(rawPath, opt["silence-db"], minSilence, info.duration);
const pauseRemovals = silences
  .map((s) => ({ start: s.start + pad, end: s.end - pad }))
  .filter((r) => r.end - r.start > 0.05);
const keep = invert(merge(pauseRemovals), info.duration).filter((k) => k.end - k.start >= 0.2);
const kept = keep.reduce((s, k) => s + k.end - k.start, 0);
console.log(
  `  ${silences.length} Pausen → ${keep.length} Segmente, ` +
    `${kept.toFixed(1)} s von ${info.duration.toFixed(1)} s (−${(info.duration - kept).toFixed(1)} s)`,
);
const tightPath = join(reelDir, "assets", "tight.mp4");
const pass1Path = join(reelDir, "assets", "pass1.mp4");
cutAndConcat(rawPath, keep, pass1Path, info);

step("Transkribieren (Whisper, de)");
let words = transcribe(pass1Path, join(reelDir, "transcript.json"));
console.log(`  ${words.length} Wörter`);

// Füllwörter auf dem bereits pausenfreien Clip schneiden: dort ist das Wort-Timing
// von Whisper deutlich genauer als auf dem Rohclip mit langen Stillen.
let fillerRemovals = [];
if (!opt["no-fillers"]) {
  fillerRemovals = words
    .map((w, i) => ({ w, next: words[i + 1], prev: words[i - 1] }))
    .filter(({ w }) => FILLERS.includes(bare(w.text)))
    .map(({ w, next, prev }) => ({
      start: Math.max(w.start - 0.02, prev ? prev.end : 0),
      end: Math.min(w.end, next ? next.start : w.end),
      text: w.text,
    }));
}
const pass1Info = probe(pass1Path);
let keep2 = [{ start: 0, end: pass1Info.duration }];
if (fillerRemovals.length) {
  step(`Pass 2: ${fillerRemovals.length} Füllwörter raus (${fillerRemovals.map((f) => f.text).join(" ")})`);
  keep2 = invert(merge(fillerRemovals), pass1Info.duration).filter((k) => k.end - k.start >= 0.12);
  cutAndConcat(pass1Path, keep2, tightPath, { ...pass1Info, hdr: false });
  rmSync(pass1Path);
  words = transcribe(tightPath, join(reelDir, "transcript.json"));
} else {
  renameSync(pass1Path, tightPath);
}
const tightInfo = probe(tightPath);

writeFileSync(
  join(reelDir, "edit.json"),
  JSON.stringify(
    {
      source: basename(input),
      raw: info,
      settings: { silenceDb: Number(opt["silence-db"]), minSilence, pad, fillers: !opt["no-fillers"], model: opt.model },
      pass1: { removedPauses: merge(pauseRemovals).map((r) => ({ start: r3(r.start), end: r3(r.end) })), keep: keep.map((k) => ({ start: r3(k.start), end: r3(k.end) })) },
      pass2: { removedFillers: fillerRemovals.map((r) => ({ text: r.text, start: r3(r.start), end: r3(r.end) })), keep: keep2.map((k) => ({ start: r3(k.start), end: r3(k.end) })) },
      tight: { duration: r3(tightInfo.duration), words: words.length },
    },
    null,
    2,
  ) + "\n",
);

console.log(`
✓ reels/${slug} bereit
  assets/tight.mp4     ${tightInfo.duration.toFixed(1)} s, Pausen raus
  transcript.json      ${words.length} Wörter mit Timing
  edit.json            Schnittliste

Text: ${words.map((w) => w.text).join(" ").slice(0, 400)}${words.length > 60 ? " …" : ""}
`);

// ---------------------------------------------------------------------------

function step(msg) {
  console.log(`\n▸ ${msg}`);
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "reel";
}

function bare(t) {
  return String(t).toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
}

function r3(n) {
  return Math.round(n * 1000) / 1000;
}

function probe(file) {
  const out = execFileSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration:stream=codec_type,width,height,r_frame_rate,color_transfer:stream_side_data=rotation", "-of", "json", file],
    { encoding: "utf8" },
  );
  const j = JSON.parse(out);
  const v = j.streams.find((s) => s.codec_type === "video") || {};
  const [n, d] = String(v.r_frame_rate || "30/1").split("/").map(Number);
  const rotation = Math.abs(Number(v.side_data_list?.find((x) => x.rotation != null)?.rotation || 0));
  const swap = rotation === 90 || rotation === 270;
  return {
    width: swap ? v.height : v.width,
    height: swap ? v.width : v.height,
    fps: d ? n / d : 30,
    duration: Number(j.format.duration),
    hdr: ["arib-std-b67", "smpte2084"].includes(v.color_transfer),
    hasAudio: j.streams.some((s) => s.codec_type === "audio"),
  };
}

function transcribe(file, outJson) {
  const tmp = mkdtempSync(join(tmpdir(), "reel-tx-"));
  try {
    const r = spawnSync(
      "npx",
      ["--yes", HF, "transcribe", file, "-d", tmp, "--model", opt.model, "--language", "de", "--json"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    if (r.status !== 0) throw new Error(`Transkription fehlgeschlagen:\n${r.stderr.slice(-2000)}`);
    const raw = JSON.parse(readFileSync(join(tmp, "transcript.json"), "utf8"));
    const words = (Array.isArray(raw) ? raw : raw.words || [])
      .map((w) => ({ text: String(w.text ?? w.word ?? "").trim(), start: Number(w.start), end: Number(w.end) }))
      .filter((w) => w.text && Number.isFinite(w.start) && Number.isFinite(w.end));
    writeFileSync(outJson, JSON.stringify(words, null, 1) + "\n");
    return words;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

function detectSilence(file, db, minDur, duration) {
  const r = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-nostdin", "-i", file, "-vn", "-af", `silencedetect=noise=${db}dB:d=${minDur}`, "-f", "null", "-"],
    { encoding: "utf8" },
  );
  const out = [];
  let start = null;
  for (const line of r.stderr.split("\n")) {
    const s = line.match(/silence_start: (-?[\d.]+)/);
    const e = line.match(/silence_end: ([\d.]+)/);
    if (s) start = Math.max(0, Number(s[1]));
    if (e && start != null) {
      out.push({ start, end: Number(e[1]) });
      start = null;
    }
  }
  if (start != null) out.push({ start, end: duration });
  // Stille am Anfang/Ende komplett weg (ohne Luft)
  for (const s of out) {
    if (s.start <= 0.05) s.start = -pad;
    if (s.end >= duration - 0.05) s.end = duration + pad;
  }
  return out;
}

function merge(ranges) {
  const sorted = ranges.map((r) => ({ ...r })).sort((a, b) => a.start - b.start);
  const out = [];
  for (const r of sorted) {
    const last = out.at(-1);
    if (last && r.start <= last.end) last.end = Math.max(last.end, r.end);
    else out.push(r);
  }
  return out;
}

function invert(removals, duration) {
  const keep = [];
  let t = 0;
  for (const r of removals) {
    if (r.start > t) keep.push({ start: t, end: Math.min(r.start, duration) });
    t = Math.max(t, r.end);
  }
  if (t < duration) keep.push({ start: t, end: duration });
  return keep;
}

function cutAndConcat(src, segments, out, info) {
  const tmp = mkdtempSync(join(tmpdir(), "reel-cut-"));
  // 9:16 füllen (Center-Crop), HDR → SDR, 30 fps
  const tonemap = info.hdr
    ? "zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p,"
    : "";
  const vf = `${tonemap}scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30,format=yuv420p`;
  try {
    const parts = segments.map((seg, i) => {
      const p = join(tmp, `seg-${String(i).padStart(4, "0")}.mkv`);
      const dur = seg.end - seg.start;
      const fade = Math.min(0.015, dur / 4);
      const af = [
        i > 0 ? `afade=t=in:st=0:d=${fade}` : null,
        i < segments.length - 1 ? `afade=t=out:st=${(dur - fade).toFixed(3)}:d=${fade}` : null,
      ].filter(Boolean);
      execFileSync(
        "ffmpeg",
        [
          "-y", "-nostdin", "-hide_banner", "-loglevel", "error",
          "-ss", seg.start.toFixed(3), "-i", src, "-t", dur.toFixed(3),
          "-vf", vf,
          ...(af.length ? ["-af", af.join(",")] : []),
          "-c:v", "libx264", "-preset", "fast", "-crf", "16",
          "-c:a", "pcm_s16le", "-ar", "48000", "-ac", "2",
          p,
        ],
        { stdio: "inherit" },
      );
      return p;
    });
    const list = join(tmp, "list.txt");
    writeFileSync(list, parts.map((p) => `file '${p}'`).join("\n") + "\n");
    const joined = join(tmp, "joined.mkv");
    execFileSync("ffmpeg", ["-y", "-nostdin", "-hide_banner", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", joined]);
    // Lautheit für Social (−14 LUFS), Video unverändert übernehmen
    const part = `${out}.part.mp4`;
    execFileSync("ffmpeg", [
      "-y", "-nostdin", "-hide_banner", "-loglevel", "error", "-i", joined,
      "-af", "loudnorm=I=-14:TP=-1.5:LRA=11",
      "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart",
      part,
    ]);
    renameSync(part, out);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
