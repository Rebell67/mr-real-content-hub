import { PLATFORMS, type DailyMetric, type Goal, type HubData, type Platform, type Post, type PostingWindow, type ContentFormatId } from '../types';

// ---------------------------------------------------------------------------
// Deterministic pseudo-random generator so the demo data is stable across
// reloads (important for a dashboard – numbers shouldn't jitter every render).
// ---------------------------------------------------------------------------
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20261231);

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysAgo(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() - n);
  return d;
}

// "Today" for the demo dataset.
const TODAY = new Date('2026-07-12T00:00:00Z');
const HISTORY_DAYS = 120;

// Per-platform baseline & growth characteristics.
const PLATFORM_PROFILE: Record<
  Platform,
  { startFollowers: number; dailyGrowth: number; volatility: number; imprPerFollower: number; engRate: number }
> = {
  // Tuned so the account is credibly *mid-journey*: ~11k followers now on a
  // trajectory that lands just short of 20k, and ~550k monthly impressions –
  // inside the 500k–1M target band but with clear room to grow toward 1M.
  instagram: { startFollowers: 2500, dailyGrowth: 11, volatility: 0.5, imprPerFollower: 1.1, engRate: 0.055 },
  tiktok: { startFollowers: 1400, dailyGrowth: 12, volatility: 1.0, imprPerFollower: 1.7, engRate: 0.07 },
  youtube: { startFollowers: 800, dailyGrowth: 4, volatility: 0.7, imprPerFollower: 1.2, engRate: 0.045 },
  facebook: { startFollowers: 1150, dailyGrowth: 3, volatility: 0.4, imprPerFollower: 0.6, engRate: 0.03 },
};

