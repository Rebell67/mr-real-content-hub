import type { DailyMetric, HubData } from '../types';
import { generateHubData } from '../data/mockData';
import type { DataService } from './DataService';
import realMetrics from '../data/realMetrics.json';

// Real account metrics for the "Mr Real" brand (id 5794101), fetched from
// Metricool via its MCP connector on 2026-07-12 (period 2026-04-13 → 2026-07-11).
// Instagram @mr.r3al · TikTok @mr.r3al_ · YouTube · Facebook.
//
// Posts, formats and posting windows still come from the demo scaffold – they
// are planning tools; only the account-level numbers are real.
export class RealDataService implements DataService {
  readonly id = 'real';
  readonly label = 'Mr Real Live-Snapshot';

  isConfigured(): boolean {
    return true;
  }

  async fetchHubData(): Promise<HubData> {
    const scaffold = generateHubData();
    const metrics = realMetrics as DailyMetric[];

    // Goal baselines derived from the real snapshot period.
    const firstDate = metrics.reduce((min, m) => (m.date < min ? m.date : min), metrics[0].date);
    const startTotal = metrics.filter((m) => m.date === firstDate).reduce((s, m) => s + m.followers, 0);

    return {
      generatedAt: new Date().toISOString(),
      dailyMetrics: metrics,
      posts: scaffold.posts,
      postingWindows: scaffold.postingWindows,
      goals: [
        {
          id: 'goal-followers',
          label: '20.000 Follower bis Jahresende',
          metric: 'followers',
          target: 20000,
          deadline: '2026-12-31',
          startValue: startTotal,
          startDate: firstDate,
        },
        {
          id: 'goal-impressions',
          label: '500k–1 Mio. Impressionen / Monat',
          metric: 'impressions',
          target: 750000,
          deadline: '2026-12-31',
          startValue: 0,
          startDate: firstDate,
        },
      ],
    };
  }
}
