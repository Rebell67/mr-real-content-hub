import type { ContentFormatId, ContentIdea } from '../types';
import { FORMAT_MAP } from '../data/formats';

// ---------------------------------------------------------------------------
// Skript-Struktur für Mr Real.
//
// Festes Schema: Hook · Lead · Body 1 · Open Loop 1 · Body 2 · Open Loop 2 ·
// Body 3 · CTA. Dasselbe Gerüst wird sowohl vom Offline-Vorlagengenerator als
// auch vom Claude-KI-Pfad (api/script.js) befüllt.
// ---------------------------------------------------------------------------

export interface ScriptSection {
  key: string;
  label: string;
  hint: string;
  text: string;
  seconds: string;
}

export interface Script {
  ideaId: string;
  title: string;
  format: ContentFormatId;
  totalSeconds: string;
  sections: ScriptSection[];
}

export type RawScript = Record<string, string>; // keyed by section key

const SECTION_META: Array<{ key: string; label: string; hint: string; seconds: string }> = [
  { key: 'hook', label: 'Hook', hint: 'Erste 1,5 Sek. – sofort stoppen', seconds: '0–3 Sek.' },
  { key: 'lead', label: 'Lead', hint: 'Versprechen: warum dranbleiben lohnt', seconds: '3–6 Sek.' },
  { key: 'body1', label: 'Body 1', hint: 'Erster Kernpunkt', seconds: '6–12 Sek.' },
  { key: 'openLoop1', label: 'Open Loop 1', hint: 'Spannung auf den nächsten Punkt', seconds: '2–3 Sek.' },
  { key: 'body2', label: 'Body 2', hint: 'Zweiter Kernpunkt', seconds: '6–12 Sek.' },
  { key: 'openLoop2', label: 'Open Loop 2', hint: 'Spannung auf den Abschluss', seconds: '2–3 Sek.' },
  { key: 'body3', label: 'Body 3', hint: 'Dritter Punkt / Zuspitzung', seconds: '6–12 Sek.' },
  { key: 'cta', label: 'CTA', hint: 'Klare Aufforderung zu folgen', seconds: '3–5 Sek.' },
];

// Baut aus 8 Roh-Texten (Vorlage ODER Claude) ein fertiges Script-Objekt.
export function assembleScript(idea: ContentIdea, raw: RawScript): Script {
  return {
    ideaId: idea.id,
    title: idea.title,
    format: idea.format,
    totalSeconds: '≈ 35–45 Sek.',
    sections: SECTION_META.map((m) => ({
      key: m.key,
      label: m.label,
      hint: m.hint,
      seconds: m.seconds,
      text: (raw[m.key] ?? '').trim(),
    })),
  };
}

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function deriveTopic(idea: ContentIdea): string {
  // Nur an ":" und "–" trennen (nicht am Bindestrich), damit Titel wie
  // „Der 100-€-Test" oder „Miete vs. Kauf" als Ganzes erhalten bleiben.
  const cut = idea.title.split(/[–:]/)[0].trim().replace(/[?]$/, '');
  return cut || idea.title;
}

// ---- Bausteine je Format (Offline-Vorlage) --------------------------------

const LEADS: Record<ContentFormatId, string[]> = {
  'hot-take': [
    'Klingt hart, aber die Zahlen geben mir recht – und am Ende verstehst du warum.',
    'Die meisten wollen das nicht hören. Genau deshalb sag ich es dir jetzt.',
    'Bevor du wütend wegswipest: Gib mir 30 Sekunden, dann diskutieren wir.',
  ],
  explainer: [
    'Ich erklär dir das ohne Fachchinesisch – mit einem konkreten Beispiel zum Mitrechnen.',
    'Keine Sorge, das ist einfacher als du denkst. In 30 Sekunden hast du es verstanden.',
    'Das versteht fast keiner richtig – nach diesem Video schon.',
  ],
  'myth-buster': [
    'Das glaubt fast jeder – und genau deshalb verlieren so viele bares Geld.',
    'Dieser Mythos hält sich hartnäckig. Zeit, dass wir damit aufräumen.',
    'Wenn du das auch denkst, bist du nicht allein – aber du liegst falsch.',
  ],
  story: [
    'Das ist mir wirklich passiert – und die Lektion daraus vergisst du nicht mehr.',
    'Ich hab lange überlegt, ob ich das erzähle. Aber du kannst was draus lernen.',
    'Setz dich kurz hin, das wird ehrlich.',
  ],
  'market-update': [
    'Die Zahlen sind frisch – und die meisten reagieren viel zu spät darauf.',
    'Das ändert gerade wirklich etwas – und kaum jemand redet drüber.',
    'Kurz und ohne Panik: Das solltest du jetzt wissen.',
  ],
  'behind-the-scenes': [
    'Ich nehm dich mit – so läuft das wirklich, ungeschönt.',
    'Das siehst du sonst nie. Genau deshalb zeig ich es dir.',
    'Komm mit hinter die Kulissen, das ist ehrlicher als jedes Hochglanz-Video.',
  ],
  'property-breakdown': [
    'Wir gehen das Objekt gemeinsam durch – ehrlich, mit allen Haken.',
    'Ich seziere das für dich wie für meinen eigenen Kauf.',
    'Zahlen auf den Tisch – lohnt sich das oder nicht?',
  ],
};

