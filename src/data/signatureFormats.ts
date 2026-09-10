import type { SignatureFormat } from '../types';

// Mr Reals Signature-Formate: originelle, entertainment-first Content-Konzepte,
// entwickelt, um im (fast leeren) österreichischen Makler-Feld herauszustechen,
// zu unterhalten und aus Views neue Follower zu machen.
// Fokus des OS: JETZT maximale Reichweite & Follower – Leads kommen später.
//
// Jedes Format ist bewusst so gebaut, dass du es mit Handy + einer deiner
// Listings (oder nur du vor der Kamera) mit wenig Aufwand drehen kannst.
export const SIGNATURE_FORMATS: SignatureFormat[] = [
  {
    id: 'sig-price-guess',
    emoji: '🎯',
    name: 'Rate den Wiener Preis',
    hook: 'Diese Wohnung in [Bezirk] – was schätzt du: Miete oder Kauf? Schreib’s in die Kommentare.',
    format: 'property-breakdown',
    entertain:
      'Quiz-Mechanik + Neugier-Lücke: Die Leute MÜSSEN den Preis erfahren und bleiben bis zum Reveal. Kommentar-Bait pur.',
    followTrigger:
      'Wer mitraten will, folgt für die nächste Runde. Als feste Serie („Jeden Dienstag“) baust du eine Zuschauer-Gewohnheit auf.',
    howTo:
      '10–15 Sek. Handy-Rundgang durch eine deiner Listings, Preis erst am Ende einblenden. Frage als erster Satz + Text-Overlay.',
    effort: 'low',
    potential: 'viral',
    series: true,
    platforms: ['instagram', 'tiktok', 'youtube'],
  },
  {
    id: 'sig-same-budget',
    emoji: '⚖️',
    name: '400.000 € – Wien vs. Speckgürtel',
    hook: 'Das bekommst du für 400.000 € in Hietzing … und das dafür 20 Minuten weiter draußen.',
    format: 'property-breakdown',
    entertain:
      'Krasser Vorher/Nachher-Kontrast in einem Video. Der Schock-Vergleich („dafür SO wenig?!“) wird geteilt und diskutiert.',
    followTrigger:
      'Extrem teilbar → neue Leute landen auf deinem Profil. „Zeig mehr Bezirke“ = Grund, zu folgen.',
    howTo:
      'Zwei Listings splitscreen oder hintereinander, gleiche Zahl als Anker. On-Screen-Text mit m², Bezirk, Preis.',
    effort: 'low',
    potential: 'viral',
    series: true,
    platforms: ['instagram', 'tiktok'],
  },
  {
    id: 'sig-honest-agent',
    emoji: '🕵️',
    name: 'POV: Besichtigung mit einem EHRLICHEN Makler',
    hook: 'POV: Du besichtigst mit einem Makler, der dir wirklich die Wahrheit sagt.',
    format: 'behind-the-scenes',
    entertain:
      'Skit + Insider-Ehrlichkeit: Du zeigst echte Mängel („der Fleck da? Feuchtigkeit.“). Unterhaltsam UND vertrauensbildend.',
    followTrigger:
      'Ehrlichkeit ist dein Marken-Kern – Leute folgen dem „einen ehrlichen Makler“. Anti-Klischee = Sympathie.',
    howTo:
      'Handkamera-Rundgang, du kommentierst live wie ein echter Freund. Keine Requisiten, nur du + Objekt.',
    effort: 'low',
    potential: 'high',
    series: true,
    platforms: ['tiktok', 'instagram'],
  },
  {
    id: 'sig-worst-flat',
    emoji: '😱',
    name: 'Die schlimmste Wohnung Wiens (für diesen Preis)',
    hook: 'Diese Wohnung kostet 380.000 € – und du wirst gleich schreien.',
    format: 'property-breakdown',
    entertain:
      'Extrem-Anker + Fremdscham-Entertainment. „Das kann nicht ihr Ernst sein“ hält bis zum Schluss und triggert Kommentare.',
    followTrigger:
      'Curiosity/Outrage teilt sich rasant. Mit dem Gegenstück („die beste für’s Geld“) baust du eine Reihe.',
    howTo:
      'Am Markt kursieren genug überteuerte/skurrile Inserate – Screenshots + dein Voice-over-Verriss. Handy reicht.',
    effort: 'low',
    potential: 'viral',
    series: true,
    platforms: ['tiktok', 'instagram'],
  },
  {
    id: 'sig-photo-vs-reality',
    emoji: '📸',
    name: 'Inserats-Foto vs. Realität',
    hook: 'So sah die Wohnung im Inserat aus … und so in echt. 😳',
    format: 'myth-buster',
    entertain:
      '„Erwartung vs. Realität“ ist ein Ur-Viralformat. Der Aha-/Lacheffekt beim Reveal ist sofort verständlich, in jeder Sprache.',
    followTrigger:
      'Du entlarvst Tricks → Zuschauer fühlen sich beschützt und folgen dem „der uns die Tricks zeigt“.',
    howTo:
      'Weitwinkel-Foto vs. dein ehrliches Handyvideo desselben Raums, hart geschnitten. Text: „Foto“ / „Realität“.',
    effort: 'low',
    potential: 'viral',
    series: true,
    platforms: ['instagram', 'tiktok'],
  },
  {
    id: 'sig-3sec-check',
    emoji: '🚩',
    name: '3-Sekunden-Check: Red Flag oder Green Flag?',
    hook: 'Ich gehe durch die Wohnung und du siehst in 3 Sekunden, ob’s ein Kauf ist.',
    format: 'explainer',
    entertain:
      'Schnelles Rot/Grün-Urteil pro Raum – hohes Tempo, rewatchbar, man will’s bis zum Ende sehen.',
    followTrigger:
      'Praktischer Mini-Guide zum Nachmachen → gespeichert & geteilt. „Mach das mit jeder Wohnung“ = Abo-Grund.',
    howTo:
      'Rundgang, pro Raum ein 🚩/✅-Overlay + ein Satz warum. Handy, ein Take.',
    effort: 'low',
    potential: 'high',
    series: true,
    platforms: ['tiktok', 'instagram', 'youtube'],
  },
  {
    id: 'sig-agent-truth',
    emoji: '🤫',
    name: 'Makler-Wahrheiten, die dir keiner sagt',
    hook: 'Als Makler dürfte ich das eigentlich nicht sagen …',
    format: 'hot-take',
    entertain:
      'Verbotenes-Wissen-Effekt + leichte Provokation. Ein starker Satz, der polarisiert und Kommentare (Zustimmung/Widerspruch) auslöst.',
    followTrigger:
      'Insider-Serie = Grund, dranzubleiben („was sagt er nächste Woche?“). Positioniert dich als DIE ehrliche Stimme.',
    howTo:
      'Talking-Head, ein starker Take pro Video, Text-Overlay mit der These. Nur du + Kamera.',
    effort: 'low',
    potential: 'viral',
    series: true,
    platforms: ['tiktok', 'instagram'],
  },
  {
    id: 'sig-what-i-earn',
    emoji: '💰',
    name: 'Was ein Makler WIRKLICH verdient',
    hook: 'Was verdiene ich an dieser Wohnung? Ich sag’s dir – ehrlich.',
    format: 'explainer',
    entertain:
      'Geld-Transparenz ist Tabu → maximale Neugier. Zahlen offen zu legen wirkt mutig und bleibt hängen.',
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
    id: 'sig-dumbest-question',
    emoji: '🙋',
    name: 'Deine dümmste Immobilien-Frage – ehrlich beantwortet',
    hook: 'Du hast gefragt, ob man eine Wohnung „zurückgeben“ kann. Reden wir.',
    format: 'explainer',
    entertain:
      'Kommentar-Antwort-Format: nahbar, oft lustig, immer nützlich. Fühlt sich an wie ein Gespräch mit dir.',
    followTrigger:
      'Der Algorithmus liebt Kommentar-Reply-Reels, und Fragensteller folgen. Endlos-Nachschub aus deinen Kommentaren.',
    howTo:
      'Screenshot des Kommentars einblenden, du antwortest 20–40 Sek. in die Kamera. Reiner Handy-Take.',
    effort: 'low',
    potential: 'high',
    series: true,
    platforms: ['instagram', 'tiktok'],
  },
  {
    id: 'sig-rent-vs-buy',
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
    id: 'sig-storytime',
    emoji: '🎬',
    name: 'Storytime: Mein verrücktester Deal',
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
    id: 'sig-street-quiz',
    emoji: '🎤',
    name: 'Straßen-Umfrage: Was kostet Wohnen in Wien?',
    hook: 'Ich frage Wiener auf der Straße, was 60 m² in der Innenstadt kosten. Die Antworten …',
    format: 'behind-the-scenes',
    entertain:
      'Straßen-Interviews sind ein bewährtes Viralformat: echte Reaktionen, Überraschung, Humor. Sofort mitfieberbar.',
    followTrigger:
      'Menschen + Emotion + Wien-Bezug = maximale Teilbarkeit lokal. Wiedererkennbares Serienformat mit dir als Host.',
    howTo:
      'Handy + Ansteck-Mikro, 3–4 Passanten fragen, beste Reaktionen schneiden. Etwas mehr Aufwand, aber enorme Reichweite.',
    effort: 'medium',
    potential: 'viral',
    series: true,
    platforms: ['tiktok', 'instagram', 'youtube'],
  },
];
