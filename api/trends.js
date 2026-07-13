// Vercel Serverless Function: liefert aktuelle Outlier-/Trend-Videos von
// Instagram & TikTok. Der API-Schlüssel des Trend-Anbieters bleibt hier am
// Server. Das Frontend ruft nur /api/trends auf.
//
// Es gibt KEINE kostenlose offizielle Quelle für „virale Outlier-Videos".
// Zum Aktivieren eine bezahlte Trend-/Scraper-Quelle hinterlegen, z. B.:
//   - EnsembleData  (ensembledata.com)
//   - Apify TikTok/Instagram Scraper-Actors  (apify.com)
//   - ein TikTok/Instagram-Scraper über RapidAPI
//
// Environment-Variablen (Vercel → Settings → Environment Variables):
//   TRENDS_PROVIDER_URL   – Endpoint des Anbieters, der bereits gefilterte
//                           Outlier im gewünschten Nischen-/Region-Scope liefert
//   TRENDS_API_KEY        – Zugangsschlüssel des Anbieters
//
// Solange nichts konfiguriert ist, antwortet der Endpoint mit 503 und das
// Frontend zeigt automatisch die Demo-Trends an.

const NICHE_QUERY = 'immobilien OR "mieten vs kaufen" OR baufinanzierung OR wohnung';

export default async function handler(req, res) {
  const providerUrl = process.env.TRENDS_PROVIDER_URL;
  const apiKey = process.env.TRENDS_API_KEY;

  if (!providerUrl || !apiKey) {
    res.status(503).json({
      error: 'Keine Trend-Quelle konfiguriert – Demo-Trends aktiv.',
      hint: 'TRENDS_PROVIDER_URL und TRENDS_API_KEY in Vercel setzen (z. B. EnsembleData oder Apify).',
    });
    return;
  }

  try {
    // Generischer Abruf: der Anbieter liefert bereits Outlier-Videos, die wir
    // in unser Trend-Format normalisieren. Die genauen Feldnamen je nach
    // Anbieter in normalizeTrend() anpassen.
    const url = new URL(providerUrl);
    url.searchParams.set('query', NICHE_QUERY);
    url.searchParams.set('region', 'AT,DE');
    url.searchParams.set('sort', 'outlier');
    url.searchParams.set('limit', '12');

    const upstream = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!upstream.ok) throw new Error(`Anbieter antwortet mit ${upstream.status}`);

    const raw = await upstream.json();
    const items = Array.isArray(raw) ? raw : (raw.data ?? raw.items ?? []);
    const trends = items.map(normalizeTrend).filter(Boolean).slice(0, 12);

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
    res.status(200).json({ source: 'live', trends });
  } catch (e) {
    res.status(502).json({ error: `Trend-Abruf fehlgeschlagen: ${e.message}` });
  }
}

// Normalisiert ein Anbieter-Objekt in unser Trend-Schema. An das reale
// Antwortformat des gewählten Anbieters anpassen.
function normalizeTrend(v, i) {
  if (!v) return null;
  const platform = (v.platform || v.network || 'tiktok').toLowerCase().includes('insta')
    ? 'instagram'
    : 'tiktok';
  return {
    id: v.id ?? `live-${i}`,
    platform,
    hook: v.title ?? v.caption ?? v.description ?? 'Trend-Video',
    format: v.format ?? 'Trend',
    views: Number(v.views ?? v.playCount ?? 0),
    outlierFactor: Number(v.outlierFactor ?? v.outlier_ratio ?? 0),
    creatorHandle: v.author ?? v.handle ?? '@creator',
    region: 'AT/DE',
    daysAgo: v.daysAgo ?? 0,
    whyItWorks: v.reason ?? 'Überdurchschnittliche Reichweite in der Nische.',
    adaptHook: v.title ?? v.caption ?? '',
    suggestedFormat: 'hot-take',
  };
}
