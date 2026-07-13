import type { Trend } from '../types';

// ---------------------------------------------------------------------------
// Beispiel-Trends / Outlier-Muster aus der Immobilien- & Finanz-Nische.
//
// WICHTIG: Das sind illustrative Muster (Demo), keine live gescrapten Videos.
// Sobald eine bezahlte Trend-Quelle (z. B. Apify / EnsembleData) in
// api/trends.js hinterlegt ist, ersetzt der Live-Abruf diese Liste.
// Die Handles sind bewusst generisch gehalten (keine echten Accounts).
// ---------------------------------------------------------------------------
export const SEED_TRENDS: Trend[] = [
  {
    id: 'tr-1',
    platform: 'tiktok',
    hook: 'POV: Du willst deine erste Wohnung – hier ist die ehrliche Rechnung',
    format: 'Live-Rechnung',
    views: 2_400_000,
    outlierFactor: 12.5,
    creatorHandle: '@finanz.klar',
    region: 'AT/DE',
    daysAgo: 4,
    whyItWorks:
      'Bildschirmfüllende Zahlen, die live hochgetippt werden. Zuschauer rechnen mit ihrer eigenen Situation → hohe Speicher- & Teilrate.',
    adaptHook: 'POV: 50.000 € gespart – reicht das für deine erste Wohnung? Ich rechne es live.',
    suggestedFormat: 'explainer',
  },
  {
    id: 'tr-2',
    platform: 'instagram',
    hook: '„Miete ist rausgeworfenes Geld" – der teuerste Boomer-Mythos',
    format: 'Hot Take',
    views: 1_800_000,
    outlierFactor: 9.1,
    creatorHandle: '@immo.meinung',
    region: 'AT/DE',
    daysAgo: 6,
    whyItWorks:
      'Generationen-Reibung + steile These in der ersten Sekunde. Polarisiert stark → Kommentarschlacht pusht die Reichweite.',
    adaptHook: '„Miete ist rausgeworfenes Geld"? Der Satz, den fast alle falsch verstehen.',
    suggestedFormat: 'hot-take',
  },
  {
    id: 'tr-3',
    platform: 'tiktok',
    hook: 'Ich bewerte eure Wohnungs-Inserate (Teil 7)',
    format: 'Reaction / Serie',
    views: 3_100_000,
    outlierFactor: 15.2,
    creatorHandle: '@makler.check',
    region: 'International',
    daysAgo: 3,
    whyItWorks:
      'Community schickt Inserate ein → endloser Content-Nachschub. Serien-Format mit Nummer erzeugt Wiederkehr & Abos.',
    adaptHook: 'Schick mir dein Inserat – ich sage dir schonungslos, ob es sein Geld wert ist. (Teil 1)',
    suggestedFormat: 'property-breakdown',
  },
  {
    id: 'tr-4',
    platform: 'instagram',
    hook: 'So viel Haus bekommst du für 1.500 € Rate',
    format: 'Umkehr-Rechnung',
    views: 980_000,
    outlierFactor: 6.4,
    creatorHandle: '@baufi.tipps',
    region: 'AT/DE',
    daysAgo: 8,
    whyItWorks:
      'Dreht die übliche Rechnung um: von der Monatsrate zum Kaufpreis. Extrem greifbar → jeder kennt seine eigene Rate.',
    adaptHook: 'Sag mir deine Wunsch-Rate, ich sag dir, welches Objekt drin ist.',
    suggestedFormat: 'explainer',
  },
  {
    id: 'tr-5',
    platform: 'tiktok',
    hook: '3 Sätze in Inseraten, die eine glatte Lüge sind',
    format: 'Listicle / Entlarvung',
    views: 1_450_000,
    outlierFactor: 8.7,
    creatorHandle: '@wohnung.insider',
    region: 'AT/DE',
    daysAgo: 5,
    whyItWorks:
      'Insider entlarvt Branchen-Codes. Neugier („was heißt das wirklich?") + schnelle Schnitte pro Punkt = hohe Watchtime.',
    adaptHook: '„Ruhige Lage", „gemütlich", „Anfragen erbeten" – was das WIRKLICH heißt.',
    suggestedFormat: 'myth-buster',
  },
  {
    id: 'tr-6',
    platform: 'instagram',
    hook: 'Zinsen fallen – und die meisten reagieren zu spät',
    format: 'Markt-Reaction',
    views: 720_000,
    outlierFactor: 5.1,
    creatorHandle: '@zins.radar',
    region: 'AT/DE',
    daysAgo: 2,
    whyItWorks:
      'Aktuelle News + klare Handlungsempfehlung statt reinem Reporting. Dringlichkeit („zu spät") treibt Shares.',
    adaptHook: 'Die Zins-Nachricht, auf die alle gewartet haben – und was du JETZT tun solltest.',
    suggestedFormat: 'market-update',
  },
  {
    id: 'tr-7',
    platform: 'tiktok',
    hook: 'Besichtigung: die 3 Stellen, die jeden Schimmel verraten',
    format: 'Vor-Ort-Tipp',
    views: 2_050_000,
    outlierFactor: 11.3,
    creatorHandle: '@bau.check',
    region: 'International',
    daysAgo: 7,
    whyItWorks:
      'Praktischer Nutzwert vor Ort, den man sofort anwenden kann → sehr hohe Speicherrate („für später merken").',
    adaptHook: 'Bevor du kaufst: Diese 3 Stellen entlarven jeden vertuschten Wasserschaden.',
    suggestedFormat: 'behind-the-scenes',
  },
  {
    id: 'tr-8',
    platform: 'instagram',
    hook: 'Mein teuerster Fehler als Makler – 30.000 € an einem Satz',
    format: 'Story / Vulnerability',
    views: 640_000,
    outlierFactor: 4.6,
    creatorHandle: '@ehrlicher.makler',
    region: 'AT/DE',
    daysAgo: 9,
    whyItWorks:
      'Konkrete Zahl im Hook + Verletzlichkeit. Persönliche Fehler-Storys bauen Vertrauen und Bindung auf.',
    adaptHook: 'Ich habe einen Deal über 30.000 € an einem einzigen Satz platzen lassen.',
    suggestedFormat: 'story',
  },
];
