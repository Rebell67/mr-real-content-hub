import type { NewsItem } from '../types';

// ---------------------------------------------------------------------------
// ECHTER News-Snapshot – recherchiert aus verlässlichen Quellen am 26.07.2026.
// Jede Meldung hat eine echte, klickbare Quelle. Kein erfundener Inhalt.
//
// Dieser Snapshot ist statisch (bis zum nächsten manuellen Update). Die
// gehostete Version (api/news.js) zieht die News automatisch täglich frisch.
// ---------------------------------------------------------------------------
export const NEWS_SNAPSHOT_LABEL = '26.07.2026';

export const SEED_NEWS: NewsItem[] = [
  {
    id: 'n-ezb',
    headline: 'EZB hält den Leitzins bei 2,25 % – keine Senkung im Juli',
    summary:
      'Der EZB-Rat ließ die Leitzinsen am 23. Juli 2026 unverändert. Der Einlagensatz bleibt bei 2,25 %. Nächster Termin: 10. September 2026.',
    source: 'Finanztip',
    url: 'https://www.finanztip.de/zinsentwicklung/ezb-leitzins/',
    publishedAgoHours: 72,
    category: 'zinsen',
    region: 'International',
    subs: { emotion: 55, betroffenheit: 85, naehe: 95, hook: 74, aktualitaet: 84 },
    hook: 'Die EZB senkt die Zinsen NICHT – und wer weiter auf die große Zinswende wartet, wartet sich arm.',
    angle: 'News mit klarer Einordnung: Warum Abwarten auf Zinssenkungen dich beim Kauf Geld kosten kann.',
    suggestedFormat: 'market-update',
  },
  {
    id: 'n-preise',
    headline: 'Trendwende am Immobilienmarkt: Preise steigen 2026 wieder',
    summary:
      'Nach zwei Jahren Korrektur ziehen die Wohnimmobilienpreise wieder an (+3,3 % Q4 2024–Q1 2026). Für 2026 werden weitere Anstiege prognostiziert (+3,5 % in Zentrallagen).',
    source: 'SELFIMMO',
    url: 'https://selfimmo.at/ratgeber/immobilienmarkt-oesterreich-2026',
    publishedAgoHours: 54,
    category: 'immobilien',
    region: 'AT',
    subs: { emotion: 62, betroffenheit: 80, naehe: 96, hook: 80, aktualitaet: 78 },
    hook: 'Das Zeitfenster für günstige Immobilien schließt sich gerade – die Preise drehen wieder nach oben.',
    angle: 'Markt-Update mit Dringlichkeit: Warum die Käufer-Zurückhaltung endet und was das für dich heißt.',
    suggestedFormat: 'market-update',
  },
  {
    id: 'n-miete',
    headline: 'Mietpreisbremse ab April 2026: Richtwertmieten dürfen nur um 1 % steigen',
    summary:
      'Das neue Mieten-Wertsicherungsgesetz begrenzt Erhöhungen: Richtwert- und Kategoriemieten 2026 nur +1 %, 2027 +2 %. Erhöhungen frühestens ab April, einmal jährlich.',
    source: 'Arbeiterkammer',
    url: 'https://www.arbeiterkammer.at/beratung/konsument/bauenundwohnen/miete/Mietpreisbremse.html',
    publishedAgoHours: 96,
    category: 'politik',
    region: 'AT',
    subs: { emotion: 86, betroffenheit: 86, naehe: 82, hook: 88, aktualitaet: 70 },
    hook: 'Mietpreisbremse klingt super für Mieter – aber der Haken trifft am Ende alle. Klartext.',
    angle: 'Polarisierendes Politthema mit zwei Lagern → Kommentar-Treiber. Zeig die unbequeme zweite Seite.',
    suggestedFormat: 'hot-take',
  },
  {
    id: 'n-wohnkosten',
    headline: 'Trotz Mietpreisbremse: Wohnkosten steigen – Mindestrücklage rauf auf 1,13 €/m²',
    summary:
      'Die verpflichtende Erhaltungs-Rücklage steigt inflationsbedingt von 1,06 auf 1,13 €/m² Nutzfläche. Wohnen wird für viele 2026 trotz Bremse teurer.',
    source: 'Finanz.at',
    url: 'https://www.finanz.at/news/ruecklage-wohnung-erhoehung-2026-11264/',
    publishedAgoHours: 66,
    category: 'immobilien',
    region: 'AT',
    subs: { emotion: 74, betroffenheit: 84, naehe: 84, hook: 80, aktualitaet: 72 },
    hook: 'Trotz Mietpreisbremse zahlst du 2026 mehr fürs Wohnen – hier ist der Grund, den kaum jemand erklärt.',
    angle: 'Erklär-Stück: die versteckten Wohn-Nebenkosten, die durch die Hintertür steigen.',
    suggestedFormat: 'explainer',
  },
  {
    id: 'n-kim',
    headline: 'Strenge Kreditregeln (KIM-V) sind Geschichte – was jetzt für den Wohnkredit gilt',
    summary:
      'Die KIM-Verordnung ist seit Juli 2025 ausgelaufen. Die FMA hält 90/40/35 (10 % Eigenmittel, 40 % Schuldenquote, 35 Jahre) als unverbindliche Richtschnur – Banken dürfen abweichen.',
    source: 'finfo.at',
    url: 'https://www.finfo.at/finanzierung/kim-verordnung/',
    publishedAgoHours: 120,
    category: 'finanzen',
    region: 'AT',
    subs: { emotion: 58, betroffenheit: 88, naehe: 94, hook: 74, aktualitaet: 58 },
    hook: 'Die strengsten Kreditregeln Österreichs sind weg – für viele wird der Kauf jetzt wieder realistisch.',
    angle: 'Erklär-Stück: Was das Ende der KIM-V konkret für deine Finanzierungschancen bedeutet.',
    suggestedFormat: 'explainer',
  },
  {
    id: 'n-inflation',
    headline: 'Inflation sinkt auf 3,2 % – Lebensmittel trotzdem stärker teurer',
    summary:
      'Die Teuerung fiel im Juni auf 3,2 % (nach 3,7 % im Mai), vor allem wegen billigerer Treibstoffe. Dienstleistungen treiben die Kerninflation weiter. EZB-Ziel: 2 %.',
    source: 'DerStandard',
    url: 'https://www.derstandard.at/story/3000000329351/inflation-bei-32-prozent-lebensmittel-wurden-schneller-teurer-als-die-meisten-anderen-waren',
    publishedAgoHours: 216,
    category: 'wirtschaft',
    region: 'AT',
    subs: { emotion: 60, betroffenheit: 82, naehe: 68, hook: 70, aktualitaet: 66 },
    hook: 'Die Inflation fällt – und dein Alltag wird trotzdem teurer. Der Grund überrascht die meisten.',
    angle: 'Erklär-Stück: Warum sinkende Inflation nicht heißt, dass es billiger wird – und was das fürs Sparen bedeutet.',
    suggestedFormat: 'explainer',
  },
  {
    id: 'n-eigenkapital',
    headline: 'Wie viel Eigenkapital du 2026 wirklich fürs Eigenheim brauchst',
    summary:
      'Nach dem Ende der KIM-V orientieren sich Banken weiter an rund 20 % Eigenmitteln als solide Basis. Ende 2025 erfüllten noch 81 % der neuen Kredite die alten Richtlinien.',
    source: 'Kroy Immobilien',
    url: 'https://www.kroy-immobilien.at/allgemein/eigenkapital-immobilienkredit-2026/',
    publishedAgoHours: 168,
    category: 'finanzen',
    region: 'AT',
    subs: { emotion: 66, betroffenheit: 90, naehe: 92, hook: 82, aktualitaet: 60 },
    hook: '20 % Eigenkapital fürs Eigenheim? So viel brauchst du 2026 wirklich – und so kommst du schneller hin.',
    angle: 'Rechen-/Erklär-Stück mit hoher Betroffenheit – konkret auf die Situation der Zuschauer gemünzt.',
    suggestedFormat: 'explainer',
  },
  {
    id: 'n-regional',
    headline: 'Wien vs. Burgenland: Wo dein Geld beim Immobilienkauf am meisten bringt',
    summary:
      'Der mediane Angebotspreis liegt österreichweit bei rund 7.054 €/m². Regional klaffen die Preise weit auseinander – Wien ist deutlich teurer als das günstige Burgenland.',
    source: 'fylpi',
    url: 'https://fylpi.at/immobilienpreise/',
    publishedAgoHours: 96,
    category: 'immobilien',
    region: 'AT',
    subs: { emotion: 64, betroffenheit: 70, naehe: 96, hook: 84, aktualitaet: 66 },
    hook: 'Gleiches Geld, andere Stadt: In Wien bekommst du fürs selbe Budget oft die halbe Wohnung.',
    angle: 'Preisvergleich-Format (Objekt-Analyse) – greifbar, teilbar, starker visueller Kontrast.',
    suggestedFormat: 'property-breakdown',
  },
];
