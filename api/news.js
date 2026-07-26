// Vercel Serverless Function: tagesaktuelle Wirtschafts-/Immobilien-/Finanz-
// News – KOSTENLOS über frei zugängliche RSS-Feeds (Google News). Kein
// bezahlter Zugang nötig.
//
// Ablauf:
//   1. RSS-Feeds abrufen (Standard: Google-News-Suchen für die Nische).
//   2. Meldungen heuristisch bewerten (Relevanz-Teilwerte, Kategorie, Hook).
//   3. Optional: wenn ANTHROPIC_API_KEY gesetzt ist, bewertet & betextet Claude
//      die Top-Meldungen deutlich besser (Relevanz + Mr-Real-Hook in seinem Ton).
//
// Optionale Environment-Variablen (Vercel → Settings → Environment Variables):
//   NEWS_FEEDS         – eigene RSS-URLs, mit Komma getrennt (überschreibt Standard)
//   ANTHROPIC_API_KEY  – aktiviert die KI-Bewertung/Betextung
//
// Ohne alles liefert dieser Endpoint trotzdem echte News (heuristisch bewertet).

const DEFAULT_FEEDS = [
  'https://news.google.com/rss/search?q=Immobilien%20OR%20Wohnung%20OR%20Baufinanzierung%20when:2d&hl=de-AT&gl=AT&ceid=AT:de',
  'https://news.google.com/rss/search?q=Zinsen%20OR%20EZB%20OR%20Leitzins%20OR%20Kredit%20when:2d&hl=de-AT&gl=AT&ceid=AT:de',
  'https://news.google.com/rss/search?q=Inflation%20OR%20Wirtschaft%20%C3%96sterreich%20OR%20Miete%20when:2d&hl=de-AT&gl=AT&ceid=AT:de',
];

export default async function handler(req, res) {
  const feeds = (process.env.NEWS_FEEDS ? process.env.NEWS_FEEDS.split(',') : DEFAULT_FEEDS)
    .map((f) => f.trim())
    .filter(Boolean);

  try {
    const raw = (await Promise.all(feeds.map(fetchFeed))).flat();
    const deduped = dedupe(raw).slice(0, 24);
    if (deduped.length === 0) throw new Error('Keine Meldungen abrufbar.');

    let items = deduped.map(heuristicScore);

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        items = await enrichWithClaude(deduped);
      } catch {
        /* KI-Bewertung fehlgeschlagen – heuristische Werte behalten */
      }
    }

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    res.status(200).json({ source: 'live', items: items.slice(0, 16) });
  } catch (e) {
    res.status(502).json({ error: `News-Abruf fehlgeschlagen: ${e.message}` });
  }
}

// ---- RSS abrufen & parsen (ohne Zusatz-Library) ---------------------------
async function fetchFeed(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'MrRealContentHub/1.0' } });
  if (!r.ok) return [];
  const xml = await r.text();
  const items = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/g) ?? [];
  for (const b of blocks.slice(0, 15)) {
    const title = clean(pick(b, 'title'));
    if (!title) continue;
    const link = clean(pick(b, 'link'));
    const desc = stripHtml(clean(pick(b, 'description')));
    const pub = pick(b, 'pubDate');
    const ageHours = pub ? Math.max(0, (Date.now() - new Date(pub).getTime()) / 3.6e6) : 12;
    // Google-News-Titel: "Headline - Quelle"
    const m = title.match(/^(.*)\s[–-]\s([^–-]+)$/);
    items.push({
      headline: (m ? m[1] : title).trim(),
      source: (m ? m[2] : 'News').trim(),
      summary: desc.slice(0, 220),
      url: link,
      publishedAgoHours: Math.round(ageHours),
    });
  }
  return items;
}

const pick = (block, tag) => {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? m[1] : '';
};
const clean = (s) =>
  s
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
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
  naehe: ['immobili', 'wohnung', 'miete', 'kredit', 'zins', 'baufinanz', 'hypothek', 'eigentum', 'grundst', 'haus', 'bauen', 'ezb', 'darlehen'],
  betroffenheit: ['preis', 'steuer', 'inflation', 'sparen', 'teuer', 'kosten', 'rate', 'geld', 'gehalt', 'lohn'],
  emotion: ['verbot', 'deckel', 'krise', 'crash', 'rekord', 'streit', 'warn', 'schock', 'aus', 'ende', 'skandal', 'droht', 'kollaps', 'boom'],
};
const CAT_KW = {
  zinsen: ['zins', 'ezb', 'leitzins'],
  immobilien: ['immobili', 'wohnung', 'miete', 'haus', 'grundst', 'bauen'],
  finanzen: ['kredit', 'bauspar', 'aktie', 'sparen', 'hypothek', 'darlehen'],
  politik: ['regierung', 'gesetz', 'reform', 'verordnung', 'steuer'],
  wirtschaft: ['wirtschaft', 'inflation', 'konjunktur', 'arbeitsmarkt'],
};

function score(text, list) {
  const t = text.toLowerCase();
  const hits = list.filter((k) => t.includes(k)).length;
  return Math.min(100, hits * 34);
}

function heuristicScore(it) {
  const text = `${it.headline} ${it.summary}`;
  const naehe = Math.max(20, score(text, KW.naehe));
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
    summary: it.summary,
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
    .map((it, i) => `${i}. ${it.headline} — ${it.summary}`)
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
    const base = heuristicScore(it);
    return {
      ...base,
      category: a.category ?? base.category,
      subs: a.subs ?? base.subs,
      hook: a.hook ?? base.hook,
      angle: a.angle ?? base.angle,
      suggestedFormat: a.format ?? base.suggestedFormat,
    };
  });
}
