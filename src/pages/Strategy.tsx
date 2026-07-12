import { useMemo } from 'react';
import { Rocket, Target, CheckCircle2, ArrowRight, Layers } from 'lucide-react';
import { useHub } from '../state/HubContext';
import { Topbar } from '../components/layout/Topbar';
import { LoadingScreen } from '../components/ui/StatTile';
import { Card, PriorityBadge, ProgressBar } from '../components/ui/primitives';
import { buildRecommendations, projectGoal } from '../lib/analytics';
import { compact, full, formatDateLong, daysBetween } from '../lib/format';

const CONTENT_MIX = [
  { label: 'Reichweite', desc: 'Hot-Take & Mythos-Check', share: 0.4, color: '#F7C14B' },
  { label: 'Autorität', desc: 'Erklär-Stücke & Objekt-Analyse', share: 0.4, color: '#12D99A' },
  { label: 'Bindung', desc: 'Story & Behind the Scenes', share: 0.2, color: '#5B8DEF' },
];

export function Strategy() {
  const { data, loading } = useHub();

  const view = useMemo(() => {
    if (!data) return null;
    const recs = buildRecommendations(data);
    const followerGoal = data.goals.find((g) => g.metric === 'followers')!;
    const proj = projectGoal(followerGoal, data);
    return { recs, proj, followerGoal };
  }, [data]);

  if (loading || !view) return <><Topbar title="Strategie" /><LoadingScreen /></>;

  const { recs, proj, followerGoal } = view;

  // Monthly milestones from now to deadline.
  const milestones = buildMilestones(proj.current, followerGoal.target, data!.dailyMetrics.slice(-1)[0]?.date ?? '2026-07-12', followerGoal.deadline);

  return (
    <>
      <Topbar title="Strategie" subtitle="Von Daten zu Entscheidungen – der Weg zu 20.000" />
      <div className="space-y-6 p-5 sm:p-8">
        {/* North star */}
        <Card className="relative overflow-hidden p-6">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="relative flex flex-wrap items-center gap-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-300">
              <Target size={28} />
            </div>
            <div className="flex-1">
              <div className="stat-label">Nordstern bis {formatDateLong(followerGoal.deadline)}</div>
              <div className="font-display text-2xl font-bold text-white sm:text-3xl">20.000 Follower · 500k–1 Mio. Impressionen/Monat</div>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <HeroStat label="Aktuell" value={full(proj.current)} />
              <HeroStat label="Noch offen" value={full(Math.max(0, followerGoal.target - proj.current))} />
              <HeroStat label="Tage übrig" value={String(proj.daysRemaining)} />
            </div>
          </div>
          <div className="relative mt-5">
            <div className="mb-1.5 flex justify-between text-xs text-slate-400">
              <span>{Math.round(proj.progress * 100)}% des Ziels</span>
              <span>Tempo nötig: {Math.ceil(proj.requiredDailyPace)}/Tag (aktuell {Math.round(proj.currentDailyPace)}/Tag)</span>
            </div>
            <ProgressBar value={proj.progress} color={proj.onTrack ? '#00C389' : '#F7C14B'} />
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recommendations */}
          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-center gap-2">
              <Rocket size={18} className="text-brand-300" />
              <h2 className="section-title">Empfohlene nächste Schritte</h2>
            </div>
            {recs.map((r) => (
              <Card key={r.id} hover className="p-5">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <PriorityBadge priority={r.priority} />
                  <span className="chip bg-white/[0.04] text-slate-400">{categoryLabel(r.category)}</span>
                </div>
                <h3 className="font-display text-base font-semibold text-white">{r.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{r.detail}</p>
                <div className="mt-3 flex flex-col gap-2 rounded-xl border border-brand-500/20 bg-brand-500/[0.06] p-3 sm:flex-row sm:items-center">
                  <div className="flex items-start gap-2">
                    <ArrowRight size={16} className="mt-0.5 shrink-0 text-brand-300" />
                    <p className="text-sm font-medium text-brand-100">{r.action}</p>
                  </div>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                  <CheckCircle2 size={13} className="text-brand-400" /> Erwartet: {r.impact}
                </p>
              </Card>
            ))}
          </div>

          {/* Sidebar: content mix + milestones */}
          <div className="space-y-6">
            <Card className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <Layers size={18} className="text-gold-400" />
                <h2 className="section-title">Empfohlener Content-Mix</h2>
              </div>
              <div className="mb-4 flex h-3 overflow-hidden rounded-full">
                {CONTENT_MIX.map((m) => (
                  <div key={m.label} style={{ width: `${m.share * 100}%`, backgroundColor: m.color }} />
                ))}
              </div>
              <div className="space-y-3">
                {CONTENT_MIX.map((m) => (
                  <div key={m.label} className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: m.color }} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">{m.label}</span>
                        <span className="text-sm font-bold text-slate-300">{Math.round(m.share * 100)}%</span>
                      </div>
                      <p className="text-xs text-slate-500">{m.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="section-title mb-4">Monats-Meilensteine</h2>
              <div className="space-y-4">
                {milestones.map((m, i) => (
                  <div key={m.label} className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`h-3 w-3 rounded-full ${m.reached ? 'bg-brand-400' : 'border-2 border-slate-600 bg-transparent'}`} />
                      {i < milestones.length - 1 && <div className="h-8 w-px bg-white/10" />}
                    </div>
                    <div className="flex flex-1 items-center justify-between pb-2">
                      <span className={`text-sm ${m.reached ? 'text-slate-400' : 'font-medium text-white'}`}>{m.label}</span>
                      <span className="font-display text-sm font-bold text-white">{compact(m.target)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
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

function buildMilestones(current: number, target: number, today: string, deadline: string) {
  const totalDays = daysBetween(today, deadline);
  const months = Math.max(1, Math.round(totalDays / 30));
  const remaining = target - current;
  const out: { label: string; target: number; reached: boolean }[] = [];
  const startDate = new Date(today);
  for (let i = 1; i <= months; i++) {
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + i);
    const t = Math.round(current + (remaining * i) / months);
    out.push({
      label: d.toLocaleDateString('de-AT', { month: 'long' }),
      target: Math.min(target, t),
      reached: false,
    });
  }
  return out.slice(0, 6);
}

function categoryLabel(c: string): string {
  return (
    { format: 'Format', timing: 'Timing', platform: 'Plattform', consistency: 'Konstanz', topic: 'Thema', hook: 'Hook' }[c] ??
    c
  );
}
