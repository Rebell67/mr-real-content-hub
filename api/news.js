// Vercel Serverless Function: tagesaktuelle Wirtschafts-/Immobilien-/Finanz-
// News – KOSTENLOS über frei zugängliche RSS-Feeds (Google News). Kein
// bezahlter Zugang nötig.
//
// Ablauf:
//   1. RSS-Feeds abrufen (Standard: gezielte Google-News-Suchen für die Nische).
//   2. Themenfremdes (Kriminal, Sport, …) herausfiltern, Relevanz heuristisch bewerten.
//   3. Optional: wenn ANTHROPIC_API_KEY gesetzt ist, bewertet & betextet Claude
//      die Top-Meldungen deutlich besser (Relevanz + Mr-Real-Hook in seinem Ton).
//
// Optionale Environment-Variablen:
//   NEWS_FEEDS         – eigene RSS-URLs, mit Komma getrennt (überschreibt Standard)
//   ANTHROPIC_API_KEY  – aktiviert die KI-Bewertung/Betextung

const DEFAULT_FEEDS = [
  'https://news.google.com/rss/search?q=Immobilienpreise%20OR%20Immobilienmarkt%20OR%20Wohnimmobilien%20OR%20Eigenheim%20%C3%96sterreich%20when:3d&hl=de-AT&gl=AT&ceid=AT:de',
  'https://news.google.com/rss/search?q=Baufinanzierung%20OR%20Wohnkredit%20OR%20Hypothekarzinsen%20OR%20EZB%20Leitzins%20when:3d&hl=de-AT&gl=AT&ceid=AT:de',
  'https://news.google.com/rss/search?q=Mietpreisbremse%20OR%20Mietpreise%20OR%20Grunderwerbsteuer%20OR%20Wohnkosten%20%C3%96sterreich%20when:4d&hl=de-AT&gl=AT&ceid=AT:de',
  'https://news.google.com/rss/search?q=Inflation%20%C3%96sterreich%20OR%20Immobilien%20Steuer%20OR%20Zinsen%20Sparen%20when:4d&hl=de-AT&gl=AT&ceid=AT:de',
];

// Worte, die eine Meldung als themenfremd markieren (Kriminal/Tragödie/Sport …).
const BLOCK = [
  'leiche', 'mord', 'getötet', 'toter', 'tote ', 'unfall', 'verletzt', 'festgenommen',
  'polizei', 'messer', 'vermisst', 'missbrauch', 'drogen', 'prozess', 'verurteilt',
  'überfall', 'einbruch', 'brand ', 'feuerwehr', 'verletzte', 'gestorben', 'fußball',
  'liga', 'champions', 'wm ', 'em ', 'olympia',
];

export default async function handler(req, res) {
  const feeds = (process.env.NEWS_FEEDS ? process.env.NEWS_FEEDS.split(',') : DEFAULT_FEEDS)
    .map((f) => f.trim())
    .filter(Boolean);

  try {
    const raw = (await Promise.all(feeds.map(fetchFeed))).flat();
    const cleaned = dedupe(raw).filter((it) => !isOffTopic(it.headline));
    if (cleaned.length === 0) throw new Error('Keine passenden Meldungen abrufbar.');

    let items = cleaned.map(heuristicScore).filter((n) => n.subs.naehe >= 34);
    // Nach Relevanz sortieren (grobe Gewichtung wie im Frontend).
    items.sort((a, b) => relevance(b.subs) - relevance(a.subs));
    items = items.slice(0, 16);

    if (process.env.ANTHROPIC_API_KEY && items.length) {
      try {
        items = await enrichWithClaude(items);
      } catch {
        /* KI-Bewertung fehlgeschlagen – heuristische Werte behalten */
      }
    }

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=7200');
    res.status(200).json({ source: 'live', items });
  } catch (e) {
    res.status(502).json({ error: `News-Abruf fehlgeschlagen: ${e.message}` });
  }
}

const relevance = (s) =>
  s.emotion * 0.28 + s.betroffenheit * 0.24 + s.naehe * 0.22 + s.hook * 0.16 + s.aktualitaet * 0.1;

function isOffTopic(headline) {
  const t = ` ${headline.toLowerCase()} `;
  return BLOCK.some((w) => t.includes(w));
}

// ---- RSS abrufen & parsen (ohne Zusatz-Library) ---------------------------
async function fetchFeed(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'MrRealContentHub/1.0' } });
  if (!r.ok) return [];
  const xml = await r.text();
  const items = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/g) ?? [];
  for (const b of blocks.slice(0, 15)) {
    const rawTitle = clean(pick(b, 'title'));
    if (!rawTitle) continue;
    const link = clean(pick(b, 'link'));
    const pub = pick(b, 'pubDate');
    const ageHours = pub ? Math.max(0, (Date.now() - new Date(pub).getTime()) / 3.6e6) : 12;
    // Google-News-Titel: "Headline - Quelle"
    const m = rawTitle.match(/^(.*)\s[–-]\s([^–-]+)$/);
    const headline = (m ? m[1] : rawTitle).trim();
    const source = (m ? m[2] : 'News').trim();
    // Beschreibung ist bei Google News meist nur Headline+Quelle → nur behalten,
    // wenn sie echten Mehrwert hat.
    const desc = stripHtml(clean(pick(b, 'description')));
    const summary =
      desc && !desc.toLowerCase().startsWith(headline.slice(0, 18).toLowerCase())
        ? desc.slice(0, 220)
        : '';
    items.push({ headline, source, summary, url: link, publishedAgoHours: Math.round(ageHours) });
  }
  return items;
}

