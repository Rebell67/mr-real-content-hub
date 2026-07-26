import type { NewsItem } from '../types';
import { SEED_NEWS } from '../data/news';

export type NewsSource = 'live' | 'demo';

export interface NewsResult {
  items: NewsItem[];
  source: NewsSource;
  note?: string;
}

// Holt tagesaktuelle News: zuerst der Live-Endpoint (/api/news, kostenlos über
// News-Feeds), sonst die Demo-News. So funktioniert die Rubrik überall.
export async function requestNews(): Promise<NewsResult> {
  try {
    const res = await fetch('/api/news');
    if (res.ok) {
      const data = (await res.json()) as { source: string; items: NewsItem[] };
      if (Array.isArray(data?.items) && data.items.length) {
        return { source: 'live', items: data.items };
      }
    }
    // 404 (Offline-Datei) / 502 (Feeds nicht erreichbar) → Demo.
  } catch {
    /* offline / kein Backend – Demo nutzen */
  }
  return {
    items: SEED_NEWS,
    source: 'demo',
    note: 'Demo-News (Muster). Für echte, tagesaktuelle Meldungen die gehostete Version nutzen – der News-Abruf ist kostenlos (RSS), kein bezahlter Zugang nötig.',
  };
}
