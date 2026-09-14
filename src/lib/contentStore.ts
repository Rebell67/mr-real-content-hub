import type { ContentIdea, SignatureFormat, ContentFormatId, Platform } from '../types';

// -----------------------------------------------------------------------------
// Persistenz im Browser (localStorage). Alles bleibt lokal beim Nutzer erhalten
// – auch auf dem öffentlichen Link – und übersteht App-Neustarts. Jeder Zugriff
// ist in try/catch gekapselt, damit die App auch ohne Storage sauber läuft.
// -----------------------------------------------------------------------------
const LS = {
  ideaExtras: 'mrreal.ideas.extras.v1', // selbst hinzugefügte + generierte Ideen
  ideaHidden: 'mrreal.ideas.hidden.v1', // ausgeblendete Seed-Ideen (IDs)
  fmtExtras: 'mrreal.formats.extras.v1', // generierte + aus Ideen übernommene Formate
  fmtHidden: 'mrreal.formats.hidden.v1', // ausgeblendete Formate (IDs)
  fmtPinned: 'mrreal.formats.pinned.v1', // angepinnte Formate (IDs)
};

function read<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, val: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* Storage nicht verfügbar – ignorieren */
  }
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export const ideaStore = {
  extras: () => read<ContentIdea[]>(LS.ideaExtras, []),
  hidden: () => read<string[]>(LS.ideaHidden, []),
  saveExtras: (v: ContentIdea[]) => write(LS.ideaExtras, v),
  saveHidden: (v: string[]) => write(LS.ideaHidden, v),
};

export const formatStore = {
  extras: () => read<SignatureFormat[]>(LS.fmtExtras, []),
  hidden: () => read<string[]>(LS.fmtHidden, []),
  pinned: () => read<string[]>(LS.fmtPinned, []),
  saveExtras: (v: SignatureFormat[]) => write(LS.fmtExtras, v),
  saveHidden: (v: string[]) => write(LS.fmtHidden, v),
  savePinned: (v: string[]) => write(LS.fmtPinned, v),
};

// -----------------------------------------------------------------------------
// Kreativ-Generatoren (client-seitig, ohne API → funktioniert überall/offline).
// Kombinieren Wien-spezifische Themen, Bezirke & Städte zu frischen Aufhängern.
// -----------------------------------------------------------------------------
const BEZIRKE = ['Hietzing', 'Favoriten', 'Leopoldstadt', 'Döbling', 'Neubau', 'Floridsdorf', 'Landstraße', 'Ottakring', 'Wieden'];
const CITIES = ['Berlin', 'München', 'Dubai', 'Mailand', 'Zürich', 'Prag', 'Lissabon', 'Barcelona'];
const RE_TOPICS = ['Vorsorgewohnung', 'Altbau', 'Neubau', 'Erstwohnung', 'Anlegerwohnung', 'Dachgeschoss', 'Sanierungsobjekt', 'Genossenschaftswohnung'];
const MONEY_TOPICS = ['Eigenkapital', 'Zinsen', 'Nebenkosten', 'Kreditrate', 'Maklerprovision', 'Grundbucheintrag', 'Wertsteigerung', 'Mietrendite'];
const rnd = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const RENTS = [800, 1000, 1200, 1500, 1800];
const SUMS = [300000, 400000, 500000, 650000];

// ---- Ideen-Generator --------------------------------------------------------
type IdeaSpec = { format: ContentFormatId; title: string; hook: string; angle: string; platforms: Platform[]; potential: ContentIdea['potential'] };

