import type { NewsCategory, RelevanceSubs } from '../types';

// ---------------------------------------------------------------------------
// Relevanz-Faktor: aus fünf transparenten Teil-Werten wird ein Gesamt-Score
// (0–100) plus ein klares Urteil abgeleitet. Emotion & Betroffenheit wiegen
// am schwersten – das treibt Reichweite auf Social Media am stärksten.
// ---------------------------------------------------------------------------

export const SUB_META: Array<{ key: keyof RelevanceSubs; label: string; hint: string; color: string }> = [
  { key: 'emotion', label: 'Emotion / Reichweite', hint: 'Polarisiert, überrascht oder macht betroffen', color: '#FF5A5A' },
  { key: 'betroffenheit', label: 'Betroffenheit', hint: 'Trifft den Geldbeutel deiner Zuschauer', color: '#F7C14B' },
  { key: 'naehe', label: 'Immo-/Finanz-Nähe', hint: 'Wie direkt es dein Kernthema trifft', color: '#12D99A' },
  { key: 'hook', label: 'Hook-Potenzial', hint: 'Wie leicht ein starker Aufhänger entsteht', color: '#22D3EE' },
  { key: 'aktualitaet', label: 'Aktualität', hint: 'Wie frisch & zeitkritisch die Meldung ist', color: '#5B8DEF' },
];

const WEIGHTS: Record<keyof RelevanceSubs, number> = {
  emotion: 0.28,
  betroffenheit: 0.24,
  naehe: 0.22,
  hook: 0.16,
  aktualitaet: 0.1,
};

export function computeRelevance(subs: RelevanceSubs): number {
  const total = (Object.keys(WEIGHTS) as Array<keyof RelevanceSubs>).reduce(
    (sum, k) => sum + (subs[k] ?? 0) * WEIGHTS[k],
    0,
  );
  return Math.round(Math.max(0, Math.min(100, total)));
}

export type Verdict = 'sofort' | 'lohnt' | 'wennZeit' | 'skip';

export const VERDICT_META: Record<Verdict, { label: string; emoji: string; color: string }> = {
  sofort: { label: 'Sofort drehen', emoji: '🔥', color: '#FF5A5A' },
  lohnt: { label: 'Lohnt sich', emoji: '✅', color: '#12D99A' },
  wennZeit: { label: 'Wenn Zeit', emoji: '🟡', color: '#F7C14B' },
  skip: { label: 'Überspringen', emoji: '⏭️', color: '#64748B' },
};

export function verdictOf(total: number): Verdict {
  if (total >= 75) return 'sofort';
  if (total >= 60) return 'lohnt';
  if (total >= 45) return 'wennZeit';
  return 'skip';
}

// News verlieren an Wert – eine grobe „Halbwertszeit" nach Kategorie, damit die
// App zeigt, wie dringend eine Meldung ist (Zins-News altern schnell, Trends
// & Gesellschaftsthemen langsamer).
const HALFLIFE_HOURS: Record<NewsCategory, number> = {
  zinsen: 36,
  finanzen: 48,
  wirtschaft: 60,
  politik: 72,
  immobilien: 96,
};

// 0..1 – wie „frisch" die Meldung noch für ein Video ist.
export function freshness(category: NewsCategory, ageHours: number): number {
  const hl = HALFLIFE_HOURS[category] ?? 60;
  return Math.max(0, Math.min(1, Math.pow(0.5, ageHours / hl)));
}

export function agoLabel(hours: number): string {
  if (hours < 1) return 'gerade eben';
  if (hours < 24) return `vor ${Math.round(hours)} Std.`;
  return `vor ${Math.round(hours / 24)} T.`;
}
