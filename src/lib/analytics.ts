import { FORMAT_MAP } from '../data/formats';
import type {
  ContentFormatId,
  DailyMetric,
  Goal,
  HubData,
  Platform,
  Post,
  Recommendation,
} from '../types';
import { PLATFORMS } from '../types';
import { daysBetween } from './format';

// ---------------------------------------------------------------------------
// Aggregations
// ---------------------------------------------------------------------------

export interface CombinedDay {
  date: string;
  followers: number;
  followerChange: number;
  impressions: number;
  reach: number;
  engagements: number;
}

/** Combine all platforms into a single daily total time-series. */
export function combineByDate(metrics: DailyMetric[]): CombinedDay[] {
  const map = new Map<string, CombinedDay>();
  for (const m of metrics) {
    const cur =
      map.get(m.date) ??
      { date: m.date, followers: 0, followerChange: 0, impressions: 0, reach: 0, engagements: 0 };
    cur.followers += m.followers;
    cur.followerChange += m.followerChange;
    cur.impressions += m.impressions;
    cur.reach += m.reach;
    cur.engagements += m.engagements;
    map.set(m.date, cur);
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function latestDate(metrics: DailyMetric[]): string {
  return metrics.reduce((max, m) => (m.date > max ? m.date : max), metrics[0]?.date ?? '');
}

/** Latest cumulative followers + recent change, per platform. */
export interface PlatformSnapshot {
  platform: Platform;
  followers: number;
  followers30dAgo: number;
  growth30d: number;
  impressions30d: number;
  engRate: number;
}

export function platformSnapshots(metrics: DailyMetric[]): PlatformSnapshot[] {
  const last = latestDate(metrics);
  return PLATFORMS.map((platform) => {
    const rows = metrics.filter((m) => m.platform === platform).sort((a, b) => a.date.localeCompare(b.date));
    const latest = rows[rows.length - 1];
    const followers = latest?.followers ?? 0;
    const ref = rows.find((r) => daysBetween(r.date, last) <= 30) ?? rows[0];
    const followers30dAgo = ref?.followers ?? followers;
    const window = rows.filter((r) => daysBetween(r.date, last) <= 30);
    const impressions30d = window.reduce((s, r) => s + r.impressions, 0);
    const eng30d = window.reduce((s, r) => s + r.engagements, 0);
    return {
      platform,
      followers,
      followers30dAgo,
      growth30d: followers - followers30dAgo,
      impressions30d,
      engRate: impressions30d ? eng30d / impressions30d : 0,
    };
  });
}

/** Sum a metric over the last `days` days (from the latest date). */
export function sumWindow(
  metrics: DailyMetric[],
  key: 'impressions' | 'reach' | 'engagements' | 'followerChange',
  days: number,
): number {
  const last = latestDate(metrics);
  return metrics
    .filter((m) => daysBetween(m.date, last) < days)
    .reduce((s, m) => s + m[key], 0);
}

// ---------------------------------------------------------------------------
// Headline KPIs (current period vs previous, same length)
// ---------------------------------------------------------------------------
export interface Kpi {
  key: string;
  label: string;
  value: number;
  previous: number;
  delta: number; // relative change
  format: 'int' | 'pct';
}

export function computeKpis(data: HubData): Kpi[] {
  const { dailyMetrics } = data;
  const last = latestDate(dailyMetrics);
  const totalFollowers = platformSnapshots(dailyMetrics).reduce((s, p) => s + p.followers, 0);
  const followers30Ago = platformSnapshots(dailyMetrics).reduce((s, p) => s + p.followers30dAgo, 0);

  const impr30 = sumWindow(dailyMetrics, 'impressions', 30);
  const impr60_30 = sumWindow(dailyMetrics, 'impressions', 60) - impr30;
  const reach30 = sumWindow(dailyMetrics, 'reach', 30);
  const reach60_30 = sumWindow(dailyMetrics, 'reach', 60) - reach30;
  const eng30 = sumWindow(dailyMetrics, 'engagements', 30);
  const engRate = impr30 ? eng30 / impr30 : 0;
  const engRatePrev = impr60_30 ? (sumWindow(dailyMetrics, 'engagements', 60) - eng30) / impr60_30 : 0;
  const newFollowers30 = sumWindow(dailyMetrics, 'followerChange', 30);
  const newFollowers60_30 = sumWindow(dailyMetrics, 'followerChange', 60) - newFollowers30;

  const rel = (cur: number, prev: number) => (prev ? (cur - prev) / prev : 0);

  void last;
  return [
    {
      key: 'followers',
      label: 'Follower gesamt',
      value: totalFollowers,
      previous: followers30Ago,
      delta: rel(totalFollowers, followers30Ago),
      format: 'int',
    },
    {
      key: 'newFollowers',
      label: 'Neue Follower (30 T.)',
      value: newFollowers30,
      previous: newFollowers60_30,
      delta: rel(newFollowers30, newFollowers60_30),
      format: 'int',
    },
    {
      key: 'impressions',
      label: 'Impressionen (30 T.)',
      value: impr30,
      previous: impr60_30,
      delta: rel(impr30, impr60_30),
      format: 'int',
    },
    {
      key: 'reach',
      label: 'Reichweite (30 T.)',
      value: reach30,
      previous: reach60_30,
      delta: rel(reach30, reach60_30),
      format: 'int',
    },
    {
      key: 'engagement',
      label: 'Engagement-Rate',
      value: engRate,
      previous: engRatePrev,
      delta: rel(engRate, engRatePrev),
      format: 'pct',
    },
  ];
}

// ---------------------------------------------------------------------------
// Goal projection – the heart of "will I hit 20k by Dec 31?"
// ---------------------------------------------------------------------------
export interface GoalProjection {
  goal: Goal;
  current: number;
  daysElapsed: number;
  daysRemaining: number;
  progress: number; // 0..1 of target
  currentDailyPace: number; // recent actual pace
  requiredDailyPace: number; // needed from now to hit target on time
  projectedFinal: number; // if current pace holds
  onTrack: boolean;
  paceGap: number; // requiredDailyPace - currentDailyPace
}

export function projectGoal(goal: Goal, data: HubData): GoalProjection {
  const combined = combineByDate(data.dailyMetrics);
  const last = combined[combined.length - 1];
  const today = last?.date ?? goal.startDate;

  let current: number;
  let currentDailyPace: number;

  if (goal.metric === 'followers') {
    current = last?.followers ?? goal.startValue;
    // pace = avg net new followers/day over last 30 days
    const net30 = sumWindow(data.dailyMetrics, 'followerChange', 30);
    currentDailyPace = net30 / 30;
  } else {
    // impressions goal is monthly – express current as trailing 30d total
    current = sumWindow(data.dailyMetrics, 'impressions', 30);
    const impr30 = current;
    const impr60_30 = sumWindow(data.dailyMetrics, 'impressions', 60) - impr30;
    // pace = month-over-month change in monthly impressions, per day
    currentDailyPace = (impr30 - impr60_30) / 30;
  }

  const daysElapsed = Math.max(1, daysBetween(goal.startDate, today));
  const daysRemaining = Math.max(0, daysBetween(today, goal.deadline));
  const remaining = goal.target - current;
  const requiredDailyPace = daysRemaining > 0 ? remaining / daysRemaining : remaining;
  const projectedFinal = current + currentDailyPace * daysRemaining;

  return {
    goal,
    current,
    daysElapsed,
    daysRemaining,
    progress: Math.min(1.2, current / goal.target),
    currentDailyPace,
    requiredDailyPace,
    projectedFinal,
    onTrack: projectedFinal >= goal.target * 0.98,
    paceGap: requiredDailyPace - currentDailyPace,
  };
}

// ---------------------------------------------------------------------------
// Format performance – which recurring formats actually work
// ---------------------------------------------------------------------------
export interface FormatPerformance {
  format: ContentFormatId;
  name: string;
  emoji: string;
  color: string;
  count: number;
  avgImpressions: number;
  avgEngRate: number;
  avgFollows: number;
  avgSaveRate: number;
}

export function formatPerformance(posts: Post[]): FormatPerformance[] {
  const published = posts.filter((p) => p.status === 'published' && p.metrics);
  const byFormat = new Map<ContentFormatId, Post[]>();
  for (const p of published) {
    byFormat.set(p.format, [...(byFormat.get(p.format) ?? []), p]);
  }
  const result: FormatPerformance[] = [];
  for (const [format, group] of byFormat) {
    const meta = FORMAT_MAP[format];
    const n = group.length;
    const sum = group.reduce(
      (acc, p) => {
        const m = p.metrics!;
        const eng = m.likes + m.comments + m.shares + m.saves;
        acc.impr += m.impressions;
        acc.eng += m.impressions ? eng / m.impressions : 0;
        acc.follows += m.followsFromPost;
        acc.save += m.impressions ? m.saves / m.impressions : 0;
        return acc;
      },
      { impr: 0, eng: 0, follows: 0, save: 0 },
    );
    result.push({
      format,
      name: meta?.name ?? format,
      emoji: meta?.emoji ?? '•',
      color: meta?.color ?? '#12D99A',
      count: n,
      avgImpressions: sum.impr / n,
      avgEngRate: sum.eng / n,
      avgFollows: sum.follows / n,
      avgSaveRate: sum.save / n,
    });
  }
  return result.sort((a, b) => b.avgImpressions - a.avgImpressions);
}

/** Top performing published posts by impressions. */
export function topPosts(posts: Post[], n = 5): Post[] {
  return posts
    .filter((p) => p.status === 'published' && p.metrics)
    .sort((a, b) => (b.metrics!.impressions ?? 0) - (a.metrics!.impressions ?? 0))
    .slice(0, n);
}

// ---------------------------------------------------------------------------
// Recommendation engine – turns the numbers into concrete next steps.
// ---------------------------------------------------------------------------
export function buildRecommendations(data: HubData): Recommendation[] {
  const recs: Recommendation[] = [];
  const followerGoal = data.goals.find((g) => g.metric === 'followers');
  const imprGoal = data.goals.find((g) => g.metric === 'impressions');
  const perf = formatPerformance(data.posts);
  const snapshots = platformSnapshots(data.dailyMetrics);

  // 1. Goal pace gap – the single most important signal.
  if (followerGoal) {
    const proj = projectGoal(followerGoal, data);
    if (!proj.onTrack) {
      const extra = Math.ceil(proj.paceGap);
      recs.push({
        id: 'rec-pace',
        priority: 'critical',
        category: 'consistency',
        title: `Wachstum um ${extra > 0 ? extra : 0} Follower/Tag zu langsam`,
        detail: `Beim aktuellen Tempo (${Math.round(proj.currentDailyPace)}/Tag) landest du bei ~${Math.round(
          proj.projectedFinal,
        ).toLocaleString('de-AT')} statt ${followerGoal.target.toLocaleString('de-AT')}. Nötig sind ~${Math.ceil(
          proj.requiredDailyPace,
        )}/Tag.`,
        action: `Poste-Frequenz erhöhen: von ~5 auf 7 Videos/Woche und den stärksten Hook wöchentlich in neuer Variante recyceln.`,
        impact: `Schließt die Lücke zum 20k-Ziel bis 31.12.`,
      });
    }
  }

  // 2. Best format – double down.
  if (perf.length > 0) {
    const best = perf[0];
    recs.push({
      id: 'rec-format',
      priority: 'high',
      category: 'format',
      title: `„${best.name}" ist dein stärkstes Format`,
      detail: `Ø ${Math.round(best.avgImpressions).toLocaleString('de-AT')} Impressionen und ${(
        best.avgEngRate * 100
      ).toFixed(1)}% Engagement – deutlich über dem Schnitt.`,
      action: `Baue eine feste wöchentliche „${best.name}"-Serie mit wiedererkennbarem Intro & Titel-Layout.`,
      impact: `Planbare Reichweite + Format-Wiedererkennung.`,
    });
    // Weakest format – fix or drop.
    if (perf.length > 2) {
      const worst = perf[perf.length - 1];
      recs.push({
        id: 'rec-weak-format',
        priority: 'medium',
        category: 'format',
        title: `„${worst.name}" underperformt`,
        detail: `Nur Ø ${Math.round(worst.avgImpressions).toLocaleString(
          'de-AT',
        )} Impressionen. Entweder Hook-Problem oder falsches Format für deine Audience.`,
        action: `Vor dem Löschen 2 Varianten mit stärkerem Hook testen – sonst Ressourcen umschichten.`,
        impact: `Weniger verschwendete Produktions-Zeit.`,
      });
    }
  }

  // 3. Platform imbalance – where's the fastest lever?
  const fastest = [...snapshots].sort((a, b) => b.growth30d / (b.followers || 1) - a.growth30d / (a.followers || 1))[0];
  const slowest = [...snapshots].sort((a, b) => a.growth30d / (a.followers || 1) - b.growth30d / (b.followers || 1))[0];
  if (fastest) {
    recs.push({
      id: 'rec-platform',
      priority: 'high',
      category: 'platform',
      title: `${platformLabel(fastest.platform)} wächst am schnellsten`,
      detail: `+${fastest.growth30d.toLocaleString('de-AT')} Follower in 30 T. bei ${(
        fastest.engRate * 100
      ).toFixed(1)}% Engagement. Hier ist der Algorithmus auf deiner Seite.`,
      action: `Native zuerst für ${platformLabel(
        fastest.platform,
      )} produzieren, dann für die anderen anpassen – nicht 1:1 crossposten.`,
      impact: `Maximiert den Rückenwind der stärksten Plattform.`,
    });
  }
  if (slowest && slowest.platform !== fastest?.platform) {
    recs.push({
      id: 'rec-platform-slow',
      priority: 'medium',
      category: 'platform',
      title: `${platformLabel(slowest.platform)} stagniert`,
      detail: `Nur +${slowest.growth30d.toLocaleString(
        'de-AT',
      )} in 30 T. Entweder Format passt nicht zur Plattform oder Posting-Zeiten sind falsch.`,
      action: `Format-Länge & Untertitel plattform-nativ anpassen; Posting in die Peak-Fenster legen.`,
      impact: `Reaktiviert eine schlummernde Reichweiten-Quelle.`,
    });
  }

  // 4. Impressions goal.
  if (imprGoal) {
    const proj = projectGoal(imprGoal, data);
    if (proj.current < imprGoal.target * 0.6) {
      recs.push({
        id: 'rec-impressions',
        priority: 'high',
        category: 'topic',
        title: `Monats-Impressionen bei ${Math.round(proj.current).toLocaleString('de-AT')}`,
        detail: `Ziel ist die Zone 500k–1 Mio. Reichweite skaliert am schnellsten über breit anschlussfähige Hot-Takes & Mythos-Checks, nicht über Fach-Deep-Dives.`,
        action: `Content-Mix auf 40% Reichweite (Hot-Take/Mythos), 40% Autorität (Erklär-Stück), 20% Bindung (Story) einstellen.`,
        impact: `Bringt die Impressionen in den Zielkorridor.`,
      });
    }
  }

  // 5. Consistency check – gaps in posting.
  const gaps = detectPostingGaps(data.posts);
  if (gaps >= 3) {
    recs.push({
      id: 'rec-consistency',
      priority: 'high',
      category: 'consistency',
      title: `${gaps} Tage längste Posting-Lücke`,
      detail: `Der Algorithmus belohnt Konstanz. Längere Pausen kosten dich Reichweiten-Momentum, das du danach neu aufbauen musst.`,
      action: `Batch-Produktion: 1 Dreh-Tag/Woche für 5–7 Clips, dann über die Woche verteilt einplanen.`,
      impact: `Stabilere Baseline-Reichweite & Follower-Kurve.`,
    });
  }

  const order = { critical: 0, high: 1, medium: 2 };
  return recs.sort((a, b) => order[a.priority] - order[b.priority]);
}

function detectPostingGaps(posts: Post[]): number {
  const dates = posts
    .filter((p) => p.status === 'published')
    .map((p) => p.date)
    .sort();
  let maxGap = 0;
  for (let i = 1; i < dates.length; i++) {
    maxGap = Math.max(maxGap, daysBetween(dates[i - 1], dates[i]));
  }
  return maxGap;
}

function platformLabel(p: Platform): string {
  return { instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', facebook: 'Facebook' }[p];
}
