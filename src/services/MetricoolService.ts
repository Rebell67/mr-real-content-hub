import type { DailyMetric, HubData, Platform } from '../types';
import { PLATFORMS } from '../types';
import { generateHubData } from '../data/mockData';
import type { DataService } from './DataService';

export interface MetricoolConfig {
  apiToken: string;
  userId: string;
  blogId: string; // Metricool "brand" id
  baseUrl?: string;
}

// Metricool network identifiers for our platforms.
const NETWORK: Record<Platform, string> = {
  instagram: 'instagram',
  tiktok: 'tiktok',
  youtube: 'youtube',
  facebook: 'facebook',
};

// Metric keys we request per network. If Metricool uses different names for a
// given plan/network, adjust them here – nothing else needs to change.
const METRICS = ['followers', 'impressions', 'reach', 'engagement', 'profileViews'] as const;
type MetricKey = (typeof METRICS)[number];

// ---------------------------------------------------------------------------
// Metricool integration.
//
// Preferred path: same-origin proxy (/api/metricool, see api/metricool.js) –
// the token stays on the server. Fallback: direct call with the client-side
// config from the settings page (may be blocked by CORS depending on plan).
// If neither works, the caller (HubContext) falls back to demo data and shows
// an error state – the app never breaks.
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
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 120);

    const dailyMetrics: DailyMetric[] = [];
    const failures: string[] = [];

    for (const platform of PLATFORMS) {
      try {
        const rows = await this.fetchNetworkTimeline(platform, from, to);
        dailyMetrics.push(...rows);
      } catch (e) {
        failures.push(`${platform}: ${(e as Error).message}`);
      }
    }

    if (dailyMetrics.length === 0) {
      throw new Error(
        `Keine Metricool-Daten abrufbar. ${failures[0] ?? 'Proxy nicht erreichbar und kein gültiger Token hinterlegt.'}`,
      );
    }

    // Posts/goals/posting windows are managed in-app; only the account metrics
    // come live from Metricool. Reuse the demo scaffold for the rest.
    const scaffold = generateHubData();
    return {
      generatedAt: new Date().toISOString(),
      dailyMetrics,
      posts: scaffold.posts,
      goals: scaffold.goals,
      postingWindows: scaffold.postingWindows,
    };
  }

  private async fetchNetworkTimeline(platform: Platform, from: Date, to: Date): Promise<DailyMetric[]> {
    const byMetric = new Map<MetricKey, Map<string, number>>();

    for (const metric of METRICS) {
      const params = new URLSearchParams({
        network: NETWORK[platform],
        metric,
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
      });
      const json = await this.request('v2/analytics/timelines', params);
      byMetric.set(metric, parseTimeline(json));
    }

    const followers = byMetric.get('followers') ?? new Map();
    const dates = [...new Set([...byMetric.values()].flatMap((m) => [...m.keys()]))].sort();

    let prevFollowers: number | null = null;
    return dates.map((date) => {
      const f = followers.get(date) ?? prevFollowers ?? 0;
      const change = prevFollowers == null ? 0 : f - prevFollowers;
      prevFollowers = f;
      return {
        date,
        platform,
        followers: f,
        followerChange: change,
        impressions: byMetric.get('impressions')?.get(date) ?? 0,
        reach: byMetric.get('reach')?.get(date) ?? 0,
        profileViews: byMetric.get('profileViews')?.get(date) ?? 0,
        engagements: byMetric.get('engagement')?.get(date) ?? 0,
      };
    });
  }

  /** Try the same-origin proxy first, then a direct call with the local config. */
  private async request(path: string, params: URLSearchParams): Promise<unknown> {
    // 1) Server proxy (production path – token lives in Vercel env vars).
    try {
      const res = await fetch(`/api/metricool?path=${encodeURIComponent(path)}&${params}`);
      if (res.ok) return await res.json();
      if (res.status !== 404 && res.status !== 503) {
        throw new Error(`Proxy-Fehler ${res.status}`);
      }
    } catch {
      /* proxy not available – try direct */
    }

    // 2) Direct call with client-side credentials (settings page).
    if (!this.isConfigured()) {
      throw new Error('Kein Proxy verfügbar und kein Token in den Einstellungen hinterlegt.');
    }
    const base = this.config!.baseUrl ?? 'https://app.metricool.com/api';
    const url = new URL(`${base}/${path}`);
    params.forEach((v, k) => url.searchParams.set(k, v));
    url.searchParams.set('blogId', this.config!.blogId);
    url.searchParams.set('userId', this.config!.userId);
    url.searchParams.set('userToken', this.config!.apiToken);
    const res = await fetch(url, { headers: { 'X-Mc-Auth': this.config!.apiToken } });
    if (!res.ok) throw new Error(`Metricool antwortet mit ${res.status}`);
    return await res.json();
  }
}

// ---------------------------------------------------------------------------
// Defensive parsing – Metricool timeline payloads come in a few shapes
// depending on endpoint version. Everything is normalised to date -> value.
// ---------------------------------------------------------------------------
type Loose = Record<string, unknown>;

function parseTimeline(json: unknown): Map<string, number> {
  const out = new Map<string, number>();
  const push = (dateRaw: unknown, valueRaw: unknown) => {
    const date = toIsoDate(dateRaw);
    const value = Number(valueRaw);
    if (date && Number.isFinite(value)) out.set(date, value);
  };

  const rows = extractRows(json);
  for (const row of rows) {
    if (Array.isArray(row) && row.length >= 2) {
      push(row[0], row[1]);
    } else if (row && typeof row === 'object') {
      const r = row as Loose;
      push(r.date ?? r.dateTime ?? r.day ?? r.timestamp, r.value ?? r.count ?? r.total);
    }
  }
  return out;
}

function extractRows(json: unknown): unknown[] {
  if (Array.isArray(json)) return json;
  if (json && typeof json === 'object') {
    const j = json as Loose;
    for (const key of ['data', 'values', 'timeline', 'result']) {
      if (Array.isArray(j[key])) return j[key] as unknown[];
    }
  }
  return [];
}

function toIsoDate(raw: unknown): string | null {
  if (typeof raw === 'number') {
    const d = new Date(raw > 1e12 ? raw : raw * 1000);
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }
  if (typeof raw === 'string') {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }
  return null;
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
