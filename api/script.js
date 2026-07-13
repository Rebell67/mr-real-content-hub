// Vercel Serverless Function: lets Claude (Opus 4.8) write a video script
// following Mr Real's fixed structure. The API key stays server-side.
//
// Requires environment variable (Vercel → Settings → Environment Variables):
//   ANTHROPIC_API_KEY = sk-ant-...
//
// The frontend calls POST /api/script with the idea; if this endpoint is
// unavailable (offline single-file build, no key), the client falls back to
// the built-in template generator.

import Anthropic from '@anthropic-ai/sdk';

const SECTIONS = ['hook', 'lead', 'body1', 'openLoop1', 'body2', 'openLoop2', 'body3', 'cta'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Nur POST erlaubt.' });
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(503).json({ error: 'Kein ANTHROPIC_API_KEY gesetzt.' });
    return;
  }

  const { title, hook, format, angle, styleBlock } = req.body ?? {};
  if (!title) {
    res.status(400).json({ error: 'title fehlt.' });
    return;
  }

  const client = new Anthropic();

  const styleSection = styleBlock ? `\n\n${styleBlock}\n` : '';

  const system = `Du bist der Ghostwriter für "Mr Real", einen österreichischen Immobilien-Creator (@mr.r3al).
Ton: kompetent und seriös, aber modern, direkt, unterhaltsam und meinungsstark – keine Maklerwerbung.${styleSection}
Du schreibst Skripte für kurze Hochkant-Videos (TikTok / Instagram Reels), Ziel: maximale Reichweite und Follower-Wachstum.
Länge: Das ganze Skript soll GESPROCHEN 30 bis 60 Sekunden dauern – also insgesamt ca. 110–160 Wörter. Lieber etwas ausführlicher als zu knapp.
Halte dich EXAKT an diese acht Bausteine und gib NUR ein JSON-Objekt zurück (keine Erklärung, kein Markdown):
{"hook","lead","body1","openLoop1","body2","openLoop2","body3","cta"}
- hook: 1 knackiger Satz, stoppt in unter 1,5 Sekunden (steile These oder "Du"-Ansprache).
- lead: 1–2 Sätze, Versprechen warum man dranbleibt.
- body1/body2/body3: je 2–4 Sätze, konkreter Kernpunkt mit einer echten Zahl, Rechnung oder einem greifbaren Beispiel. Das ist der Hauptteil – hier steckt die Substanz.
- openLoop1/openLoop2: je 1 Satz Spannung auf den nächsten Punkt.
- cta: 1–2 Sätze, klare Aufforderung zu folgen.
Sprache: Deutsch (Österreich), natürlich gesprochene Sprache, kurze Sätze.`;

  const user = `Erstelle ein Skript.
Titel: ${title}
Hook-Idee: ${hook ?? '—'}
Format: ${format ?? '—'}
Winkel: ${angle ?? '—'}`;

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2000,
      system,
      messages: [{ role: 'user', content: user }],
    });

    const text = message.content.find((b) => b.type === 'text')?.text ?? '';
    const jsonStr = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const parsed = JSON.parse(jsonStr);

    for (const key of SECTIONS) {
      if (typeof parsed[key] !== 'string' || !parsed[key].trim()) {
        throw new Error(`Feld ${key} fehlt in Claude-Antwort.`);
      }
    }

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ source: 'ai', sections: parsed });
  } catch (e) {
    res.status(502).json({ error: `Claude-Generierung fehlgeschlagen: ${e.message}` });
  }
}
