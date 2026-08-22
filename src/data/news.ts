import type { NewsItem } from '../types';

// ---------------------------------------------------------------------------
// ECHTER News-Snapshot – recherchiert aus verlässlichen Quellen am 22.08.2026.
// Jede Meldung hat eine echte, klickbare Quelle. Kein erfundener Inhalt.
//
// Dieser Snapshot ist statisch (bis zum nächsten Update). Die gehostete
// Version (api/news.js) zieht die News automatisch täglich frisch.
// ---------------------------------------------------------------------------
export const NEWS_SNAPSHOT_LABEL = '22.08.2026';

export const SEED_NEWS: NewsItem[] = [
  {
    id: 'n-junge-eigentum',
    headline: 'Nur noch 30 % der jungen Österreicher wohnen im Eigentum',
    summary:
      'Die Eigentumsquote sank 2025 auf 47,3 %. Bei den 25- bis 39-Jährigen leben nur 30,6 % im Eigentum, seit Q3 2022 wurden 60 % weniger Immobilien gekauft. Trotzdem wollen zwei Drittel der Jungen ins Eigentum.',
    source: 'ImmoFokus',
    url: 'https://immofokus.at/a/zwischen-wunsch-und-wirklichkeit-junge-menschen-und-leistbares-wohnen',
    publishedAgoHours: 96,
    category: 'immobilien',
    region: 'AT',
    subs: { emotion: 90, betroffenheit: 90, naehe: 86, hook: 92, aktualitaet: 68 },
    hook: 'Nur noch 30 % der Jungen wohnen im Eigentum – und genau das ist deine größte Chance, wenn du es richtig anpackst.',
    angle: 'Gegenposition zum Zeitgeist + Mut machen mit Plan. Trifft die Kern-Zielgruppe mitten ins Herz.',
    suggestedFormat: 'hot-take',
  },
  {
    id: 'n-wien-ultrareich',
    headline: 'Gehört Wien bald nur noch den Ultrareichen?',
    summary:
      'Eine Marktanalyse warnt: Steigende Preise und knappes Angebot drängen Normalverdiener zunehmend aus Wien. Die Debatte um Leistbarkeit spitzt sich zu.',
    source: 'Immobilien-Redaktion',
    url: 'https://immobilien-redaktion.com/artikel/immobilienpreise-osterreich-2026-warum-wien-bald-nur-noch-den-ultrareichen-gehort',
    publishedAgoHours: 130,
    category: 'immobilien',
    region: 'AT',
    subs: { emotion: 92, betroffenheit: 76, naehe: 90, hook: 90, aktualitaet: 64 },
    hook: 'Gehört Wien bald nur noch den Ultrareichen? Was gerade am Markt passiert, musst du wissen – bevor es zu spät ist.',
    angle: 'Polarisierende Systemkritik → Kommentar-Treiber. Klare Meinung + Handlungsoption für „Normalos".',
    suggestedFormat: 'hot-take',
  },
  {
    id: 'n-preise-h1',
    headline: 'Immobilienpreise ziehen wieder an: Eigentumswohnungen +5 % im ersten Halbjahr',
    summary:
      'Im 1. Halbjahr 2026 stiegen Eigentumswohnungen im Schnitt um 5 % auf 6.248 €/m², Häuser +4 % auf 4.187 €/m². Kärnten +7 %, Wien +2 % (6.729 €/m²). Der Preisindex erreichte mit 274 Punkten ein neues Hoch.',
    source: 'news.at',
    url: 'https://www.news.at/wohnen/immobilienpreise-oesterreich-erstes-halbjahr-2026',
    publishedAgoHours: 240,
    category: 'immobilien',
    region: 'AT',
    subs: { emotion: 62, betroffenheit: 82, naehe: 96, hook: 80, aktualitaet: 70 },
    hook: 'Die Preise ziehen wieder an – +5 % in nur einem halben Jahr. Das günstige Zeitfenster schließt sich gerade.',
    angle: 'Markt-Update mit Dringlichkeit und konkreten Zahlen je Bundesland.',
    suggestedFormat: 'market-update',
  },
  {
    id: 'n-ezb',
    headline: 'EZB hält den Leitzins bei 2,25 % – im September wird eine Erhöhung erwartet',
    summary:
      'Der EZB-Rat ließ die Zinsen am 23. Juli unverändert (Einlagensatz 2,25 %). Nach der Anhebung im Juni erwarten manche Fachleute für den nächsten Termin am 10. September einen weiteren Schritt auf 2,50 %.',
    source: 'justTRADE',
    url: 'https://www.justtrade.com/news/ezb-zinsentscheid-juli-2026-leitzins-bleibt-bei-225',
    publishedAgoHours: 168,
    category: 'zinsen',
    region: 'International',
    subs: { emotion: 60, betroffenheit: 86, naehe: 95, hook: 78, aktualitaet: 74 },
    hook: 'Die EZB senkt NICHT – im September könnten die Zinsen sogar steigen. Wer jetzt weiter wartet, verzockt sich.',
    angle: 'News mit Konsequenz: Warum Warten auf fallende Zinsen beim Kauf gefährlich werden kann.',
    suggestedFormat: 'market-update',
  },
  {
    id: 'n-mietkauf',
    headline: 'Mieten oder kaufen 2026 – was sich in Österreich wirklich rechnet',
    summary:
      'Sinkende Wohnbaukreditzinsen, gestiegene Einkommen und die neue Mietpreisbremse verschieben die Rechnung. Der Vergleich fällt je nach Lage und Haltedauer sehr unterschiedlich aus.',
    source: 'SmartLandlord',
    url: 'https://www.smartlandlord.at/blog/mieten-oder-kaufen-2025-was-rechnet-sich/',
    publishedAgoHours: 150,
    category: 'finanzen',
    region: 'AT',
    subs: { emotion: 72, betroffenheit: 88, naehe: 92, hook: 88, aktualitaet: 60 },
    hook: 'Mieten oder kaufen 2026? Ich rechne dir gnadenlos vor, was sich in Österreich wirklich lohnt.',
    angle: 'Rechen-Klassiker mit riesiger Betroffenheit – ideal für ein „Live-Rechnung"-Reel.',
    suggestedFormat: 'explainer',
  },
  {
    id: 'n-inflation',
    headline: 'Inflation sinkt im Juli auf 2,8 % – Mehrwertsteuer-Senkung bei Lebensmitteln wirkt',
    summary:
      'Die Teuerung fiel von 3,2 % (Juni) auf 2,8 %. Die Hälfte des Rückgangs kommt von günstigeren Lebensmitteln (MwSt-Senkung). Dienstleistungen bleiben mit +4,4 % der Haupttreiber, die Kerninflation liegt bei 3,0 %.',
    source: 'ORF',
    url: 'https://orf.at/stories/3439597/',
    publishedAgoHours: 168,
    category: 'wirtschaft',
    region: 'AT',
    subs: { emotion: 58, betroffenheit: 84, naehe: 66, hook: 72, aktualitaet: 76 },
    hook: 'Inflation fällt auf 2,8 % – trotzdem wird dein Leben teurer. Der wahre Grund liegt woanders.',
    angle: 'Erklär-Stück: Warum sinkende Inflation nicht „billiger" heißt und was das fürs Sparen bedeutet.',
    suggestedFormat: 'explainer',
  },
  {
    id: 'n-bauzinsen',
    headline: 'Bauzinsen im August: solide Finanzierung wieder ab rund 3,5 %',
    summary:
      'Wohnbaukredite starten bei ca. 3,04 % (10 Jahre fix, 80 % Beleihung); effektiv 3,5–3,9 %. Der 3-Monats-Euribor (variabel) liegt bei 2,35–2,40 % und ist zuletzt gestiegen.',
    source: 'Capitalo',
    url: 'https://www.capitalo.at/baufinanzierung/zinsen',
    publishedAgoHours: 72,
    category: 'finanzen',
    region: 'AT',
    subs: { emotion: 50, betroffenheit: 86, naehe: 94, hook: 70, aktualitaet: 78 },
    hook: 'Baufinanzierung ab 3,5 %? Klingt viel – ist im Langzeit-Vergleich aber fast ein Geschenk. Ich erklär dir warum.',
    angle: 'Erklär-Stück, das die aktuelle Zinsangst einordnet und Entscheidungssicherheit gibt.',
    suggestedFormat: 'explainer',
  },
  {
    id: 'n-mietpaket',
    headline: 'Mietpaket beschlossen: Deckel von 1 % (2026) und 2 % (2027), dauerhafte Mietpreisbremse',
    summary:
      'Nach dem Mietstopp 2025 gilt im regulierten Bereich eine Erhöhungsgrenze von 1 % für 2026 und 2 % für 2027, dazu eine dauerhafte Bremse im freien Segment. Die Maßnahmen greifen seit Januar 2026.',
    source: 'Bundeskanzleramt',
    url: 'https://www.bundeskanzleramt.gv.at/bundeskanzleramt/nachrichten-der-bundesregierung/2025/10/mietpaket-fuer-leistbares-wohnen-beschlossen.html',
    publishedAgoHours: 200,
    category: 'politik',
    region: 'AT',
    subs: { emotion: 84, betroffenheit: 84, naehe: 80, hook: 86, aktualitaet: 62 },
    hook: 'Mietpaket beschlossen: 1 %-Deckel klingt nach Sieg für Mieter – aber lies unbedingt das Kleingedruckte.',
    angle: 'Politthema mit zwei Lagern → Diskussion. Zeig die unbequeme zweite Seite der Deckelung.',
    suggestedFormat: 'hot-take',
  },
];
