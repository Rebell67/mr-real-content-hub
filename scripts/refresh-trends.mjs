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
// Fokus: Creator, deren virale Formate REALISTISCH nachmachbar sind – also
// Talking-Head, Erklär-Reels, Text-Overlay, Whiteboard/Kamera-im-Auto –
// NICHT solche, die auf teure Requisiten (Luxusautos, Villen) oder Familie
// bauen. Ziel des OS: erst Reichweite & Follower, später Leads.
const DEFAULT_ACCOUNTS = [
  'finanzfluss', 'immocation', 'finanztip', 'madamemoneypenny', 'fabi_lehner',
  'saidshiripour', 'aktienmitkopf', 'finanzenerklaert', 'zinsbaustein',
  'humphreytalks', 'yourrichbff', 'ipohtherich', 'nischa.uk', 'gabe_bult',
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

// NICHT nachmachbar für Mr Real: teure Requisiten (Luxusautos, Villen, Jets,
// Uhren) und Familien-/Kinder-abhängige Formate. Solche Outlier ziehen zwar
// Views, lassen sich aber nicht 1:1 replizieren → raus.
const NOT_REPLICABLE = /porsche|ferrari|lamborghini|\blambo|bugatti|bentley|rolls[- ]?royce|mclaren|maserati|\brolex|patek|audemars|richard mille|private ?jet|privatjet|\byacht|yacht|mansion|villa|penthouse|\bmy (kid|kids|son|daughter|baby|child|children|wife|husband|family)\b|meine (kinder|tochter|sohn|frau|familie)|\bnewborn|toddler|pregnan|schwanger|millionaire lifestyle|luxury (car|watch|life|lifestyle)|supercar|10\.?000\s?€\s?uhr/i;

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
    const caption = r.caption || '';
    if (BLOCK.test(caption)) continue; // vulgär/politisch überspringen
    if (NOT_REPLICABLE.test(caption)) continue; // teure Requisiten / Familie → nicht nachmachbar
    const hook = firstLine(caption) || 'Virales Reel';
    const german = GERMAN.test(caption);
    const f = Math.round(factor * 10) / 10;
    trends.push({
      id: `ig-${r.shortCode || r.id}`,
      platform: 'instagram',
      hook,
      format: 'Reel',
      views: v,
      likes: Number(r.likesCount || 0),
      outlierFactor: f,
      creatorHandle: `@${owner}`,
      region: german ? 'AT/DE' : 'International',
      daysAgo: daysAgo(r.timestamp),
      whyItWorks: `${f}× über dem Kanal-Schnitt (${v.toLocaleString('de-AT')} Views) – ein Reichweiten-Ausreißer, den du mit Handy + Talking-Head nachdrehen kannst (keine teuren Requisiten nötig). Genau solche Formate bauen jetzt Reichweite & Follower auf.`,
      adaptHook: `Nachdrehbar für Mr Real (nur du + Kamera): übertrag den Aufhänger auf den österreichischen Immobilien-/Finanzmarkt – „${hook}"`,
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
