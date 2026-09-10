// ---------------------------------------------------------------------------
// Core domain types for the Mr Real Content Hub.
// These types are platform-agnostic so that data from Metricool, native
// platform exports, or manual CSV/JSON imports can all be normalised into the
// same shape.
// ---------------------------------------------------------------------------

export type Platform = 'instagram' | 'tiktok' | 'youtube' | 'facebook';

export const PLATFORMS: Platform[] = ['instagram', 'tiktok', 'youtube', 'facebook'];

export const PLATFORM_META: Record<
  Platform,
  { label: string; short: string; color: string; handle: string }
> = {
  instagram: { label: 'Instagram', short: 'IG', color: '#E4477E', handle: '@mr.r3al' },
  tiktok: { label: 'TikTok', short: 'TT', color: '#22D3EE', handle: '@mr.r3al' },
  youtube: { label: 'YouTube Shorts', short: 'YT', color: '#FF5A5A', handle: 'Mr Real' },
  facebook: { label: 'Facebook', short: 'FB', color: '#5B8DEF', handle: 'Mr Real' },
};

// A single day of account-level metrics on one platform.
export interface DailyMetric {
  date: string; // ISO yyyy-mm-dd
  platform: Platform;
  followers: number; // cumulative follower count on that day
  followerChange: number; // net new followers that day
  impressions: number;
  reach: number;
  profileViews: number;
  engagements: number; // likes + comments + shares + saves
}

export type ContentFormatId =
  | 'hot-take'
  | 'explainer'
  | 'story'
  | 'market-update'
  | 'myth-buster'
  | 'behind-the-scenes'
  | 'property-breakdown';

export type PostStatus = 'idea' | 'scripting' | 'filming' | 'editing' | 'scheduled' | 'published';

// A single piece of content.
export interface Post {
  id: string;
  title: string;
  hook: string; // the opening line / thumbnail text
  format: ContentFormatId;
  platforms: Platform[];
  status: PostStatus;
  date: string; // ISO date – publish date or planned date
  // Performance (only meaningful once published)
  metrics?: {
    impressions: number;
    reach: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    followsFromPost: number;
    avgWatchTimeSec?: number;
    completionRate?: number; // 0..1
  };
  tags: string[];
  notes?: string;
}

export interface ContentFormat {
  id: ContentFormatId;
  name: string;
  emoji: string;
  description: string;
  purpose: string; // what this format achieves strategically
  cadence: string; // recommended frequency
  color: string;
}

export interface ContentIdea {
  id: string;
  title: string;
  hook: string;
  format: ContentFormatId;
  angle: string;
  rationale: string; // why this could work / which data supports it
  effort: 'low' | 'medium' | 'high';
  potential: 'medium' | 'high' | 'viral';
  suggestedPlatforms: Platform[];
}

export interface Goal {
  id: string;
  label: string;
  metric: 'followers' | 'impressions';
  target: number;
  deadline: string; // ISO date
  startValue: number;
  startDate: string;
}

// A data-derived recommendation / next step.
export interface Recommendation {
  id: string;
  priority: 'critical' | 'high' | 'medium';
  category: 'format' | 'timing' | 'platform' | 'consistency' | 'topic' | 'hook';
  title: string;
  detail: string;
  action: string; // the concrete next step
  impact: string; // expected impact
}

// Best posting windows derived from engagement data.
export interface PostingWindow {
  platform: Platform;
  day: string; // e.g. "Di"
  hour: number; // 0-23
  score: number; // 0..100 relative engagement
}

// A trending / outlier video spotted on Instagram or TikTok.
// "Outlier" = views far above the creator's normal median → a breaking format.
export interface Trend {
  id: string;
  platform: 'instagram' | 'tiktok';
  hook: string; // the on-screen hook / title of the viral clip
  format: string; // human label, e.g. "Rechnung", "Hot Take", "Reaction"
  views: number;
  outlierFactor: number; // views ÷ that account's median (e.g. 8.4)
  creatorHandle: string; // example / anonymised handle
  region: 'AT/DE' | 'International';
  daysAgo: number;
  whyItWorks: string;
  adaptHook: string; // suggested Mr Real hook to ride this trend
  suggestedFormat: ContentFormatId; // maps into the script generator
  url?: string; // link to the original video (when from a live source)
  likes?: number;
  realEstate?: boolean; // true = core real-estate/Makler format (ranks first)
  replicate?: string; // concrete "so drehst du's nach" instruction (low effort)
}

// ---- News / daily relevance ----------------------------------------------
export type NewsCategory = 'immobilien' | 'finanzen' | 'wirtschaft' | 'zinsen' | 'politik';

// The five transparent sub-scores that make up the relevance factor (0-100 each).
export interface RelevanceSubs {
  emotion: number; // polarising / surprising / emotional pull
  betroffenheit: number; // hits the viewer's own money / home
  naehe: number; // closeness to real-estate / finance core
  hook: number; // how easily a strong hook can be built
  aktualitaet: number; // freshness / time-sensitivity
}

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  url?: string;
  publishedAgoHours: number;
  category: NewsCategory;
  region: 'AT' | 'DE' | 'International';
  subs: RelevanceSubs;
  hook: string; // ready Mr Real hook
  angle: string; // why it works / the take
  suggestedFormat: ContentFormatId;
}

// The full snapshot returned by a DataService.
export interface HubData {
  generatedAt: string;
  dailyMetrics: DailyMetric[];
  posts: Post[];
  goals: Goal[];
  postingWindows: PostingWindow[];
}
