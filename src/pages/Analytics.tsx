import { useMemo, useState } from 'react';
import { useHub } from '../state/HubContext';
import { Topbar } from '../components/layout/Topbar';
import { LoadingScreen } from '../components/ui/StatTile';
import { Card, Delta } from '../components/ui/primitives';
import { MultiLineChart, TrendAreaChart, HorizontalBars } from '../components/charts/Charts';
import { combineByDate, platformSnapshots } from '../lib/analytics';
import { PLATFORMS, PLATFORM_META, type Platform } from '../types';
import { compact, full, pct } from '../lib/format';
import { PostingHeatmap } from '../components/PostingHeatmap';

type Range = 30 | 60 | 90;

export function Analytics() {
  const { data, loading } = useHub();
  const [platform, setPlatform] = useState<Platform | 'all'>('all');
  const [range, setRange] = useState<Range>(60);

  const view = useMemo(() => {
    if (!data) return null;
    const metrics = platform === 'all' ? data.dailyMetrics : data.dailyMetrics.filter((m) => m.platform === platform);
    const combined = combineByDate(metrics).slice(-range);
    const snapshots = platformSnapshots(data.dailyMetrics);

    // Per-platform follower series for the comparison line chart.
    const dates = [...new Set(data.dailyMetrics.map((m) => m.date))].sort().slice(-range);
    const followerSeries = dates.map((date) => {
      const row: Record<string, number | string> = { date };
      for (const p of PLATFORMS) {
        const m = data.dailyMetrics.find((x) => x.date === date && x.platform === p);
        if (m) row[p] = m.followers;
      }
      return row;
    });

    return { combined, snapshots, followerSeries };
  }, [data, platform, range]);

  if (loading || !view) return <><Topbar title="Analytics" /><LoadingScreen /></>;

  const { combined, snapshots, followerSeries } = view;
  const totalFollowers = snapshots.reduce((s, p) => s + p.followers, 0);
  const totalGrowth = snapshots.reduce((s, p) => s + p.growth30d, 0);
  const totalImpr = snapshots.reduce((s, p) => s + p.impressions30d, 0);

  return (
    <>
      <Topbar title="Analytics" subtitle="Plattform-übergreifende Reichweiten- & Wachstumsanalyse" />
      <div className="space-y-6 p-5 sm:p-8">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1.5 rounded-xl border border-white/[0.06] bg-ink-800/60 p-1">
            <FilterChip active={platform === 'all'} onClick={() => setPlatform('all')}>Alle</FilterChip>
            {PLATFORMS.map((p) => (
              <FilterChip key={p} active={platform === p} onClick={() => setPlatform(p)} color={PLATFORM_META[p].color}>
                {PLATFORM_META[p].label}
              </FilterChip>
            ))}
          </div>
          <div className="flex gap-1.5 rounded-xl border border-white/[0.06] bg-ink-800/60 p-1">
            {([30, 60, 90] as Range[]).map((r) => (
              <FilterChip key={r} active={range === r} onClick={() => setRange(r)}>{r} T.</FilterChip>
            ))}
          </div>
        </div>

        {/* Summary tiles */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SummaryTile label="Follower gesamt" value={full(totalFollowers)} />
          <SummaryTile label="Wachstum (30 T.)" value={`+${full(totalGrowth)}`} accent />
          <SummaryTile label="Impressionen (30 T.)" value={compact(totalImpr)} />
          <SummaryTile label="Ø Engagement-Rate" value={pct(snapshots.reduce((s, p) => s + p.engRate, 0) / snapshots.length)} />
        </div>

        {/* Follower growth by platform */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">Follower-Wachstum je Plattform</h2>
            <span className="text-xs text-slate-500">{range} Tage</span>
          </div>
          <MultiLineChart
            data={followerSeries}
            series={PLATFORMS.map((p) => ({ key: p, name: PLATFORM_META[p].label, color: PLATFORM_META[p].color }))}
            height={300}
          />
        </Card>

        {/* Reach/impressions + comparison bars */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-title">Impressionen & Reichweite</h2>
              <span className="text-xs text-slate-500">{platform === 'all' ? 'Alle Plattformen' : PLATFORM_META[platform].label}</span>
            </div>
            <TrendAreaChart
              data={combined as unknown as Array<Record<string, number | string>>}
              series={[
                { key: 'impressions', name: 'Impressionen', color: '#22D3EE' },
                { key: 'reach', name: 'Reichweite', color: '#5B8DEF' },
              ]}
              height={300}
            />
          </Card>

          <Card className="p-5">
            <h2 className="section-title mb-4">Reichweite je Plattform</h2>
            <HorizontalBars
              data={snapshots
                .slice()
                .sort((a, b) => b.impressions30d - a.impressions30d)
                .map((s) => ({ name: PLATFORM_META[s.platform].label, value: s.impressions30d, color: PLATFORM_META[s.platform].color }))}
              height={260}
            />
          </Card>
        </div>

        {/* Platform table */}
        <Card className="overflow-hidden">
          <div className="border-b border-white/[0.06] p-5">
            <h2 className="section-title">Plattform-Vergleich</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3 font-semibold">Plattform</th>
                  <th className="px-5 py-3 text-right font-semibold">Follower</th>
                  <th className="px-5 py-3 text-right font-semibold">+30 Tage</th>
                  <th className="px-5 py-3 text-right font-semibold">Impressionen 30T</th>
                  <th className="px-5 py-3 text-right font-semibold">Engagement</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map((s) => (
                  <tr key={s.platform} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-2 font-medium text-white">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PLATFORM_META[s.platform].color }} />
                        {PLATFORM_META[s.platform].label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums text-white">{full(s.followers)}</td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        <span className="text-brand-300">+{full(s.growth30d)}</span>
                        <Delta value={s.growth30d / (s.followers30dAgo || 1)} />
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-300">{compact(s.impressions30d)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-300">{pct(s.engRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Posting heatmap */}
        <Card className="p-5">
          <div className="mb-4">
            <h2 className="section-title">Beste Posting-Zeiten</h2>
            <p className="mt-0.5 text-sm text-slate-400">Relative Engagement-Stärke nach Wochentag & Uhrzeit – wähle eine Plattform.</p>
          </div>
          <PostingHeatmap windows={data!.postingWindows} defaultPlatform={platform === 'all' ? 'tiktok' : platform} />
        </Card>
      </div>
    </>
  );
}

function FilterChip({ active, onClick, children, color }: { active: boolean; onClick: () => void; children: React.ReactNode; color?: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
        active ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
      }`}
      style={active && color ? { color, backgroundColor: `${color}20` } : undefined}
    >
      {children}
    </button>
  );
}

function SummaryTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card className="p-4">
      <div className="stat-label">{label}</div>
      <div className={`mt-1 font-display text-2xl font-bold tabular-nums ${accent ? 'text-brand-300' : 'text-white'}`}>{value}</div>
    </Card>
  );
}
