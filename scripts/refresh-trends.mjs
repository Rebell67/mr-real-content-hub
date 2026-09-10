// Zieht echte virale Instagram-Reels aus Nischen-Accounts (Immobilien/Finanzen,
// DE + EN) über Apify, erkennt Outlier (Views deutlich über dem Kanal-Schnitt)
// und schreibt src/data/trends.json für die "Trends & Outlier"-Rubrik.
//
// Braucht:  APIFY_TOKEN in der Umgebung.
// Optional: TRENDS_IG_ACCOUNTS (kommagetrennte Handles, überschreibt Standard).
// Aufruf:   APIFY_TOKEN=... node scripts/refresh-trends.mjs
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const TOKEN = process.env.APIFY_TOKEN;
if (!TOKEN) {
  console.error('APIFY_TOKEN fehlt.');
  process.exit(1);
}

// Kuratierte Nischen-Accounts (Immobilien/Finanzen), DE + EN.
const DEFAULT_ACCOUNTS = [
  'finanzfluss', 'immocation', 'finanztip', 'madamemoneypenny', 'immo.tommy', 'fabi_lehner',
  'grahamstephan', 'biggerpockets', 'meetkevin', 'humphreytalks', 'mattlionetti',
];
const accounts = (process.env.TRENDS_IG_ACCOUNTS ? process.env.TRENDS_IG_ACCOUNTS.split(',') : DEFAULT_ACCOUNTS)
  .map((s) => s.trim()).filter(Boolean);

const run = await fetch(
  'https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?timeout=280',
  {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      directUrls: accounts.map((a) => `https://www.instagram.com/${a}/`),
      resultsType: 'posts',
      resultsLimit: 16,
      onlyPostsNewerThan: '120 days',
      addParentData: false,
    }),
  },
);
if (!run.ok) {
  console.error('Apify-Fehler:', run.status, (await run.text()).slice(0, 300));
  process.exit(1);
}
const items = await run.json();
console.log('Apify-Items gesamt:', items.length);

const views = (x) => Number(x.videoViewCount || x.videoPlayCount || 0);
const isReel = (x) => (x.type === 'Video' || x.productType === 'clips') && views(x) > 0;
const median = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

// Nach Creator gruppieren, Kanal-Median bilden.
const byOwner = {};
for (const x of items) {
  if (!isReel(x)) continue;
  (byOwner[x.ownerUsername] ??= []).push(x);
}

// Vulgäres / politisch aufgeladenes rausfiltern (nicht seriös nachahmbar).
const BLOCK = /motherf|fuck|f\*ck|fick|hurens|scheiß|arschloch|\bnazi|weidel|\bafd\b|hitler|\bbitch|penis|sex(ual)?/i;
const GERMAN = /[äöüß]|(^|\s)(der|die|das|und|für|ich|du|mit|nicht|Immobilie|Wohnung|Miete|Zinsen|Geld|kaufen)(\s|$)/i;
const clean = (s) => (s || '').replace(/#[\wäöüÄÖÜß]+/g, '').replace(/\s+/g, ' ').trim();
const firstLine = (s) => {
  const t = clean(s).split(/(?<=[.!?])\s|\n/)[0];
  return t.length > 120 ? t.slice(0, 117) + '…' : t;
};
const daysAgo = (ts) => Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / 8.64e7));

function suggestedFormat(hook) {
  const h = hook.toLowerCase();
  if (/[0-9€%]|kostet|rechne|verdien|preis/.test(h)) return 'explainer';
  if (/\?|nie|immer|hör auf|vergiss|lüge|mythos|wahrheit/.test(h)) return 'hot-take';
  return 'story';
}

const trends = [];
for (const [owner, reels] of Object.entries(byOwner)) {
  if (reels.length < 3) continue; // zu wenig Basis für einen Median
  const med = median(reels.map(views)) || 1;
  for (const r of reels) {
    const v = views(r);
    const factor = v / med;
    if (factor < 1.8 || v < 15000) continue; // nur echte Ausreißer
    if (BLOCK.test(r.caption || '')) continue; // vulgär/politisch überspringen
    const hook = firstLine(r.caption) || 'Virales Reel';
    const german = GERMAN.test(r.caption || '');
    trends.push({
      id: `ig-${r.shortCode || r.id}`,
      platform: 'instagram',
      hook,
      format: 'Reel',
      views: v,
      likes: Number(r.likesCount || 0),
      outlierFactor: Math.round(factor * 10) / 10,
      creatorHandle: `@${owner}`,
      region: german ? 'AT/DE' : 'International',
      daysAgo: daysAgo(r.timestamp),
      whyItWorks: `Lief rund ${Math.round(factor * 10) / 10}× über dem Kanal-Schnitt (${v.toLocaleString('de-AT')} Views). Format & Aufhänger haben klar überdurchschnittlich gezogen.`,
      adaptHook: `Übertrag den Aufhänger auf den österreichischen Markt: „${hook}"`,
      suggestedFormat: suggestedFormat(hook),
      url: r.url,
    });
  }
}

trends.sort((a, b) => b.outlierFactor - a.outlierFactor);
const top = trends.slice(0, 18);
fs.writeFileSync(path.join(ROOT, 'src/data/trends.json'), JSON.stringify(top));

// Aktualisierungs-Datum im trendService patchen (dd.mm.yyyy).
const now = new Date();
const label = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
const svc = path.join(ROOT, 'src/services/trendService.ts');
fs.writeFileSync(svc, fs.readFileSync(svc, 'utf8').replace(/export const TRENDS_UPDATED = '[^']*';/, `export const TRENDS_UPDATED = '${label}';`));

console.log('Outlier gefunden:', trends.length, '| gespeichert:', top.length);
for (const t of top.slice(0, 8)) console.log(` ${t.outlierFactor}× | ${t.views} | ${t.creatorHandle} | ${t.hook.slice(0, 60)}`);