const BODY1: Record<ContentFormatId, string[]> = {
  'hot-take': [
    'Erstens: {topic} wird komplett falsch eingeordnet. Die meisten schauen nur auf den Preis – und übersehen das Entscheidende.',
    'Fakt ist: Bei {topic} zählt nicht, was alle sagen, sondern was die Rechnung sagt. Und die ist eindeutig.',
  ],
  explainer: [
    'Schritt 1: Was {topic} überhaupt bedeutet – kurz und konkret an einer echten Zahl.',
    'Das Wichtigste zuerst: Bei {topic} gibt es genau eine Kennzahl, auf die es ankommt.',
  ],
  'myth-buster': [
    'Der Mythos sagt: „{topic} ist immer schlecht." Die Realität sieht anders aus.',
    'Alle glauben, {topic} funktioniert nur mit viel Geld. Stimmt nicht – hier ist der Beweis.',
  ],
  story: [
    'Angefangen hat alles mit {topic}. Ich dachte, ich hätte alles im Griff.',
    'Es ging um {topic}. Und ich hab einen Fehler gemacht, den ich heute nicht mehr machen würde.',
  ],
  'market-update': [
    'Die aktuelle Lage bei {topic}: Die Zahlen bewegen sich – und zwar in eine klare Richtung.',
    'Was gerade bei {topic} passiert, hat direkte Folgen für deinen Geldbeutel.',
  ],
  'behind-the-scenes': [
    'Erster Blick: Bei {topic} achte ich sofort auf ein Detail, das fast alle übersehen.',
    'Das Erste, was ich bei {topic} checke, verrät mir schon die halbe Wahrheit.',
  ],
  'property-breakdown': [
    'Der Preis für {topic} klingt erstmal fair. Aber schauen wir auf die Rendite.',
    'Auf den ersten Blick top: {topic}. Jetzt kommen die Zahlen.',
  ],
};

const BODY2: Record<ContentFormatId, string[]> = {
  'hot-take': [
    'Zweitens – und hier wird’s unbequem: Wer bei {topic} wartet, zahlt am Ende drauf. Jedes Jahr.',
    'Und jetzt der Punkt, der weh tut: {topic} verzeiht keine Ausreden. Die Zeit läuft gegen dich.',
  ],
  explainer: [
    'Schritt 2: So rechnest du {topic} für deine Situation aus – mit einer Zahl, die du selbst kennst.',
    'Jetzt wird’s praktisch: Nimm deine eigene Zahl und setz sie bei {topic} ein.',
  ],
  'myth-buster': [
    'Die Wahrheit: {topic} ist eine Frage der Strategie, nicht des Kontostands.',
    'Was wirklich zählt: Bei {topic} gewinnt, wer den Mechanismus dahinter versteht.',
  ],
  story: [
    'Dann kam der Moment, in dem {topic} plötzlich alles entschied. Mein Herz ist gerutscht.',
    'Mitten drin hab ich gemerkt: Bei {topic} zählt ein Detail mehr als alles andere.',
  ],
  'market-update': [
    'Konkret heißt das für dich: Bei {topic} entsteht gerade ein Zeitfenster – aber es schließt sich.',
    'Der Haken: {topic} belohnt die, die jetzt handeln, nicht die, die abwarten.',
  ],
  'behind-the-scenes': [
    'Dann zeige ich dir den Punkt, an dem sich bei {topic} Profi von Amateur trennt.',
    'Jetzt kommt der Teil, den dir kein Verkäufer freiwillig zeigt.',
  ],
  'property-breakdown': [
    'Rendite gecheckt – und hier trennt sich bei {topic} Schein von Sein.',
    'Jetzt die versteckten Kosten bei {topic}. Die killen oft den ganzen Deal.',
  ],
};

