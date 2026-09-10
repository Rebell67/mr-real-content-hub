import type { Trend } from '../types';
import trendsData from '../data/trends.json';
import { SEED_TRENDS } from '../data/trends';

// Wird beim Live-Abruf (scripts/refresh-trends.mjs) automatisch aktualisiert.
export const TRENDS_UPDATED = '10.09.2026';

export type TrendSource = 'live' | 'demo';

export interface TrendResult {
  trends: Trend[];
  source: TrendSource;
  note?: string;
}

// Nutzt echte, via Apify gezogene Instagram-Outlier (src/data/trends.json);
// fällt auf Demo-Muster zurück, falls (noch) keine Live-Daten vorliegen.
export async function requestTrends(): Promise<TrendResult> {
  const live = trendsData as unknown as Trend[];
  if (Array.isArray(live) && live.length) {
    return {
      trends: live,
      source: 'live',
      note: `Echte virale Instagram-Reels aus deiner Nische (Immobilien/Finanzen, DE + EN) – Ausreißer per Apify erkannt, zuletzt aktualisiert am ${TRENDS_UPDATED}.`,
    };
  }
  return {
    trends: SEED_TRENDS,
    source: 'demo',
    note: 'Demo-Trends (Muster aus deiner Nische). Für echte Live-Ausreißer eine Trend-Quelle verbinden – siehe Daten & Setup.',
  };
}
