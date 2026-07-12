import type { DailyMetric, HubData, Platform } from '../types';
import { generateHubData } from '../data/mockData';
import type { DataService } from './DataService';

export interface MetricoolConfig {
  apiToken: string;
  userId: string;
  blogId: string; // Metricool "brand" id
  baseUrl?: string;
}

// ---------------------------------------------------------------------------
// Metricool integration stub.
//
// Metricool exposes an API (https://app.metricool.com/api) that returns
// per-network analytics. Because the token isn't wired up yet, `fetchHubData`
// falls back to demo data but the request/normalisation shape is fully mapped
// out below so switching to live data is a small, contained change.
// ---------------------------------------------------------------------------
export class MetricoolService implements DataService {
  readonly id = 'metricool';
  readonly label = 'Metricool';
  private config: MetricoolConfig | null;

  constructor(config: MetricoolConfig | null) {
    this.config = config;
  }

  isConfigured(): boolean {
    return Boolean(this.config?.apiToken && this.config?.blogId);
  }

  async fetchHubData(): Promise<HubData> {
    if (!this.isConfigured()) {
      // Not wired up yet – return demo data so the UI still works.
      return generateHubData();
    }

    // ---- LIVE PATH (ready to enable once a token is available) ----------
    // The Metricool API returns time-series per network. The real call would
    // look roughly like this per platform:
    //
    //   GET {baseUrl}/v2/analytics/timelines
    //       ?userToken={apiToken}&userId={userId}&blogId={blogId}
    //       &network={network}&metric=followers,impressions,reach,engagement
    //       &from={from}&to={to}
    //
    // Each network's response is normalised via `normalizeMetricoolTimeline`.
    throw new Error(
      'Metricool live-Abruf ist vorbereitet, aber noch nicht aktiviert. Token in den Einstellungen hinterlegen.',
    );
  }
}

// Maps a raw Metricool timeline payload to our normalised DailyMetric[].
// Exposed so it can be unit-tested independently of the network layer.
export function normalizeMetricoolTimeline(
  platform: Platform,
  raw: Array<{
    date: string;
    followers?: number;
    impressions?: number;
    reach?: number;
    engagement?: number;
    profileViews?: number;
  }>,
): DailyMetric[] {
  const sorted = [...raw].sort((a, b) => a.date.localeCompare(b.date));
  let prevFollowers = sorted[0]?.followers ?? 0;
  return sorted.map((row) => {
    const followers = row.followers ?? prevFollowers;
    const followerChange = followers - prevFollowers;
    prevFollowers = followers;
    return {
      date: row.date.slice(0, 10),
      platform,
      followers,
      followerChange,
      impressions: row.impressions ?? 0,
      reach: row.reach ?? 0,
      profileViews: row.profileViews ?? 0,
      engagements: row.engagement ?? 0,
    };
  });
}