const IDEA_BUILDERS: (() => IdeaSpec)[] = [
  () => {
    const b = rnd(BEZIRKE);
    return { format: 'property-breakdown', title: `Preis-Reveal: Wohnung in ${b}`, hook: `Rate mit: Was kostet diese Wohnung in ${b}?`, angle: 'Quiz-Reveal, Kommentar-Bait – Preis erst am Ende zeigen.', platforms: ['instagram', 'tiktok'], potential: 'viral' };
  },
  () => {
    const c = rnd(CITIES); const s = rnd(SUMS);
    return { format: 'property-breakdown', title: `Wien vs. ${c} für ${s.toLocaleString('de-AT')} €`, hook: `Das bekommst du für ${s.toLocaleString('de-AT')} € in Wien – und das in ${c}.`, angle: 'Kontrast-Schock, extrem teilbar.', platforms: ['instagram', 'tiktok'], potential: 'viral' };
  },
  () => {
    const t = rnd(MONEY_TOPICS);
    return { format: 'hot-take', title: `Unpopuläre Meinung: ${t}`, hook: `Unpopuläre Meinung: ${t} wird in Wien komplett falsch verstanden.`, angle: 'Polarisierende These → Kommentare & Reichweite.', platforms: ['tiktok', 'instagram'], potential: 'high' };
  },
  () => {
    const t = rnd(RE_TOPICS);
    return { format: 'myth-buster', title: `Mythos-Check: ${t}`, hook: `3 Mythen über ${t}, die dich in Wien Geld kosten.`, angle: 'Aufklärung + Nutzwert → Speicher-/Share-Bait.', platforms: ['tiktok', 'instagram', 'youtube'], potential: 'high' };
  },
  () => {
    const r = rnd(RENTS);
    return { format: 'explainer', title: `${r} € Miete → so viel Eigentum`, hook: `Du zahlst ${r} € Miete? So viel Wohnung bekommst du dafür in Wien.`, angle: 'Persönliche Rechnung, hoher Betroffenheitsfaktor.', platforms: ['instagram', 'tiktok', 'youtube'], potential: 'high' };
  },
  () => ({ format: 'story', title: 'Storytime: der Deal, den keiner glaubt', hook: rnd(['Dieser Kunde hat mir am Telefon aufgelegt – und 3 Tage später gekauft.', 'Die Wohnung war 6 Monate am Markt. Was ich geändert habe, war winzig.', 'Zwei Interessenten, eine Wohnung, 30 Sekunden Zeit. So lief es aus.']), angle: 'Cliffhanger-Storytelling → Personenmarke.', platforms: ['tiktok', 'instagram', 'youtube'], potential: 'high' }),
  () => ({ format: 'behind-the-scenes', title: 'Ein Tag als Makler in Wien', hook: 'POV: 6 Besichtigungen, 3 Grätzl, 1 Tag. Komm mit.', angle: 'Vlog-Nähe → Sympathie & Follows.', platforms: ['instagram', 'tiktok'], potential: 'medium' }),
  () => {
    const b = rnd(BEZIRKE);
    return { format: 'market-update', title: `Grätzl-Update: ${b}`, hook: `Was ${b} gerade für Käufer so spannend macht (Zahlen).`, angle: 'Lokaler Markt-Insight → Autorität.', platforms: ['instagram', 'youtube'], potential: 'medium' };
  },
];

export function generateIdeas(n = 3): ContentIdea[] {
  const out: ContentIdea[] = [];
  for (let i = 0; i < n; i++) {
    const s = rnd(IDEA_BUILDERS)();
    out.push({
      id: newId('idea'),
      title: s.title,
      hook: s.hook,
      format: s.format,
      angle: s.angle,
      rationale: `Frisch generiert für Wien · ${s.angle} Fokus: Reichweite & Follower.`,
      effort: 'low',
      potential: s.potential,
      suggestedPlatforms: s.platforms,
    });
  }
  return out;
}

// ---- Format-Generator -------------------------------------------------------
type FmtSpec = Omit<SignatureFormat, 'id'>;

