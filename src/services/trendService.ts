import type { Trend } from '../types';
import { SEED_TRENDS } from '../data/trends';

export type TrendSource = 'live' | 'demo';

export interface TrendResult {
  trends: Trend[];
  source: TrendSource;
  note?: string;
}

// Holt aktuelle Outlier-Trends: zuerst der Live-Anbieter (/api/trends), sonst
// die kuratierten Demo-Trends. So funktioniert das Feld überall – live in der
// gehosteten App mit Trend-Quelle, als Muster in der Einzeldatei.
export async function requestTrends(): Promise<TrendResult> {
  try {
    const res = await fetch('/api/trends');
    if (res.ok) {
      const data = (await res.json()) as { source: string; trends: Trend[] };
      if (Array.isArray(data?.trends) && data.trends.length) {
        return { source: 'live', trends: data.trends };
      }
    }
    // 503 (nicht konfiguriert) / 404 (Offline) → Demo-Trends.
  } catch {
    /* offline / kein Backend – Demo nutzen */
  }
  return {
    trends: SEED_TRENDS,
    source: 'demo',
    note: 'Demo-Trends (Muster aus deiner Nische). Für echte Live-Ausreißer eine Trend-Quelle verbinden – siehe Daten & Setup.',
  };
}
