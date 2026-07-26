import type { NewsItem } from '../types';

// ---------------------------------------------------------------------------
// Demo-News (Muster) – Wirtschaft / Immobilien / Finanzen im DACH-Raum.
// Ersetzt durch echte, tagesaktuelle RSS-Meldungen, sobald die App gehostet
// ist (api/news.js zieht dann kostenlos von frei zugänglichen News-Feeds).
// ---------------------------------------------------------------------------
export const SEED_NEWS: NewsItem[] = [
  {
    id: 'n-1',
    headline: 'EZB senkt den Leitzins erneut – Kredite werden günstiger',
    summary:
      'Die Europäische Zentralbank senkt den Leitzins um weitere 0,25 Prozentpunkte. Baufinanzierungen könnten spürbar billiger werden.',
    source: 'Wirtschaftsblatt',
    publishedAgoHours: 3,
    category: 'zinsen',
    region: 'International',
    subs: { emotion: 70, betroffenheit: 92, naehe: 98, hook: 85, aktualitaet: 95 },
    hook: 'Die Zinsen fallen – und die meisten reagieren wieder viel zu spät.',
    angle: 'News + klare Handlungsempfehlung: Wer jetzt eine Finanzierung prüft, spart über die Laufzeit fünfstellig.',
    suggestedFormat: 'market-update',
  },
  {
    id: 'n-2',
    headline: 'Junge Österreicher geben den Traum vom Eigenheim auf',
    summary:
      'Eine neue Studie zeigt: Unter 35-Jährige halten Wohneigentum mehrheitlich für unerreichbar. Fachleute widersprechen.',
    source: 'DerStandard',
    publishedAgoHours: 8,
    category: 'immobilien',
    region: 'AT',
    subs: { emotion: 88, betroffenheit: 90, naehe: 86, hook: 90, aktualitaet: 70 },
    hook: 'Deine Generation gibt Eigentum auf? Genau das ist der teuerste Denkfehler.',
    angle: 'Gegenposition zum Zeitgeist – Mut machen mit konkretem Plan. Spricht direkt die Kern-Zielgruppe an.',
    suggestedFormat: 'hot-take',
  },
  {
    id: 'n-3',
    headline: 'Regierung diskutiert Deckelung der Mieten',
    summary:
      'Ein neuer Vorstoß sieht eine gesetzliche Mietpreisbremse vor. Vermieter warnen vor Investitionsstopp, Mieterschützer jubeln.',
    source: 'ORF',
    publishedAgoHours: 5,
    category: 'politik',
    region: 'AT',
    subs: { emotion: 92, betroffenheit: 84, naehe: 80, hook: 88, aktualitaet: 88 },
    hook: 'Mietpreisbremse klingt super – bis du verstehst, wer am Ende wirklich draufzahlt.',
    angle: 'Polarisierendes Politthema mit zwei Lagern → Kommentar-Treiber. Erkläre die unbequeme zweite Seite.',
    suggestedFormat: 'hot-take',
  },
  {
    id: 'n-4',
    headline: 'Immobilienpreise in Wien steigen erstmals seit zwei Jahren wieder',
    summary:
      'Nach der Delle ziehen die Preise in Ballungsräumen wieder an. Fachleute sehen das Ende der Käufer-Zurückhaltung.',
    source: 'Immobilien Magazin',
    publishedAgoHours: 11,
    category: 'immobilien',
    region: 'AT',
    subs: { emotion: 62, betroffenheit: 78, naehe: 96, hook: 72, aktualitaet: 82 },
    hook: 'Das Zeitfenster für günstige Immobilien schließt sich gerade – hier sind die Zahlen.',
    angle: 'Markt-Update mit Dringlichkeit. Zeigt, warum Abwarten jetzt Geld kostet.',
    suggestedFormat: 'market-update',
  },
  {
    id: 'n-5',
    headline: 'Inflation sinkt auf 2,1 Prozent',
    summary:
      'Die Teuerung nähert sich dem EZB-Ziel. Für Sparer und Kreditnehmer hat das ganz unterschiedliche Folgen.',
    source: 'Statistik Austria',
    publishedAgoHours: 6,
    category: 'wirtschaft',
    region: 'AT',
    subs: { emotion: 55, betroffenheit: 82, naehe: 72, hook: 68, aktualitaet: 90 },
    hook: 'Inflation fällt – und dein Sparbuch verliert trotzdem weiter. So drehst du den Spieß um.',
    angle: 'Erklär-Stück: was fallende Inflation für Erspartes, Kredit und Immobilie bedeutet.',
    suggestedFormat: 'explainer',
  },
  {
    id: 'n-6',
    headline: 'Strengere Kreditregeln (KIM-Verordnung) laufen aus',
    summary:
      'Die verschärften Regeln für Wohnkredite werden nicht verlängert. Banken könnten wieder leichter finanzieren.',
    source: 'FMA',
    publishedAgoHours: 14,
    category: 'finanzen',
    region: 'AT',
    subs: { emotion: 58, betroffenheit: 88, naehe: 94, hook: 74, aktualitaet: 76 },
    hook: 'Die strengsten Kreditregeln fallen weg – für viele wird der Kauf jetzt wieder realistisch.',
    angle: 'Konkrete Konsequenz für Erstkäufer. Erklär, was sich für die Finanzierung ändert.',
    suggestedFormat: 'explainer',
  },
  {
    id: 'n-7',
    headline: 'Grunderwerbsteuer: Reform sorgt für Diskussion',
    summary:
      'Ein Reformvorschlag könnte Käufe für Familien billiger, für Investoren teurer machen.',
    source: 'Die Presse',
    publishedAgoHours: 20,
    category: 'politik',
    region: 'AT',
    subs: { emotion: 66, betroffenheit: 74, naehe: 88, hook: 70, aktualitaet: 64 },
    hook: 'Diese Steuer-Reform entscheidet, ob dein Immobilienkauf tausende Euro mehr kostet.',
    angle: 'Mythos-Check / Erklärung der versteckten Nebenkosten-Falle.',
    suggestedFormat: 'myth-buster',
  },
  {
    id: 'n-8',
    headline: 'Aktienmärkte auf Rekordhoch – Anleger schichten um',
    summary:
      'Während Börsen neue Höchststände erreichen, fragen sich viele: Aktien oder doch lieber Betongold?',
    source: 'Börse Express',
    publishedAgoHours: 9,
    category: 'finanzen',
    region: 'International',
    subs: { emotion: 60, betroffenheit: 62, naehe: 70, hook: 66, aktualitaet: 80 },
    hook: 'Aktien-Rekord vs. Immobilie: Wo dein Geld 2026 wirklich besser aufgehoben ist.',
    angle: 'Vergleich Aktien vs. Immobilie – klassischer Reichweiten-Klassiker mit klarer Meinung.',
    suggestedFormat: 'hot-take',
  },
  {
    id: 'n-9',
    headline: 'Bausparkassen erhöhen die Guthabenzinsen',
    summary:
      'Mehrere Anbieter locken wieder mit höheren Zinsen aufs Bausparen. Lohnt sich der Klassiker noch?',
    source: 'Konsument',
    publishedAgoHours: 26,
    category: 'finanzen',
    region: 'AT',
    subs: { emotion: 40, betroffenheit: 66, naehe: 74, hook: 58, aktualitaet: 55 },
    hook: 'Bausparen – Oma-Tipp oder heimlicher Gewinner 2026? Ehrlich gerechnet.',
    angle: 'Erklär-Stück mit Rechnung. Solide, aber weniger viral.',
    suggestedFormat: 'explainer',
  },
  {
    id: 'n-10',
    headline: 'Tech-Konzern stellt neuen KI-Assistenten vor',
    summary:
      'Ein weiterer KI-Launch dominiert die Schlagzeilen – mit nur indirektem Bezug zu Geld und Immobilien.',
    source: 'TechNews',
    publishedAgoHours: 4,
    category: 'wirtschaft',
    region: 'International',
    subs: { emotion: 45, betroffenheit: 30, naehe: 22, hook: 40, aktualitaet: 92 },
    hook: 'Was der neue KI-Hype mit deinem Immobilienkauf zu tun hat (mehr als du denkst).',
    angle: 'Nur mit klarem Immo-Bezug sinnvoll – sonst thematisch zu weit weg vom Kanal.',
    suggestedFormat: 'explainer',
  },
];
