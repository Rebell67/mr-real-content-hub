import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Target, TrendingUp, Flame, Eye } from 'lucide-react';
import { useHub } from '../state/HubContext';
import { Topbar } from '../components/layout/Topbar';
import { StatTile, LoadingScreen } from '../components/ui/StatTile';
import { Card, ProgressBar, PriorityBadge, PlatformBadge, Delta } from '../components/ui/primitives';
import { TrendAreaChart, GoalProjectionChart } from '../components/charts/Charts';
import {
  buildRecommendations,
  combineByDate,
  computeKpis,
  formatPerformance,
  projectGoal,
  topPosts,
} from '../lib/analytics';
import { PLATFORM_META } from '../types';
import { compact, full, axisNum, formatDateLong } from '../lib/format';
import { FORMAT_MAP } from '../data/formats';

export function Dashboard() {
  const { data, loading } = useHub();

  const derived = useMemo(() => {
    if (!data) return null;
    const combined = combineByDate(data.dailyMetrics);
    const kpis = computeKpis(data);
    const recs = buildRecommendations(data);
    const followerGoal = data.goals.find((g) => g.metric === 'followers')!;
    const imprGoal = data.goals.find((g) => g.metric === 'impressions')!;
    const followerProj = projectGoal(followerGoal, data);
    const imprProj = projectGoal(imprGoal, data);
    const perf = formatPerformance(data.posts);
    const tops = topPosts(data.posts, 4);

    return { combined, kpis, recs, followerProj, imprProj, perf, tops };
  }, [data]);

  if (loading || !derived) return <><Topbar title="Cockpit" /><LoadingScreen /></>;

  const { combined, kpis, recs, followerProj, imprProj, perf, tops } = derived;
  const trend60 = combined.slice(-60);
  const sparkFor = (key: 'followers' | 'impressions' | 'reach' | 'engagements') => trend60.map((d) => d[key]);

  const projSeries = (() => {
    const last = combined[combined.length - 1];
    const arr = combined.slice(-70).map((d) => ({ date: d.date, actual: d.followers as number | undefined, projected: undefined as number | undefined }));
    if (last) {
      arr[arr.length - 1].projected = last.followers;
      const steps = 6;
      for (let i = 1; i <= steps; i++) {
        const frac = i / steps;
        const dt = new Date(last.date);
        dt.setDate(dt.getDate() + Math.round(followerProj.daysRemaining * frac));
        arr.push({ date: dt.toISOString().slice(0, 10), actual: undefined, projected: Math.round(last.followers + followerProj.currentDailyPace * followerProj.daysRemaining * frac) });
      }
    }
    return arr;
  })();

  return (
    <>
      <Topbar title="Cockpit" subtitle={`Stand ${formatDateLong(combined[combined.length - 1].date)} · Kurs auf 20.000`} />
      <div className="space-y-6 p-5 sm:p-8">
        {/* KPI row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatTile label={kpis[0].label} value={kpis[0].value} delta={kpis[0].delta} spark={sparkFor('followers')} color="#12D99A" icon={<TrendingUp size={16} />} />
          <StatTile label={kpis[1].label} value={kpis[1].value} delta={kpis[1].delta} color="#3EEBB2" />
          <StatTile label={kpis[2].label} value={kpis[2].value} delta={kpis[2].delta} spark={sparkFor('impressions')} color="#22D3EE" icon={<Eye size={16} />} />
          <StatTile label={kpis[3].label} value={kpis[3].value} delta={kpis[3].delta} spark={sparkFor('reach')} color="#5B8DEF" />
          <StatTile label={kpis[4].label} value={kpis[4].value} format="pct" delta={kpis[4].delta} color="#F7C14B" icon={<Flame size={16} />} />
        </div>

        {/* Goal projection + impressions gauge */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-2">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-brand-300" />
                <h2 className="section-title">Zielprognose · 20.000 Follower</h2>
              </div>
              <span
                className={`chip font-semibold ${followerProj.onTrack ? 'bg-brand-500/15 text-brand-300' : 'bg-youtube/15 text-youtube'}`}
              >
                {followerProj.onTrack ? 'Auf Kurs' : 'Nachsteuern nötig'}
              </span>
            </div>
            <GoalProjectionChart data={projSeries} target={20000} />
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniStat label="Aktuell" value={full(followerProj.current)} />
              <MiniStat label="Prognose 31.12." value={full(followerProj.projectedFinal)} accent={followerProj.onTrack ? 'good' : 'bad'} />
              <MiniStat label="Tempo aktuell" value={`${Math.round(followerProj.currentDailyPace)}/Tag`} />
              <MiniStat label="Tempo nötig" value={`${Math.ceil(followerProj.requiredDailyPace)}/Tag`} accent={followerProj.paceGap > 0 ? 'bad' : 'good'} />
            </div>
          </Card>

          <Card className="flex flex-col p-5">
            <div className="mb-4 flex items-center gap-2">
              <Eye size={18} className="text-tiktok" />
              <h2 className="section-title">Impressionen / Monat</h2>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center py-2">
              <ImpressionsGauge value={imprProj.current} target={750000} />
            </div>
            <div className="mt-2 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Aktuell (30 T.)</span><span className="font-semibold text-white">{compact(imprProj.current)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Zielkorridor</span><span className="font-semibold text-white">500k – 1 Mio.</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Trend</span><Delta value={(imprProj.currentDailyPace * 30) / (imprProj.current || 1)} /></div>
            </div>
          </Card>
        </div>

        {/* Growth trend + priority actions */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-title">Reichweite & Engagement · 60 Tage</h2>
              <Link to="/analytics" className="inline-flex items-center gap-1 text-sm font-medium text-brand-300 hover:text-brand-200">
                Analytics <ArrowUpRight size={14} />
              </Link>
            </div>
            <TrendAreaChart
              data={trend60 as unknown as Array<Record<string, number | string>>}
              series={[
                { key: 'impressions', name: 'Impressionen', color: '#22D3EE' },
                { key: 'reach', name: 'Reichweite', color: '#5B8DEF' },
                { key: 'engagements', name: 'Engagement', color: '#F7C14B' },
              ]}
            />
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-title">Prioritäten heute</h2>
              <Link to="/strategy" className="text-sm font-medium text-brand-300 hover:text-brand-200">Alle</Link>
            </div>
            <div className="space-y-3">
              {recs.slice(0, 3).map((r) => (
                <div key={r.id} className="rounded-xl border border-white/[0.06] bg-ink-850/50 p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <PriorityBadge priority={r.priority} />
                  </div>
                  <p className="text-sm font-semibold text-white">{r.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">{r.action}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Top posts + format performance */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-title">Top-Content · 30 Tage</h2>
              <Link to="/library" className="text-sm font-medium text-brand-300 hover:text-brand-200">Bibliothek</Link>
            </div>
            <div className="space-y-2">
              {tops.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-ink-850/40 p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/12 font-display text-sm font-bold text-brand-300">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{p.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-slate-500">{FORMAT_MAP[p.format]?.emoji} {FORMAT_MAP[p.format]?.name}</span>
                      {p.platforms.slice(0, 2).map((pl) => <PlatformBadge key={pl} platform={pl} />)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-sm font-bold text-white">{compact(p.metrics!.impressions)}</div>
                    <div className="text-[10px] text-slate-500">Impressionen</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-title">Format-Performance</h2>
              <Link to="/ideas" className="text-sm font-medium text-brand-300 hover:text-brand-200">Formate</Link>
            </div>
            <div className="space-y-3">
              {perf.slice(0, 5).map((f) => {
                const maxImpr = perf[0].avgImpressions || 1;
                return (
                  <div key={f.format}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-200">{f.emoji} {f.name}</span>
                      <span className="tabular-nums text-slate-400">Ø {compact(f.avgImpressions)}</span>
                    </div>
                    <ProgressBar value={f.avgImpressions / maxImpr} color={f.color} />
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Platform strip */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {data!.dailyMetrics.length > 0 &&
            (['instagram', 'tiktok', 'youtube', 'facebook'] as const).map((platform) => {
              const rows = data!.dailyMetrics.filter((m) => m.platform === platform);
              const latest = rows[rows.length - 1];
              const meta = PLATFORM_META[platform];
              return (
                <Card key={platform} hover className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold" style={{ color: meta.color }}>{meta.label}</span>
                    <span className="text-xs text-slate-500">{meta.handle}</span>
                  </div>
                  <div className="mt-2 font-display text-2xl font-bold text-white">{full(latest?.followers ?? 0)}</div>
                  <div className="text-xs text-slate-500">Follower</div>
                </Card>
              );
            })}
        </div>
      </div>
    </>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: 'good' | 'bad' }) {
  const color = accent === 'good' ? 'text-brand-300' : accent === 'bad' ? 'text-gold-400' : 'text-white';
  return (
    <div className="rounded-xl border border-white/[0.05] bg-ink-850/40 p-3">
      <div className="stat-label">{label}</div>
      <div className={`mt-0.5 font-display text-lg font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

function ImpressionsGauge({ value, target }: { value: number; target: number }) {
  const pctVal = Math.min(1, value / target);
  const r = 70;
  const circ = Math.PI * r; // half circle
  const offset = circ * (1 - pctVal);
  return (
    <div className="relative">
      <svg width="180" height="110" viewBox="0 0 180 110">
        <path d="M 20 100 A 70 70 0 0 1 160 100" fill="none" stroke="#ffffff10" strokeWidth="12" strokeLinecap="round" />
        <path
          d="M 20 100 A 70 70 0 0 1 160 100"
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#00C389" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-x-0 bottom-1 text-center">
        <div className="font-display text-2xl font-bold text-white">{axisNum(value)}</div>
        <div className="text-[11px] text-slate-500">von {axisNum(target)} Ziel</div>
      </div>
    </div>
  );
}
