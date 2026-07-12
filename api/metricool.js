// Vercel Serverless Function: sicherer Proxy zur Metricool-API.
//
// Der API-Token bleibt auf dem Server (Umgebungsvariablen in Vercel) und
// taucht nie im Browser auf. Das Frontend ruft nur /api/metricool?... auf.
//
// Benötigte Environment-Variablen (Vercel → Project → Settings → Environment Variables):
//   METRICOOL_USER_TOKEN  – API-Token aus Metricool (Einstellungen → API)
//   METRICOOL_USER_ID     – Metricool User-ID
//   METRICOOL_BLOG_ID     – Brand-/Blog-ID der Mr-Real-Marke in Metricool

const ALLOWED_PATH = /^(v2\/analytics\/[a-z/]+|admin\/simpleProfiles)$/i;

export default async function handler(req, res) {
  const token = process.env.METRICOOL_USER_TOKEN;
  const userId = process.env.METRICOOL_USER_ID;
  const blogId = process.env.METRICOOL_BLOG_ID;

  if (!token || !blogId) {
    res.status(503).json({ error: 'Metricool ist serverseitig nicht konfiguriert (Env-Variablen fehlen).' });
    return;
  }
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Nur GET erlaubt.' });
    return;
  }

  const { path = '', ...query } = req.query;
  if (!ALLOWED_PATH.test(String(path))) {
    res.status(400).json({ error: `Pfad nicht erlaubt: ${path}` });
    return;
  }

  const url = new URL(`https://app.metricool.com/api/${path}`);
  for (const [k, v] of Object.entries(query)) {
    if (typeof v === 'string') url.searchParams.set(k, v);
  }
  url.searchParams.set('blogId', blogId);
  url.searchParams.set('userId', userId ?? '');
  url.searchParams.set('userToken', token);

  try {
    const upstream = await fetch(url, { headers: { 'X-Mc-Auth': token, Accept: 'application/json' } });
    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json');
    // Kurzes Caching, damit das Dashboard Metricool nicht bei jedem Reload trifft.
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.send(text);
  } catch (e) {
    res.status(502).json({ error: `Metricool nicht erreichbar: ${e.message}` });
  }
}
