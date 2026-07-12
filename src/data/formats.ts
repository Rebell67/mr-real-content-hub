import type { ContentFormat } from '../types';

// Recurring, recognisable formats – the backbone of the Mr Real brand.
// These are what make the account grow beyond being a "news reporter".
export const CONTENT_FORMATS: ContentFormat[] = [
  {
    id: 'hot-take',
    name: 'Hot Take',
    emoji: '🔥',
    description: 'Steile, klare Meinung zu einem Immobilien-Thema. Polarisiert bewusst.',
    purpose: 'Reichweite & Wiedererkennung durch starke Haltung. Treibt Kommentare.',
    cadence: '2× / Woche',
    color: '#F7C14B',
  },
  {
    id: 'explainer',
    name: 'Erklär-Stück',
    emoji: '🧠',
    description: 'Ein komplexes Thema (Zins, Nebenkosten, Bewertung) in 45 Sek. verständlich.',
    purpose: 'Autorität & Speicher-Rate. Positioniert dich als kompetenten Insider.',
    cadence: '2× / Woche',
    color: '#12D99A',
  },
  {
    id: 'myth-buster',
    name: 'Mythos-Check',
    emoji: '❌',
    description: 'Räumt mit einem verbreiteten Immobilien-Irrtum auf ("Ohne Erbe keine Immobilie").',
    purpose: 'Shares & Diskussion. Spricht auch Nicht-Käufer an.',
    cadence: '1× / Woche',
    color: '#FF5A5A',
  },
  {
    id: 'story',
    name: 'Story / Persönlich',
    emoji: '🎬',
    description: 'Persönliche Erfahrung, Deal-Anekdote, Fehler & Learnings aus dem Makleralltag.',
    purpose: 'Bindung & Vertrauen. Baut die persönliche Marke auf.',
    cadence: '1× / Woche',
    color: '#5B8DEF',
  },
  {
    id: 'market-update',
    name: 'Markt-Update',
    emoji: '📈',
    description: 'Kurze, meinungsstarke Einordnung aktueller Zahlen für Österreich.',
    purpose: 'Relevanz & Follows von Investoren. News mit Haltung – kein reines Reporting.',
    cadence: '1× / Woche',
    color: '#22D3EE',
  },
  {
    id: 'property-breakdown',
    name: 'Objekt-Analyse',
    emoji: '🏠',
    description: 'Ein reales (oder anonymisiertes) Objekt: Preis, Rendite, Haken – ehrlich seziert.',
    purpose: 'Lead-Generierung (Eigentümer/Investoren). Zeigt Fach-Kompetenz.',
    cadence: '1× / 2 Wochen',
    color: '#EFA92B',
  },
  {
    id: 'behind-the-scenes',
    name: 'Behind the Scenes',
    emoji: '👀',
    description: 'Besichtigung, Verhandlung, Alltag als Makler – roh und nahbar.',
    purpose: 'Nahbarkeit & Reichweite über nicht-fachliches Publikum.',
    cadence: '1× / 2 Wochen',
    color: '#B8FDE6',
  },
];

export const FORMAT_MAP: Record<string, ContentFormat> = Object.fromEntries(
  CONTENT_FORMATS.map((f) => [f.id, f]),
);
