import { useMemo } from 'react';
import { Rocket, CalendarRange, Target, Sparkles, ListChecks, Zap } from 'lucide-react';
import { useHub } from '../state/HubContext';
import { Topbar } from '../components/layout/Topbar';
import { LoadingScreen } from '../components/ui/StatTile';
import { Card, PlatformBadge } from '../components/ui/primitives';
import { FORMAT_MAP } from '../data/formats';
import {
  GROWTH_LEVERS,
  WEEKLY_RHYTHM,
  CONTENT_CALENDAR,
  REACH_RULES,
  GROWTH_MILESTONES,
} from '../data/growthPlan';
import { projectGoal } from '../lib/analytics';
import { full } from '../lib/format';

const GOAL_STYLE: Record<string, { label: string; color: string }> = {
  reichweite: { label: 'Reichweite', color: '#F7C14B' },
  follower: { label: 'Follower', color: '#12D99A' },
  bindung: { label: 'Bindung', color: '#5B8DEF' },
  autorität: { label: 'Autorität', color: '#22D3EE' },
};

export function GrowthPlan() {
  const { data, loading } = useHub();

  const math = useMemo(() => {
    if (!data) return null;
    const goal = data.goals.find((g) => g.metric === 'followers');
    if (!goal) return null;
    return { proj: projectGoal(goal, data) };
  }, [data]);

  if (loading || !data || !math) return <><Topbar title="Wachstums-Plan" /><LoadingScreen /></>;

  const { proj } = math;
  const perDayNeeded = Math.ceil(proj.requiredDailyPace);
  const perWeekNeeded = perDayNeeded * 7;

  return (
    <>
      <Topbar title="Wachstums-Plan" subtitle="Der Fahrplan von heute bis 20.000 – auf Reichweite & Follower getrimmt" />
      <div className="space-y-6 p-5 sm:p-8">
        {/* Ehrliche Ausgangslage */}
        <Card className="relative overflow-hidden p-6">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="relative flex flex-wrap items-center gap-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-300">
              <Target size={28} />
            </div>
            <div className="flex-1 min-w-[220px]">
              <div className="stat-label">Deine Ausgangslage (echte Daten)</div>
              <div className="font-display text-2xl font-bold text-white sm:text-3xl">
                {full(proj.current)} → 20.000 Follower
              </div>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-400">
                Ehrlich gerechnet: Für das Ziel bis 31.12. brauchst du im Schnitt <span className="font-semibold text-gold-300">~{perDayNeeded} neue Follower/Tag</span> (aktuell ~{Math.round(proj.currentDailyPace)}/Tag). Das ist sehr ambitioniert und geht <span className="font-semibold text-white">nur über virales Kurzvideo</span> – nicht über mehr Fach-Posts. Der Plan darunter ist genau darauf ausgelegt.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-5">
              <HeroStat label="Pro Tag nötig" value={`${perDayNeeded}`} />
              <HeroStat label="Pro Woche" value={`${perWeekNeeded}`} />
              <HeroStat label="Tage übrig" value={`${proj.daysRemaining}`} />
            </div>
          </div>
        </Card>

        {/* Meilenstein-Leiter */}
        <Card className="p-5">
          <div className="mb-5 flex items-center gap-2">
            <CalendarRange size={18} className="text-brand-300" />
            <h2 className="section-title">Meilenstein-Leiter</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {GROWTH_MILESTONES.map((m, i) => (
              <div key={m.month} className="relative rounded-xl border border-white/[0.06] bg-ink-850/50 p-3">
                <div className="stat-label">{m.month}</div>
                <div className="mt-1 font-display text-xl font-bold text-white">{full(m.target)}</div>
                <p className="mt-1 text-[11px] leading-snug text-slate-500">{m.note}</p>
                {i < GROWTH_MILESTONES.length - 1 && (
                  <div className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-slate-700 lg:block">→</div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Die 4 Hebel */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Rocket size={18} className="text-gold-400" />
            <h2 className="section-title">Deine 4 Wachstums-Hebel</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {GROWTH_LEVERS.map((lever) => (
              <Card key={lever.id} hover className="p-5">
                <div className="mb-2 flex items-center gap-3">
                  <span className="text-2xl">{lever.emoji}</span>
                  <h3 className="font-display text-base font-semibold text-white">{lever.title}</h3>
                </div>
                <div className="rounded-lg border-l-2 bg-ink-850/50 p-2.5" style={{ borderColor: lever.color }}>
                  <span className="stat-label">Was die Daten sagen</span>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-300">{lever.insight}</p>
                </div>
                <div className="mt-3 flex items-start gap-2">
                  <Zap size={15} className="mt-0.5 shrink-0" style={{ color: lever.color }} />
                  <p className="text-sm font-medium text-slate-200">{lever.action}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Wochen-Rhythmus */}
        <Card className="p-5">
          <div className="mb-1 flex items-center gap-2">
            <Sparkles size={18} className="text-brand-300" />
            <h2 className="section-title">Dein Wochen-Rhythmus</h2>
          </div>
          <p className="mb-4 text-sm text-slate-400">1 Video pro Tag – fixe Formate pro Wochentag. Das nimmt dir jede Tages-Entscheidung ab.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {WEEKLY_RHYTHM.map((d) => {
              const fmt = FORMAT_MAP[d.format];
              return (
                <div key={d.day} className="rounded-xl border border-white/[0.06] bg-ink-850/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-bold text-white">{d.day}</span>
                    <span className="text-lg">{fmt?.emoji}</span>
                  </div>
                  <div className="mt-1 text-xs font-semibold" style={{ color: fmt?.color }}>{fmt?.name}</div>
                  <p className="mt-1 text-[11px] leading-snug text-slate-500">{d.focus}</p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* 14-Tage-Kalender */}
        <Card className="overflow-hidden">
          <div className="border-b border-white/[0.06] p-5">
            <div className="flex items-center gap-2">
              <CalendarRange size={18} className="text-tiktok" />
              <h2 className="section-title">14-Tage-Startplan – sofort umsetzbar</h2>
            </div>
            <p className="mt-0.5 text-sm text-slate-400">Fertige Hooks. Du musst nur noch drehen. Reichweiten-Posts bewusst am häufigsten.</p>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {CONTENT_CALENDAR.map((c) => {
              const fmt = FORMAT_MAP[c.format];
              const g = GOAL_STYLE[c.goal];
              return (
                <div key={c.day} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-white/[0.04]">
                    <span className="text-[9px] uppercase text-slate-500">Tag</span>
                    <span className="font-display text-sm font-bold text-white">{c.day}</span>
                  </div>
                  <div className="w-9 text-center text-xl">{fmt?.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white">{c.title}</p>
                    <p className="mt-0.5 text-sm italic text-slate-400">„{c.hook}"</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="chip font-semibold" style={{ color: g.color, backgroundColor: `${g.color}18` }}>{g.label}</span>
                    {c.platforms.map((p) => <PlatformBadge key={p} platform={p} />)}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Reichweiten-Regeln */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <ListChecks size={18} className="text-brand-300" />
            <h2 className="section-title">Die 8 Reichweiten-Regeln</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {REACH_RULES.map((r, i) => (
              <div key={r.title} className="flex gap-3 rounded-xl border border-white/[0.05] bg-ink-850/40 p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/15 font-display text-xs font-bold text-brand-300">{i + 1}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{r.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{r.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-xl font-bold text-white sm:text-2xl">{value}</div>
      <div className="text-[11px] text-slate-500">{label}</div>
    </div>
  );
}