function generateDailyMetrics(): DailyMetric[] {
  const rows: DailyMetric[] = [];

  for (const platform of PLATFORMS) {
    const p = PLATFORM_PROFILE[platform];
    let followers = p.startFollowers;

    for (let i = HISTORY_DAYS; i >= 0; i--) {
      const date = daysAgo(TODAY, i);
      const dow = date.getUTCDay(); // 0 Sun .. 6 Sat

      // Growth accelerates slightly over time (creator improving) + weekly rhythm.
      const rampFactor = 1 + (HISTORY_DAYS - i) / HISTORY_DAYS * 0.6;
      const weekendBoost = dow === 0 || dow === 6 ? 1.15 : 1;
      const noise = 1 + (rand() - 0.5) * p.volatility;

      const followerChange = Math.max(
        -5,
        Math.round(p.dailyGrowth * rampFactor * weekendBoost * noise),
      );
      followers += followerChange;

      const postedToday = rand() > 0.45; // roughly 4-5 posts/week
      const contentMultiplier = postedToday ? 1 + rand() * 1.6 : 0.35 + rand() * 0.25;

      const impressions = Math.round(followers * p.imprPerFollower * contentMultiplier * (0.85 + rand() * 0.4));
      const reach = Math.round(impressions * (0.62 + rand() * 0.12));
      const engagements = Math.round(impressions * p.engRate * (0.8 + rand() * 0.5));
      const profileViews = Math.round(reach * (0.02 + rand() * 0.02));

      rows.push({
        date: isoDate(date),
        platform,
        followers,
        followerChange,
        impressions,
        reach,
        profileViews,
        engagements,
      });
    }
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Posts – a mix of published (with performance) and pipeline items.
// The first four are based on Mr Real's real drafts.
// ---------------------------------------------------------------------------
interface SeedPost {
  title: string;
  hook: string;
  format: ContentFormatId;
  platforms: Platform[];
  daysAgo: number; // relative to TODAY; negative = future/planned
  status: Post['status'];
  reachBias: number; // 0.5 flop .. 2.0 banger
  tags: string[];
  notes?: string;
}

const SEED_POSTS: SeedPost[] = [
  {
    title: '50.000 gespart – reicht das?',
    hook: 'Du hast 50.000 € gespart und denkst, du kannst kaufen? Lass uns ehrlich rechnen.',
    format: 'explainer',
    platforms: ['instagram', 'tiktok', 'youtube'],
    daysAgo: 5,
    status: 'published',
    reachBias: 1.9,
    tags: ['finanzierung', 'eigenkapital', 'kaufen'],
    notes: 'Bester Post des Monats. Rechen-Beispiele kommen extrem gut an → Serie draus machen.',
  },
  {
    title: 'Wohnen zur Miete, kaufen als Investment',
    hook: 'Der Trick der Reichen: Sie mieten, wo sie leben – und kaufen, wo es Rendite gibt.',
    format: 'hot-take',
    platforms: ['instagram', 'tiktok'],
    daysAgo: 12,
    status: 'published',
    reachBias: 1.5,
    tags: ['investment', 'strategie', 'mieten-vs-kaufen'],
  },
  {
    title: 'Du schaufelst dir dein eigenes Grab',
    hook: 'Wer mit 30 noch keinen Plan für Eigentum hat, gräbt sich finanziell sein eigenes Grab.',
    format: 'hot-take',
    platforms: ['tiktok', 'instagram'],
    daysAgo: 20,
    status: 'published',
    reachBias: 1.7,
    tags: ['meinung', 'altersvorsorge', 'wachstum'],
    notes: 'Polarisiert stark, viele Kommentare – Hook-Formel "Du + drastische Konsequenz" funktioniert.',
  },
  {
    title: 'Ohne Erbe keine Immobilie – die Ausrede',
    hook: '"Ich erbe ja nichts" – die teuerste Ausrede deines Lebens. Hier ist der Gegenbeweis.',
    format: 'myth-buster',
    platforms: ['instagram', 'tiktok', 'youtube'],
    daysAgo: 28,
    status: 'published',
    reachBias: 1.4,
    tags: ['mythos', 'eigenkapital', 'mindset'],
  },
  {
    title: 'Was 400.000 € in Wien vs. Graz kaufen',
    hook: 'Gleiges Geld, zwei Städte – der Unterschied wird dich schockieren.',
    format: 'property-breakdown',
    platforms: ['instagram', 'youtube'],
    daysAgo: 8,
    status: 'published',
    reachBias: 1.2,
    tags: ['wien', 'graz', 'preisvergleich'],
  },
  {
    title: 'Nebenkosten beim Kauf – die versteckten 10%',
    hook: 'Der Kaufpreis ist nur der Anfang. Diese 10% übersehen fast alle.',
    format: 'explainer',
    platforms: ['instagram', 'tiktok'],
    daysAgo: 15,
    status: 'published',
    reachBias: 1.1,
    tags: ['nebenkosten', 'kaufen', 'grunderwerbsteuer'],
  },
  {
    title: 'Warum Zinsen NICHT dein Feind sind',
    hook: 'Alle jammern über Zinsen. Die Klugen nutzen sie gerade jetzt.',
    format: 'market-update',
    platforms: ['instagram', 'tiktok', 'youtube'],
    daysAgo: 3,
    status: 'published',
    reachBias: 1.3,
    tags: ['zinsen', 'markt', 'finanzierung'],
  },
  {
    title: 'Mein schlimmster Besichtigungs-Fail',
    hook: 'Ich habe einen Deal über 30.000 € an einem Satz platzen lassen.',
    format: 'story',
    platforms: ['instagram', 'tiktok'],
    daysAgo: 22,
    status: 'published',
    reachBias: 0.9,
    tags: ['story', 'makleralltag', 'learnings'],
  },
  {
    title: 'Besichtigung: So erkennst du Feuchtigkeit',
    hook: 'Bevor du kaufst: Diese 3 Stellen entlarven jeden Schimmel-Deckversuch.',
    format: 'behind-the-scenes',
    platforms: ['tiktok', 'youtube'],
    daysAgo: 18,
    status: 'published',
    reachBias: 1.0,
    tags: ['besichtigung', 'tipps', 'bausubstanz'],
  },
  {
    title: 'Ist Vorsorgewohnung noch sinnvoll 2026?',
    hook: 'Der Klassiker der Anlage – aber lohnt er sich heute noch?',
    format: 'market-update',
    platforms: ['instagram', 'youtube'],
    daysAgo: 35,
    status: 'published',
    reachBias: 0.8,
    tags: ['vorsorgewohnung', 'investment', '2026'],
  },
  // --- Pipeline / planned ---
  {
    title: 'Die 3 Lügen der Immobilien-Inserate',
    hook: '"Ruhige Lage", "renovierungsbedürftig", "Anfragen erbeten" – was das WIRKLICH heißt.',
    format: 'myth-buster',
    platforms: ['instagram', 'tiktok'],
    daysAgo: -2,
    status: 'scheduled',
    reachBias: 0,
    tags: ['inserate', 'entlarvung', 'kaufen'],
  },
  {
    title: 'Miete vs. Kauf – der 250.000-€-Vergleich',
    hook: '20 Jahre mieten oder kaufen? Ich rechne es dir gnadenlos vor.',
    format: 'explainer',
    platforms: ['instagram', 'tiktok', 'youtube'],
    daysAgo: -4,
    status: 'editing',
    reachBias: 0,
    tags: ['mieten-vs-kaufen', 'rechnung', 'serie'],
    notes: 'Teil 2 der Rechen-Serie nach "50.000 gespart".',
  },
  {
    title: 'Erste Wohnung mit 25 – realistischer Plan',
    hook: 'Kein Erbe, Durchschnittsgehalt – so kommst du trotzdem an Eigentum.',
    format: 'story',
    platforms: ['instagram', 'tiktok'],
    daysAgo: -6,
    status: 'scripting',
    reachBias: 0,
    tags: ['einsteiger', 'plan', 'mindset'],
  },
  {
    title: 'Hot Take: Makler sind überflüssig?',
    hook: '"Wozu noch Makler?" – meine ehrliche, unbequeme Antwort.',
    format: 'hot-take',
    platforms: ['tiktok', 'instagram'],
    daysAgo: -8,
    status: 'idea',
    reachBias: 0,
    tags: ['meinung', 'branche', 'kontrovers'],
  },
];

function generatePosts(): Post[] {
  return SEED_POSTS.map((s, idx): Post => {
    const date = isoDate(daysAgo(TODAY, s.daysAgo));
    let metrics: Post['metrics'];
    if (s.status === 'published') {
      // Scale performance roughly to a mid-size multi-platform reach.
      const base = 9500 * s.reachBias;
      const impressions = Math.round(base * (0.85 + rand() * 0.4) * s.platforms.length * 0.7);
      const reach = Math.round(impressions * 0.68);
      const eng = impressions * 0.05;
      metrics = {
        impressions,
        reach,
        likes: Math.round(eng * 0.7),
        comments: Math.round(eng * 0.12 * s.reachBias),
        shares: Math.round(eng * 0.1 * s.reachBias),
        saves: Math.round(eng * 0.18 * s.reachBias),
        followsFromPost: Math.round(reach * 0.006 * s.reachBias),
        avgWatchTimeSec: Math.round(12 + rand() * 18),
        completionRate: Math.min(0.85, 0.35 + rand() * 0.4 * s.reachBias),
      };
    }
    return {
      id: `post-${idx + 1}`,
      title: s.title,
      hook: s.hook,
      format: s.format,
      platforms: s.platforms,
      status: s.status,
      date,
      metrics,
      tags: s.tags,
      notes: s.notes,
    };
  });
}

function generateGoals(): Goal[] {
  return [
    {
      id: 'goal-followers',
      label: '20.000 Follower bis Jahresende',
      metric: 'followers',
      target: 20000,
      deadline: '2026-12-31',
      startValue: 5850, // total across platforms at campaign start (120 days ago)
      startDate: '2026-03-14',
    },
    {
      id: 'goal-impressions',
      label: '500k–1 Mio. Impressionen / Monat',
      metric: 'impressions',
      target: 750000, // midpoint of the target band
      deadline: '2026-12-31',
      startValue: 240000,
      startDate: '2026-03-14',
    },
  ];
}

// Best posting windows (relative engagement heatmap), derived per platform.
function generatePostingWindows(): PostingWindow[] {
  const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const peakHours: Record<Platform, number[]> = {
    instagram: [7, 12, 19, 21],
    tiktok: [6, 15, 20, 22],
    youtube: [8, 17, 20],
    facebook: [8, 13, 18],
  };
  const windows: PostingWindow[] = [];
  for (const platform of PLATFORMS) {
    for (let d = 0; d < 7; d++) {
      for (let h = 5; h <= 23; h++) {
        const isPeak = peakHours[platform].some((ph) => Math.abs(ph - h) <= 1);
        const weekendFactor = d >= 5 ? 1.1 : 1;
        const base = isPeak ? 62 + rand() * 30 : 15 + rand() * 30;
        windows.push({
          platform,
          day: days[d],
          hour: h,
          score: Math.min(100, Math.round(base * weekendFactor)),
        });
      }
    }
  }
  return windows;
}

export function generateHubData(): HubData {
  return {
    generatedAt: new Date().toISOString(),
    dailyMetrics: generateDailyMetrics(),
    posts: generatePosts(),
    goals: generateGoals(),
    postingWindows: generatePostingWindows(),
  };
}