const pick = (block, tag) => {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? m[1] : '';
};
function clean(s) {
  return s
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim();
}
const stripHtml = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

function dedupe(items) {
  const seen = new Set();
  return items.filter((it) => {
    const key = it.headline.toLowerCase().slice(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ---- Heuristische Bewertung (Fallback ohne KI) ----------------------------
const KW = {
  naehe: ['immobili', 'wohnimmobili', 'wohnungsmarkt', 'eigenheim', 'eigentumswohnung', 'miete', 'mietpreis', 'kredit', 'zins', 'baufinanz', 'hypothek', 'eigentum', 'grundst', 'bauen', 'ezb', 'darlehen', 'wohnkosten', 'wohnbau'],
  betroffenheit: ['preis', 'steuer', 'inflation', 'sparen', 'teuer', 'kosten', 'rate', 'leistbar', 'gehalt', 'lohn'],
  emotion: ['verbot', 'deckel', 'krise', 'crash', 'rekord', 'streit', 'warn', 'schock', 'droht', 'kollaps', 'boom', 'unerschwing', 'unleistbar', 'explodier'],
};
const CAT_KW = {
  zinsen: ['zins', 'ezb', 'leitzins', 'euribor'],
  immobilien: ['immobili', 'wohnungsmarkt', 'eigenheim', 'eigentumswohnung', 'haus', 'grundst', 'bauen', 'wohnbau'],
  finanzen: ['kredit', 'bauspar', 'aktie', 'sparen', 'hypothek', 'darlehen', 'baufinanz'],
  politik: ['regierung', 'gesetz', 'reform', 'verordnung', 'steuer', 'ministerrat', 'mietpaket'],
  wirtschaft: ['wirtschaft', 'inflation', 'konjunktur', 'arbeitsmarkt'],
};

function score(text, list) {
  const t = text.toLowerCase();
  const hits = list.filter((k) => t.includes(k)).length;
  return Math.min(100, hits * 34);
}

function heuristicScore(it) {
  const text = `${it.headline} ${it.summary}`;
  const naehe = score(text, KW.naehe);
  const betroffenheit = Math.max(25, score(text, KW.betroffenheit));
  const emotion = Math.max(30, score(text, KW.emotion));
  const aktualitaet = Math.max(20, Math.round(100 * Math.pow(0.5, it.publishedAgoHours / 48)));
  const hook = Math.round((emotion + naehe) / 2);
  let category = 'wirtschaft';
  let best = 0;
  for (const [cat, list] of Object.entries(CAT_KW)) {
    const s = score(text, list);
    if (s > best) {
      best = s;
      category = cat;
    }
  }
  return {
    id: `live-${hashId(it.headline)}`,
    headline: it.headline,
    summary: it.summary || `${it.source} · aktuelle Meldung aus deinem Themenbereich.`,
    source: it.source,
    url: it.url,
    publishedAgoHours: it.publishedAgoHours,
    category,
    region: 'AT',
    subs: { emotion, betroffenheit, naehe, hook, aktualitaet },
    hook: `${it.headline} – und was das für dich heißt.`,
    angle: 'Nachricht mit klarer Einordnung und Handlungsempfehlung.',
    suggestedFormat: category === 'immobilien' ? 'market-update' : 'explainer',
  };
}

function hashId(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

// ---- KI-Bewertung & -Betextung (wenn ANTHROPIC_API_KEY vorhanden) ---------
async function enrichWithClaude(items) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic();
  const list = items
    .slice(0, 14)
    .map((it, i) => `${i}. ${it.headline}${it.summary ? ` — ${it.summary}` : ''}`)
    .join('\n');

  const system = `Du bist Analyst für "Mr Real", einen österreichischen Immobilien-Creator (@mr.r3al).
Bewerte Nachrichten nach ihrem Video-Potenzial für Social Media (Wirtschaft/Immobilien/Finanzen).
Gib NUR ein JSON-Array zurück, ein Objekt pro Nachricht, in derselben Reihenfolge:
[{"i":0,"category":"immobilien|finanzen|wirtschaft|zinsen|politik","subs":{"emotion":0-100,"betroffenheit":0-100,"naehe":0-100,"hook":0-100,"aktualitaet":0-100},"hook":"fertiger Mr-Real-Hook (1 Satz, direkt, meinungsstark, du-Ansprache)","angle":"warum es als Video funktioniert (1 Satz)","format":"hot-take|explainer|myth-buster|market-update|story"}]
subs: emotion=polarisiert/überrascht, betroffenheit=trifft Geldbeutel, naehe=Immo-/Finanz-Bezug, hook=Aufhänger-Stärke, aktualitaet=Frische.`;

  const msg = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 3000,
    system,
    messages: [{ role: 'user', content: `Bewerte diese Nachrichten:\n${list}` }],
  });
  const text = msg.content.find((b) => b.type === 'text')?.text ?? '';
  const arr = JSON.parse(text.slice(text.indexOf('['), text.lastIndexOf(']') + 1));

  return items.slice(0, 14).map((it, i) => {
    const a = arr.find((x) => x.i === i) ?? {};
    return {
      ...it,
      category: a.category ?? it.category,
      subs: a.subs ?? it.subs,
      hook: a.hook ?? it.hook,
      angle: a.angle ?? it.angle,
      suggestedFormat: a.format ?? it.suggestedFormat,
    };
  });
}
