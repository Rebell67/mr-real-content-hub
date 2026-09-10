// Aktualisiert src/data/realMetrics.json aus frischen Metricool-Rohdaten und
// passt die Datums-Labels automatisch an. Für den wöchentlichen Auto-Update.
//
// Erwartet vier Dateien in scripts/metricool-raw/ (je die Tool-Antwort von
// getAnalyticsDataByMetrics, also ein Objekt {"rows":[...]} ODER direkt das
// rows-Array):
//   ig.json  Metriken: IGEV01,IGEV03,IGEV05,IGEV06,IGEV38
//   tt.json  Metriken: TKEV07,TKEV08,TKEV12,TKEV11,TKEV06,TKEV09
//   yt.json  Metriken: YTEV01,YTEV05,YTEV06,YTEV02,YTEV17
//   fb.json  Metriken: FBEV17,FBEV47,FBEV48,FBEV49,FBEV20,FBEV34,FBEV03
//
// Aufruf:  node scripts/refresh-metrics.mjs
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const RAW = path.join(ROOT, 'scripts', 'metricool-raw');

function loadRows(name) {
  const p = path.join(RAW, name);
  const parsed = JSON.parse(fs.readFileSync(p, 'utf8'));
  const rows = Array.isArray(parsed) ? parsed : parsed.rows;
  if (!Array.isArray(rows) || rows.length === 0) throw new Error(`${name}: keine rows gefunden`);
  return rows;
}

const IG = loadRows('ig.json');
const TT = loadRows('tt.json');
const YT = loadRows('yt.json');
const FB = loadRows('fb.json');

const num = (v) => (v == null ? 0 : Math.round(Number(v)));
const iso = (d) => `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
const byDate = (rows) => rows.slice().sort((a, b) => a[a.length - 1].localeCompare(b[b.length - 1]));

const out = [];
function process(rows, platform, map) {
  let prev = null;
  for (const r of byDate(rows)) {
    const date = iso(r[r.length - 1]);
    const m = map(r);
    const followers = m.followers == null ? (prev ?? 0) : Math.round(Number(m.followers));
    prev = followers;
    out.push({
      date,
      platform,
      followers,
      followerChange: num(m.change),
      impressions: num(m.impressions),
      reach: num(m.reach),
      profileViews: num(m.profileViews),
      engagements: num(m.engagements),
    });
  }
}

process(IG, 'instagram', (r) => ({ followers: r[0], change: r[1], impressions: r[2], reach: r[3], engagements: r[4], profileViews: null }));
process(TT, 'tiktok', (r) => ({ followers: r[0], change: r[1], impressions: r[2], reach: r[3], engagements: r[4], profileViews: r[5] }));
process(YT, 'youtube', (r) => ({ followers: r[0], change: r[1] == null ? 0 : Number(r[1]) - Number(r[2] ?? 0), impressions: r[3], reach: r[4], engagements: null, profileViews: null }));
process(FB, 'facebook', (r) => ({ followers: r[0], change: r[1] == null ? 0 : Number(r[1]) - Number(r[2] ?? 0), impressions: r[3], reach: r[4], engagements: r[5], profileViews: r[6] }));

fs.writeFileSync(path.join(ROOT, 'src/data/realMetrics.json'), JSON.stringify(out));

// Datums-Labels automatisch anpassen (dd.mm.).
const dates = out.map((m) => m.date).sort();
const ddmm = (isoDate) => `${isoDate.slice(8, 10)}.${isoDate.slice(5, 7)}.`;
const oldest = ddmm(dates[0]);
const newest = ddmm(dates[dates.length - 1]);

const patch = (file, re, repl) => {
  const p = path.join(ROOT, file);
  const before = fs.readFileSync(p, 'utf8');
  const after = before.replace(re, repl);
  if (after !== before) fs.writeFileSync(p, after);
};
patch('src/components/layout/Topbar.tsx', /real: 'Echte Daten \([^)]*\)'/, `real: 'Echte Daten (${newest})'`);
patch('src/pages/Settings.tsx', /Mr-Real-Snapshot aus Metricool \([^)]*\)\./, `Mr-Real-Snapshot aus Metricool (${oldest}–${newest}).`);

const newest_ = {};
for (const m of out) if (!newest_[m.platform] || m.date > newest_[m.platform].date) newest_[m.platform] = m;
console.log('rows:', out.length, '| Zeitraum:', oldest, '→', newest);
console.log('Follower:', Object.fromEntries(Object.entries(newest_).map(([k, v]) => [k, v.followers])));
console.log('Gesamt:', Object.values(newest_).reduce((a, b) => a + b.followers, 0));