const FORMAT_BUILDERS: (() => FmtSpec)[] = [
  () => {
    const b = rnd(BEZIRKE);
    return {
      emoji: '🎯', name: `Preis-Battle: ${b} vs. deine Schätzung`, hook: `Diese Wohnung in ${b} – wie nah liegst du am Preis?`, format: 'property-breakdown',
      entertain: 'Quiz + Reveal in einem Take – hält bis zum Ende, triggert Kommentare.',
      followTrigger: 'Serienlogik: „nächster Bezirk morgen“ → Zuschauer-Gewohnheit.', howTo: 'Kurzer Handy-Rundgang, Preis am Ende einblenden.',
      effort: 'low', potential: 'viral', series: true, platforms: ['instagram', 'tiktok'],
    };
  },
  () => {
    const c = rnd(CITIES); const s = rnd(SUMS);
    return {
      emoji: '🌍', name: `${s.toLocaleString('de-AT')} € – Wien vs. ${c}`, hook: `So wohnst du für ${s.toLocaleString('de-AT')} € in Wien – und so in ${c}.`, format: 'property-breakdown',
      entertain: 'Internationaler Kontrast-Schock, sofort verständlich, super teilbar.',
      followTrigger: '„Mach [Stadt]!“ liefert endlos Fortsetzungen → Abos.', howTo: 'Wiener Objekt + internationales Referenzbild, Splitscreen, Text-Overlay.',
      effort: 'low', potential: 'viral', series: true, platforms: ['instagram', 'tiktok'],
    };
  },
  () => {
    const t = rnd(RE_TOPICS);
    return {
      emoji: '🧠', name: `${t}: lohnt sich das in Wien?`, hook: `Jeder redet über ${t} – aber lohnt es sich in Wien wirklich?`, format: 'explainer',
      entertain: 'Klare Antwort auf eine echte Frage – hoher Nutzwert, wird gespeichert.',
      followTrigger: 'Nutzwert-Serie zu Wiener Objekt-Typen → wiederkehrende Zuschauer.', howTo: 'Talking-Head + On-Screen-Rechnung an einem Beispiel.',
      effort: 'low', potential: 'high', series: true, platforms: ['tiktok', 'instagram', 'youtube'],
    };
  },
  () => {
    const t = rnd(MONEY_TOPICS);
    return {
      emoji: '🔥', name: `Hot Take: ${t}`, hook: `Unpopuläre Wahrheit über ${t}, die kein Makler laut sagt.`, format: 'hot-take',
      entertain: 'Provokante These → Kommentare (Zustimmung/Widerspruch) = Reichweite.',
      followTrigger: 'Meinungsstärke macht dich zitierbar & abonnierbar.', howTo: 'Talking-Head, ein Take, These als Text-Overlay.',
      effort: 'low', potential: 'viral', series: true, platforms: ['tiktok', 'instagram'],
    };
  },
  () => ({
    emoji: '🚩', name: 'Green Flags einer Top-Wohnung', hook: 'Diese 3 Green Flags zeigen: DIESE Wohnung ist ein Kauf.', format: 'explainer',
    entertain: 'Schnelles, positives Urteil pro Merkmal – rewatchbar, lehrreich.',
    followTrigger: 'Praktischer Mini-Guide → gespeichert & geteilt.', howTo: 'Rundgang, pro Merkmal ✅ + ein Satz, ein Take.',
    effort: 'low', potential: 'high', series: true, platforms: ['tiktok', 'instagram', 'youtube'],
  }),
  () => ({
    emoji: '🎬', name: 'Storytime: Wiener Immobilien-Wahnsinn', hook: rnd(['Dieser Deal hätte fast am letzten Tag geplatzt …', 'Ein Käufer, drei Wohnungen, eine unmögliche Entscheidung.']), format: 'story',
    entertain: 'Cliffhanger-Story – hält länger als jedes Zahlen-Reel.',
    followTrigger: 'Persönlichkeit = Follow-Grund Nr. 1.', howTo: 'Nur du, starker erster Satz, ein Take.',
    effort: 'low', potential: 'high', series: true, platforms: ['tiktok', 'instagram', 'youtube'],
  }),
];

export function generateFormat(): SignatureFormat {
  return { id: newId('fmt'), ...rnd(FORMAT_BUILDERS)() };
}

// Wandelt eine Idee in ein Format (beim „In Formate übernehmen"-Pin).
export function ideaToFormat(idea: ContentIdea): SignatureFormat {
  return {
    id: newId('fmt'),
    emoji: '📌',
    name: idea.title,
    hook: idea.hook,
    format: idea.format,
    entertain: idea.angle,
    followTrigger: idea.rationale,
    howTo: 'Aus der Ideen-Inbox übernommen – als wiederkehrendes Format testen (Handy, wenig Aufwand).',
    effort: idea.effort === 'high' ? 'medium' : idea.effort,
    potential: idea.potential === 'medium' ? 'high' : idea.potential,
    series: false,
    platforms: idea.suggestedPlatforms,
  };
}

// Wandelt ein Format in eine Idee (für den Skript-Generator).
export function formatToIdea(f: SignatureFormat): ContentIdea {
  return {
    id: `fmt-idea-${f.id}`,
    title: f.name,
    hook: f.hook,
    format: f.format,
    angle: f.entertain,
    rationale: `${f.followTrigger} · Umsetzung: ${f.howTo}`,
    effort: f.effort,
    potential: f.potential,
    suggestedPlatforms: f.platforms,
  };
}
