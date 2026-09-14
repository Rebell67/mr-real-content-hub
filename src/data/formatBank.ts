import type { SignatureFormat } from '../types';

// Mr Reals Format-Bank: originelle, entertainment-first Formate, gebaut, um im
// (fast leeren) österreichischen Makler-Feld herauszustechen, zu unterhalten und
// aus Views Follower zu machen. Fokus des OS: JETZT Reichweite & Follower.
//
// Bewusst POSITIV gehalten – du stellst dich und deine Objekte gut dar, statt
// eigene Wohnungen schlechtzureden. Alles mit Handy + einer deiner Listings
// oder nur du vor der Kamera drehbar.
export const FORMAT_SEEDS: SignatureFormat[] = [
  {
    id: 'fmt-price-guess',
    emoji: '🎯',
    name: 'Rate den Wiener Preis',
    hook: 'Diese Wohnung in [Bezirk] – was schätzt du: Kaufpreis oder Monatsmiete? Kommentar!',
    format: 'property-breakdown',
    entertain:
      'Quiz-Mechanik + Neugier-Lücke: Die Leute MÜSSEN den Preis erfahren und bleiben bis zum Reveal. Kommentar-Bait pur.',
    followTrigger:
      'Wer mitraten will, folgt für die nächste Runde. Als feste Serie („jeden Dienstag“) baust du eine Zuschauer-Gewohnheit auf.',
    howTo:
      '10–15 Sek. Handy-Rundgang durch eine deiner schönsten Listings, Preis erst am Ende einblenden. Frage als erster Satz + Text-Overlay.',
    effort: 'low',
    potential: 'viral',
    series: true,
    platforms: ['instagram', 'tiktok', 'youtube'],
  },
  {
    id: 'fmt-city-compare',
    emoji: '⚖️',
    name: 'Gleiches Geld, andere Welt: Wien vs. [Metropole]',
    hook: 'Das bekommst du für 500.000 € in Wien … und das dafür in Dubai. 😳',
    format: 'property-breakdown',
    entertain:
      'Krasser Kontrast in einem Video. „So viel mehr/weniger?!“ ist sofort verständlich, überrascht und wird geteilt.',
    followTrigger:
      'Extrem teilbar → neue Leute landen auf deinem Profil. „Mach das mit [Stadt]!“ = Grund, zu folgen und die Serie zu verfolgen.',
    howTo:
      'Ein schönes Wiener Objekt + ein internationales Referenzbild/Listing (frei verfügbar), Splitscreen. On-Screen-Text: Stadt, m², Preis.',
    effort: 'low',
    potential: 'viral',
    series: true,
    platforms: ['instagram', 'tiktok'],
  },
  {
    id: 'fmt-tier-list',
    emoji: '🏆',
    name: 'Wien-Bezirks-Tier-List',
    hook: 'Ich ranke Wiens Bezirke von S bis F – und der 1. Bezirk ist nicht ganz oben.',
    format: 'hot-take',
    entertain:
      'Tier-Lists sind Kommentar-Maschinen: Jeder hat eine Meinung zu seinem Grätzl und muss widersprechen oder zustimmen.',
    followTrigger:
      'Lokalstolz + Kontroverse = maximale Kommentare & Shares in Wien. „Mach die günstigen Bezirke!“ liefert endlos Fortsetzungen.',
    howTo:
      'Talking-Head mit einer simplen S/A/B/C-Grafik als Overlay, ein Satz Begründung pro Bezirk. Nur du + Handy.',
    effort: 'low',
    potential: 'viral',
    series: true,
    platforms: ['tiktok', 'instagram', 'youtube'],
  },
  {
    id: 'fmt-off-market',
    emoji: '🕵️',
    name: 'Off-Market: die Wohnungen, die nie online gehen',
    hook: 'Die besten Wiener Wohnungen siehst du nie auf willhaben. Hier ist der Grund.',
    format: 'behind-the-scenes',
    entertain:
      'Exklusivität + Insider-Blick. „Geheimes Wissen“, das die meisten nicht kennen, hält bis zum Schluss.',
    followTrigger:
      'Positioniert dich als den mit dem Zugang. Zuschauer folgen, um an die „geheimen“ Objekte zu kommen → warme Leads später.',
    howTo:
      'Talking-Head, erklär wie Off-Market läuft (ohne Objekt-Details zu verraten). Optional B-Roll einer Tür/Adresse.',
    effort: 'low',
    potential: 'high',
    series: true,
    platforms: ['instagram', 'tiktok'],
  },
  {
    id: 'fmt-glow-up',
    emoji: '✨',
    name: 'Wohnungs-Glow-Up: vorher → nachher',
    hook: 'Dieselbe Wohnung – vor und nach dem Home-Staging. Achte auf Sekunde 8.',
    format: 'property-breakdown',
    entertain:
      'Before/After-Transformationen sind ein Ur-Viralformat: befriedigend, teilbar, funktioniert stumm. Positiver Wow-Effekt.',
    followTrigger:
      'Zeigt deine Kompetenz, ohne etwas schlechtzureden. „Wie hast du das gemacht?“ = Kommentare + Abos.',
    howTo:
      'Gleicher Kameraweg vor und nach dem Staging/Aufräumen, harter Schnitt auf den Beat. Handy + Stativ reicht.',
    effort: 'medium',
    potential: 'high',
    series: true,
    platforms: ['instagram', 'tiktok'],
  },
  {
    id: 'fmt-viewing-check',
    emoji: '👀',
    name: '3 Dinge, die ich bei jeder Besichtigung zuerst checke',
    hook: 'Bevor du eine Wohnung kaufst: DIESE 3 Dinge checke ich in den ersten 30 Sekunden.',
    format: 'explainer',
    entertain:
      'Konkreter Insider-Guide zum sofort Nachmachen – hoher Nutzwert, wird gespeichert und weitergeschickt.',
    followTrigger:
      'Speicher-/Share-Bait → Reichweite. „Was checkst du als Nächstes?“ macht Lust auf mehr Tipps von dir.',
    howTo:
      'Talking-Head oder kurzer Rundgang, 3 Punkte mit Text-Overlay. Positiv/lehrreich, keine Wohnung wird schlechtgemacht.',
    effort: 'low',
    potential: 'high',
    series: true,
    platforms: ['tiktok', 'instagram', 'youtube'],
  },
  {
    id: 'fmt-agent-truth',
    emoji: '🤫',
    name: 'Makler-Wahrheiten, die dir keiner sagt',
    hook: 'Als Makler dürfte ich das eigentlich nicht sagen …',
    format: 'hot-take',
    entertain:
      'Verbotenes-Wissen-Effekt + leichte Provokation über die BRANCHE (nicht deine Objekte). Ein starker Satz, der Kommentare auslöst.',
    followTrigger:
      'Insider-Serie = Grund dranzubleiben („was sagt er nächste Woche?“). Positioniert dich als DIE ehrliche Stimme Wiens.',
    howTo:
      'Talking-Head, ein starker Take pro Video über den Markt/die Branche, Text-Overlay mit der These. Nur du + Kamera.',
    effort: 'low',
    potential: 'viral',
    series: true,
    platforms: ['tiktok', 'instagram'],
  },
  {
    id: 'fmt-what-i-earn',
    emoji: '💰',
    name: 'Was ein Makler WIRKLICH verdient',
    hook: 'Was verdiene ich an dieser Vermittlung? Ich rechne es dir ehrlich vor.',
    format: 'explainer',
    entertain:
      'Geld-Transparenz ist Tabu → maximale Neugier. Offen die Zahlen zu zeigen wirkt mutig und bleibt hängen.',
    followTrigger:
      'Radikale Transparenz baut parasoziale Nähe – Leute folgen Menschen, die ehrlich mit Geld sind.',
    howTo:
      'Talking-Head + On-Screen-Rechnung (Provision, Aufwand, was übrig bleibt). Kein Setup.',
    effort: 'low',
    potential: 'viral',
    series: false,
    platforms: ['tiktok', 'instagram', 'youtube'],
  },
  {
    id: 'fmt-3-buyertypes',
    emoji: '🧠',
    name: '1 Wohnung – 3 Käufertypen',
    hook: 'Dieselbe Wohnung, 3 komplett verschiedene Käufer. Für wen lohnt sie sich wirklich?',
    format: 'property-breakdown',
    entertain:
      'Cleverer Perspektivwechsel: Student vs. Familie vs. Anleger. Überraschend, lehrreich, hält bis zur Auflösung.',
    followTrigger:
      'Jeder erkennt sich in einem Typ wieder → hohe Identifikation + Shares. „Mach Typ 4!“ = Serienpotenzial.',
    howTo:
      'Eine Listing zeigen, 3 kurze Einschätzungen als Kapitel mit Text-Overlay. Ein Take, Handy.',
    effort: 'low',
    potential: 'high',
    series: true,
    platforms: ['instagram', 'tiktok', 'youtube'],
  },
  {
    id: 'fmt-storytime',
    emoji: '🎬',
    name: 'Storytime: mein verrücktester Deal',
    hook: 'Ein Kunde wollte eine Wohnung kaufen, die er nie betreten hat. Was dann passierte …',
    format: 'story',
    entertain:
      'Echtes Storytelling mit Cliffhanger. Menschen lieben Geschichten – hält länger als jedes Zahlen-Reel.',
    followTrigger:
      'Persönlichkeit = Follow-Grund Nr. 1. Wer DICH mag, folgt DIR – nicht dem Thema. Baut deine Personenmarke.',
    howTo:
      'Nur du, ein spannender erster Satz, erzähl’s in einem Take. Optional B-Roll vom Objekt.',
    effort: 'low',
    potential: 'high',
    series: true,
    platforms: ['tiktok', 'instagram', 'youtube'],
  },
  {
    id: 'fmt-street-quiz',
    emoji: '🎤',
    name: 'Straßen-Umfrage: Was kostet Wohnen in Wien?',
    hook: 'Ich frage Wiener auf der Straße, was 60 m² in der Innenstadt kosten. Die Antworten …',
    format: 'behind-the-scenes',
    entertain:
      'Straßen-Interviews sind ein bewährtes Viralformat: echte Reaktionen, Überraschung, Humor. Sofort mitfieberbar.',
    followTrigger:
      'Menschen + Emotion + Wien-Bezug = maximale lokale Teilbarkeit. Wiedererkennbares Serienformat mit dir als Host.',
    howTo:
      'Handy + Ansteck-Mikro, 3–4 Passanten fragen, beste Reaktionen schneiden. Etwas mehr Aufwand, enorme Reichweite.',
    effort: 'medium',
    potential: 'viral',
    series: true,
    platforms: ['tiktok', 'instagram', 'youtube'],
  },
  {
    id: 'fmt-reaction',
    emoji: '🔁',
    name: 'Reaction: Ich bewerte virale Immobilien-Tipps',
    hook: 'TikTok sagt, so wirst du mit 25 Immobilien-Millionär. Ein Makler reagiert.',
    format: 'myth-buster',
    entertain:
      'Reaction/Stitch nutzt die Reichweite fremder viraler Clips und liefert deine Experten-Meinung obendrauf.',
    followTrigger:
      'Du wirst zur verlässlichen Einordnungs-Instanz → Leute folgen, um Bullshit gefiltert zu bekommen.',
    howTo:
      'Stitch/Duett oder Screenshot eines viralen Tipps, du bewertest 20–40 Sek. in die Kamera. Reiner Handy-Take.',
    effort: 'low',
    potential: 'high',
    series: true,
    platforms: ['tiktok', 'instagram'],
  },
  {
    id: 'fmt-rent-vs-buy',
    emoji: '🧮',
    name: 'Mieten vs. Kaufen – der Wien-Reality-Check',
    hook: '„Mieten ist rausgeschmissenes Geld“ – stimmt das in Wien 2026 wirklich?',
    format: 'myth-buster',
    entertain:
      'Streitthema Nr. 1. Eine klare, überraschende Antwort mit Rechnung polarisiert und wird in Kommentaren verteidigt.',
    followTrigger:
      'Debatten-Themen bringen Shares + Duette. Deine klare Position macht dich zitierbar und abonnierbar.',
    howTo:
      'Talking-Head + einfache On-Screen-Rechnung an einem echten Wiener Beispiel. Handy genügt.',
    effort: 'low',
    potential: 'high',
    series: false,
    platforms: ['tiktok', 'instagram', 'youtube'],
  },
  {
    id: 'fmt-rent-to-buy',
    emoji: '🏠',
    name: 'So viel Wohnung bekommst du für deine jetzige Miete',
    hook: 'Du zahlst 1.200 € Miete? So viel Eigentum bekommst du in Wien für dieselbe Rate.',
    format: 'explainer',
    entertain:
      'Aha-Moment mit persönlicher Rechnung: „Warte, das könnte ICH mir leisten?“ – hoher Betroffenheits-Faktor.',
    followTrigger:
      'Betrifft jeden Mieter direkt → gespeichert, geteilt, „mach 800 €/1.500 €!“ = Serienstoff.',
    howTo:
      'Talking-Head + On-Screen-Rechnung Miete → Kaufrate. Ein Beispielobjekt, Handy reicht.',
    effort: 'low',
    potential: 'high',
    series: true,
    platforms: ['tiktok', 'instagram', 'youtube'],
  },
  {
    id: 'fmt-taboo-qa',
    emoji: '🙋',
    name: 'Die Frage, die du dich nie zu fragen traust',
    hook: 'Du wolltest schon immer wissen, ob man beim Makler den Preis drücken kann. Reden wir.',
    format: 'explainer',
    entertain:
      'Kommentar-Antwort-Format: nahbar, oft überraschend, immer nützlich. Fühlt sich an wie ein Gespräch mit dir.',
    followTrigger:
      'Der Algorithmus liebt Kommentar-Reply-Reels, und Fragensteller folgen. Endlos-Nachschub aus deinen Kommentaren.',
    howTo:
      'Screenshot der Frage einblenden, du antwortest 20–40 Sek. ehrlich in die Kamera. Reiner Handy-Take.',
    effort: 'low',
    potential: 'high',
    series: true,
    platforms: ['instagram', 'tiktok'],
  },
];
