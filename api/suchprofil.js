// Vercel Serverless Function: Suchprofil-Relay → JustImmo Website-API.
//
// Nimmt das Suchprofil von public/suchprofil.html entgegen und legt den
// Kontakt samt Suchkriterien über die offizielle JustImmo-API (objekt/anfrage)
// im Account an – damit landet alles direkt im HQ, ohne Captcha/Portal.
//
// Benötigte Environment-Variablen (Vercel → Settings → Environment Variables):
//   JUSTIMMO_API_USER  = API-Benutzer   (JustImmo HQ → Einstellungen → Schnittstellen)
//   JUSTIMMO_API_PASS  = API-Passwort
// Optional:
//   JUSTIMMO_CATEGORY  = Marketing-Kategorie, z. B. "Suchprofil Website"
//                        (muss im HQ als Kategorie vom Typ "Marketing" existieren)
//   JUSTIMMO_OBJEKT_ID = Fallback-Objekt-ID, falls die API zwingend ein Objekt verlangt

const JI_URL = 'https://api.justimmo.at/rest/v1/objekt/anfrage';

const esc = (s) => String(s ?? '').trim().slice(0, 500);

function buildMessage(d) {
  const zeilen = [
    'NEUES SUCHPROFIL über die Website',
    '────────────────────────',
    `Suche:    ${d.art === 'miete' ? 'Miete' : 'Kauf'} · ${esc(d.objektart) || 'Wohnung'}`,
    `Lage:     ${[...(d.bezirke || []), esc(d.lageText)].filter(Boolean).join(', ') || '—'}`,
    `Budget:   ${d.budget ? `bis ${Number(d.budget).toLocaleString('de-AT')} €${d.art === 'miete' ? '/Monat' : ''}` : '—'}`,
    `Fläche:   ${d.flaeche ? `ab ${Number(d.flaeche)} m²` : '—'}   ·   Zimmer: ${d.zimmer ? `ab ${Number(d.zimmer)}` : '—'}`,
    `Wünsche:  ${(d.wuensche || []).map(esc).join(', ') || '—'}`,
  ];
  if (esc(d.nachricht)) zeilen.push(`Anmerkung: ${esc(d.nachricht)}`);
  zeilen.push('────────────────────────');
  zeilen.push('→ Bitte Suchprofil im HQ anlegen und passende Objekte anbieten.');
  return zeilen.join('\n');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Nur POST erlaubt.' });
    return;
  }

  const d = req.body ?? {};

  // Honeypot: Bots füllen das unsichtbare Feld aus → still "ok" antworten.
  if (d.website) {
    res.status(200).json({ ok: true });
    return;
  }

  if (!esc(d.vorname) || !esc(d.nachname) || !esc(d.email) || !/.+@.+\..+/.test(d.email)) {
    res.status(400).json({ error: 'Bitte Vorname, Nachname und eine gültige E-Mail angeben.' });
    return;
  }
  if (!d.dsgvo) {
    res.status(400).json({ error: 'Bitte der Datenverarbeitung zustimmen.' });
    return;
  }

  const user = process.env.JUSTIMMO_API_USER;
  const pass = process.env.JUSTIMMO_API_PASS;
  if (!user || !pass) {
    res.status(503).json({ error: 'relay_not_configured' });
    return;
  }

  // Feldnamen laut offiziellem JustImmo PHP-SDK (RealtyInquiryMapper).
  const params = new URLSearchParams();
  params.set('vorname', esc(d.vorname));
  params.set('nachname', esc(d.nachname));
  params.set('email', esc(d.email));
  if (esc(d.telefon)) params.set('tel', esc(d.telefon));
  if (d.anrede_id) params.set('anrede_id', String(parseInt(d.anrede_id, 10) || ''));
  params.set('land', 'AT');
  params.set('message', buildMessage(d));
  if (process.env.JUSTIMMO_CATEGORY) params.set('kategorie', process.env.JUSTIMMO_CATEGORY);
  if (process.env.JUSTIMMO_OBJEKT_ID) params.set('objekt_id', process.env.JUSTIMMO_OBJEKT_ID);

  try {
    const auth = Buffer.from(`${user}:${pass}`).toString('base64');
    const r = await fetch(`${JI_URL}?${params.toString()}`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}` },
    });
    if (!r.ok) {
      const body = await r.text().catch(() => '');
      console.error('JustImmo API error', r.status, body.slice(0, 500));
      res.status(502).json({ error: 'justimmo_error', status: r.status });
      return;
    }
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('JustImmo relay failed', e);
    res.status(502).json({ error: 'justimmo_unreachable' });
  }
}
