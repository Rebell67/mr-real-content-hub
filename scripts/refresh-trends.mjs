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

// Kuratierte Accounts – Schwerpunkt IMMOBILIEN/MAKLER, dann Finanzen. DE + EN.
// Fokus: Creator, deren virale Formate ein Makler mit Handy + eigener Listing
// oder Talking-Head 1:1 nachdrehen kann (Preis-Reveal, Objekt-Rundgang,
// Besichtigungs-Tipps, Erklär-Reels) – KEINE Lifestyle-Protzerei (Auto/Jet/
// Uhr) und keine familienabhängigen Formate. Ziel des OS: jetzt Reichweite &
// Follower aufbauen, später Leads/gewerbliche Kunden.
const DEFAULT_ACCOUNTS = [
  // AT Makler direkt (dünner Markt – umso mehr Whitespace zum Rausstechen)
  'michaelleber.vienna', 'dominik.k.reiter',
  // AT/DE Immobilien & Makler (posten regelmäßig Reels)
  'fabi_lehner', 'maklerleben', 'wohnglueck.de',
  // EN Makler/Real-Estate-Agents mit extrem nachmachbaren Formaten
  // (Talking-Head, Skits, Preis-Reveal, Objekt-Rundgang)
  'thebrokeagent', 'matt.lionetti', 'garrettbrownre', 'wealthfromrentals',
  'ryanserhant', 'biggerpockets',
  // AT/DE Finanzen (nachmachbare Erklär-Formate, füllt auf)
  'finanzfluss', 'finanztip', 'madamemoneypenny', 'aktienmitkopf',
  'humphreytalks', 'grahamstephan',
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

// Handle bestimmen – manche Items liefern kein ownerUsername, dann aus der URL.
const ownerOf = (x) =>
  x.ownerUsername ||
  (String(x.inputUrl || x.url || '').match(/instagram\.com\/([^/?#]+)/i)?.[1]) ||
  '';

// Nach Creator gruppieren, Kanal-Median bilden.
const byOwner = {};
for (const x of items) {
  if (!isReel(x)) continue;
  const o = ownerOf(x);
  if (!o) continue;
  (byOwner[o] ??= []).push(x);
}

// Vulgäres / politisch aufgeladenes rausfiltern (nicht seriös nachahmbar).
const BLOCK = /motherf|fuck|f\*ck|fick|hurens|scheiß|arschloch|\bnazi|weidel|\bafd\b|hitler|\bbitch|penis|sex(ual)?/i;

// NICHT nachmachbar für Mr Real: reine Lifestyle-Protzerei (Luxusautos, Jets,
// Yachten, teure Uhren) und familien-/kinderabhängige Formate. WICHTIG: Villen,
// Penthouses & teure Objekte sind für einen Makler KEIN Ausschluss – Objekt-
// Touren sind sein Kerngeschäft und mit eigenen Listings nachdrehbar.
const NOT_REPLICABLE = /porsche|ferrari|lamborghini|\blambo|bugatti|bentley|rolls[- ]?royce|mclaren|maserati|\brolex|patek|audemars|richard mille|private ?jet|privatjet|\byacht|supercar|\bmy (kid|kids|son|daughter|baby|child|children|wife|husband|family)\b|meine (kinder|tochter|sohn|frau|familie)|\bnewborn|toddler|pregnan|schwanger|millionaire lifestyle|luxury (car|watch)|10\.?000\s?€\s?uhr/i;

// Makler-Fit: Formate mit klarem Immobilien-/Finanz-Bezug, die ein Makler mit
// Handy + Talking-Head oder eigener Listing nachdrehen kann. Alles ohne Bezug
// (generische Money-Reels, Off-Niche) fliegt raus.
const MAKLER_FIT = /immobil|makler|wohnung|\bhaus|miet|kauf|zins|quadratmeter|\bqm\b|besichtig|grundriss|eigentum|vermiet|kredit|finanzier|hypothek|preis|kostet|€|rendite|invest|\bgeld|sparen|\betf|depot|vermögen|\bmoney|\brent\b|mortgage|propert|real ?estate|apartment|\bhome\b|\bhouse/i;

// Reines Immobilien-Thema (für die Priorisierung: Makler-Content zuerst).
const REAL_ESTATE = /immobil|makler|wohnung|\bhaus|miet|kauf(?!kraft)|besichtig|grundriss|eigentum|vermiet|quadratmeter|\bqm\b|hypothek|propert|real ?estate|apartment|\bhome\b|\bhouse|listing/i;

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

// Konkrete Nachmach-Anleitung für Mr Real – wenig Aufwand, nur Handy.
function replicate(hook) {
  const h = hook.toLowerCase();
  if (/kostet|preis|€|was (bekommst|kriegst|gibt)|guess/.test(h))
    return 'Nimm eine deiner Listings, film 10–15 Sek. Rundgang mit dem Handy und blende den Preis erst am Schluss ein – Rätsel-Effekt hält die Leute bis zum Ende.';
  if (/besichtig|grundriss|rundgang|tour|pov/.test(h))
    return 'Bei der nächsten Besichtigung 20–30 Sek. mitfilmen und deinen Insider-Kommentar als Voice-over drüberlegen. Kein Setup nötig.';
  if (/fehler|tipp|wahrheit|verschweig|mythos|lüge|\bnie\b|\bimmer\b|hör auf|vergiss|3 |5 /.test(h))
    return 'Talking-Head vor der Kamera: 3 Punkte, je ein kurzer Satz, dazu Text-Overlay. Handy + du reichen.';
  if (/rechne|verdien|miete|kauf|zins|kredit|rendite|spar/.test(h))
    return 'In die Kamera sprechen und die Zahlen als On-Screen-Text einblenden – keine Requisiten, nur klare Rechnung.';
  return 'Talking-Head mit knackigem Hook in den ersten 2 Sek. – nur du + Handy, minimaler Aufwand.';
}

const trends = [];
for (const [owner, reels] of Object.entries(byOwner)) {
  if (reels.length < 3) continue; // zu wenig Basis für einen Median
  const med = median(reels.map(views)) || 1;
  for (const r of reels) {
    const v = views(r);
    const factor = v / med;
    const caption = r.caption || '';
    if (BLOCK.test(caption)) continue; // vulgär/politisch überspringen
    if (NOT_REPLICABLE.test(caption)) continue; // Lifestyle-Protzerei / Familie → nicht nachmachbar
    if (!MAKLER_FIT.test(caption)) continue; // ohne Immobilien-/Finanz-Bezug → raus
    const isRE = REAL_ESTATE.test(caption);
    // Nur echte Ausreißer. Für Makler-/Immobilien-Formate niedrigere View-Schwelle,
    // weil AT/DE-Immobilien-Creator kleinere, aber sehr nachmachbare Reichweiten haben.
    if (factor < 1.8 || v < (isRE ? 8000 : 15000)) continue;
    const hook = firstLine(caption) || 'Virales Reel';
    const german = GERMAN.test(caption);
    const f = Math.round(factor * 10) / 10;
    trends.push({
      id: `ig-${r.shortCode || r.id}`,
      platform: 'instagram',
      hook,
      format: isRE ? 'Immobilien-Reel' : 'Finanz-Reel',
      views: v,
      likes: Number(r.likesCount || 0),
      outlierFactor: f,
      creatorHandle: `@${owner}`,
      region: german ? 'AT/DE' : 'International',
      daysAgo: daysAgo(r.timestamp),
      realEstate: isRE,
      whyItWorks: `${f}× über dem Kanal-Schnitt (${v.toLocaleString('de-AT')} Views). ${isRE ? 'Genau dein Terrain als Makler' : 'Nachmachbares Erklär-Format'} – hoher Reichweiten-Hebel, um jetzt Follower aufzubauen.`,
      adaptHook: `Für Mr Real (nur du + Handy): übertrag den Aufhänger auf den österreichischen ${isRE ? 'Immobilienmarkt' : 'Finanzmarkt'} – „${hook}"`,
      replicate: replicate(hook),
      suggestedFormat: suggestedFormat(hook),
      url: r.url,
    });
  }
}

// Makler/Immobilien-Formate zuerst, dann nach Outlier-Faktor.
trends.sort((a, b) => (Number(b.realEstate) - Number(a.realEstate)) || (b.outlierFactor - a.outlierFactor));
const top = trends.slice(0, 18);
fs.writeFileSync(path.join(ROOT, 'src/data/trends.json'), JSON.stringify(top));

// Aktualisierungs-Datum im trendService patchen (dd.mm.yyyy).
const now = new Date();
const label = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
const svc = path.join(ROOT, 'src/services/trendService.ts');
fs.writeFileSync(svc, fs.readFileSync(svc, 'utf8').replace(/export const TRENDS_UPDATED = '[^']*';/, `export const TRENDS_UPDATED = '${label}';`));

console.log('Outlier gefunden:', trends.length, '| gespeichert:', top.length);
for (const t of top.slice(0, 8)) console.log(` ${t.outlierFactor}× | ${t.views} | ${t.creatorHandle} | ${t.hook.slice(0, 60)}`);