const BODY3: Record<ContentFormatId, string[]> = {
  'hot-take': [
    'Drittens, das Fazit: Bei {topic} gibt es nur zwei Sorten Menschen – die, die handeln, und die, die zusehen. Entscheide dich.',
    'Und deshalb gilt: {topic} ist kein Glück, sondern eine Entscheidung. Deine.',
  ],
  explainer: [
    'Und das Ergebnis: Mit dieser einen Rechnung weißt du bei {topic} sofort, wo du stehst.',
    'Jetzt kennst du bei {topic} die Zahl, die dir kein Makler so ehrlich sagt.',
  ],
  'myth-buster': [
    'Fazit: Vergiss den alten Spruch über {topic}. Die Realität ist deine Chance.',
    'Am Ende bleibt: Wer den Mythos über {topic} durchschaut, ist allen anderen voraus.',
  ],
  story: [
    'Was ich daraus gelernt hab: Bei {topic} entscheidet Vorbereitung über alles. Immer.',
    'Die Lektion: {topic} verzeiht keine Halbherzigkeit – dafür belohnt es Mut.',
  ],
  'market-update': [
    'Mein Rat: Beobachte {topic} nicht nur – zieh deine Konsequenz daraus, heute noch.',
    'Unterm Strich: Bei {topic} gewinnt gerade, wer schneller ist als die Masse.',
  ],
  'behind-the-scenes': [
    'Und genau darum lohnt sich der ehrliche Blick: Bei {topic} steckt der Teufel im Detail.',
    'So triffst du bei {topic} eine Entscheidung, die du nicht bereust.',
  ],
  'property-breakdown': [
    'Mein ehrliches Urteil zu {topic}: Zahlen schlagen Bauchgefühl – jedes Mal.',
    'Unterm Strich bei {topic}: Kaufen oder Finger weg – und warum.',
  ],
};

const OPEN_LOOPS = [
  'Aber das ist noch nicht mal das Wichtigste – der nächste Punkt ist der eigentliche Gamechanger.',
  'Und jetzt kommt der Teil, den fast alle übersehen.',
  'Klingt schon gut? Warte, bis du den nächsten Punkt hörst.',
  'Doch hier wird’s erst richtig interessant.',
  'Merk dir das kurz – gleich ergibt es einen ganz neuen Sinn.',
  'Und genau deshalb funktioniert der nächste Schritt so gut.',
];

const CTAS = [
  'Willst du Teil 2 mit dem konkreten Rechenbeispiel? Dann folge jetzt – kommt diese Woche.',
  'Speicher dir das für deine nächste Entscheidung – und folge für den Rest der Serie.',
  'Wenn dir das was gebracht hat: Folge für ehrliche Immobilien-Insights ohne Maklergeschwätz.',
  'Schreib mir „Ja" in die Kommentare, wenn ich das genauer durchrechnen soll – und folge, damit du’s nicht verpasst.',
  'Folge jetzt – morgen zeig ich dir den Fehler, den fast alle danach machen.',
];

// Offline-Vorlage: erzeugt sofort ein vollständiges Skript (keine API nötig).
export function generateScript(idea: ContentIdea): Script {
  const topic = deriveTopic(idea);
  const fmt = idea.format;
  const fill = (s: string) => s.replace(/\{topic\}/g, topic);

  const raw: RawScript = {
    hook: idea.hook,
    lead: fill(pick(LEADS[fmt])),
    body1: fill(pick(BODY1[fmt])),
    openLoop1: pick(OPEN_LOOPS),
    body2: fill(pick(BODY2[fmt])),
    openLoop2: pick(OPEN_LOOPS),
    body3: fill(pick(BODY3[fmt])),
    cta: pick(CTAS),
  };
  return assembleScript(idea, raw);
}

// Skript als Klartext-Block (für Copy-to-Clipboard / Export).
export function scriptToText(script: Script): string {
  const meta = FORMAT_MAP[script.format];
  const head = `${script.title}\n${meta?.emoji ?? ''} ${meta?.name ?? ''} · ${script.totalSeconds}\n\n`;
  const body = script.sections.map((s) => `${s.label.toUpperCase()} (${s.seconds})\n${s.text}`).join('\n\n');
  return head + body + '\n';
}
