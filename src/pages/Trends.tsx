import { useEffect, useMemo, useState } from 'react';
import { Flame, TrendingUp, Loader2, FileText, ArrowUpRight, Info } from 'lucide-react';
import { Topbar } from '../components/layout/Topbar';
import { Card, PlatformBadge } from '../components/ui/primitives';
import { ScriptModal } from '../components/ScriptModal';
import { requestTrends, type TrendSource } from '../services/trendService';
import type { ContentIdea, Trend } from '../types';
import { compact } from '../lib/format';

type Filter = 'all' | 'instagram' | 'tiktok';

// Wandelt einen Trend in eine Idee, damit der Skript-Generator ihn nutzen kann.
function trendToIdea(t: Trend): ContentIdea {
  return {
    id: `trend-${t.id}`,
    title: t.adaptHook.split(/[–:.!?]/)[0].trim().slice(0, 60) || 'Trend-Skript',
    hook: t.adaptHook,
    format: t.suggestedFormat,
    angle: t.format,
    rationale: t.whyItWorks,
    effort: 'low',
    potential: t.outlierFactor >= 10 ? 'viral' : 'high',
    suggestedPlatforms: t.platform === 'instagram' ? ['instagram', 'tiktok'] : ['tiktok', 'instagram'],
  };
}

export function Trends() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [source, setSource] = useState<TrendSource>('demo');
  const [note, setNote] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [scriptIdea, setScriptIdea] = useState<ContentIdea | null>(null);

  useEffect(() => {
    let alive = true;
    requestTrends().then((r) => {
      if (!alive) return;
      setTrends(r.trends);
      setSource(r.source);
      setNote(r.note);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const list = useMemo(() => {
    const filtered = filter === 'all' ? trends : trends.filter((t) => t.platform === filter);
    return [...filtered].sort((a, b) => b.outlierFactor - a.outlierFactor);
  }, [trends, filter]);

  return (
    <>
      <Topbar title="Trends & Outlier" subtitle="Nachmachbare virale Formate für Reichweite & Follower – ohne teure Requisiten" />
      <div className="space-y-6 p-5 sm:p-8">
        {/* Datenquellen-Hinweis */}
        <div className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${source === 'live' ? 'border-brand-500/25 bg-brand-500/[0.06] text-brand-200' : 'border-tiktok/20 bg-tiktok/[0.06] text-slate-300'}`}>
          <Info size={16} className="mt-0.5 shrink-0 text-tiktok" />
          <span>{note ?? (source === 'live' ? 'Live-Trends aktiv.' : 'Demo-Trends aktiv.')}</span>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5 rounded-xl border border-white/[0.06] bg-ink-800/60 p-1">
            {(['all', 'tiktok', 'instagram'] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${filter === f ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {f === 'all' ? 'Alle' : f === 'tiktok' ? 'TikTok' : 'Instagram'}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-500">Sortiert nach Outlier-Faktor (Views ÷ Kanal-Schnitt)</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <Loader2 size={28} className="animate-spin text-brand-300" />
            <p className="text-sm text-slate-400">Trends werden geladen…</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {list.map((t) => (
              <TrendCard key={t.id} trend={t} onScript={() => setScriptIdea(trendToIdea(t))} />
            ))}
          </div>
        )}
      </div>

      {scriptIdea && <ScriptModal idea={scriptIdea} onClose={() => setScriptIdea(null)} />}
    </>
  );
}

function TrendCard({ trend, onScript }: { trend: Trend; onScript: () => void }) {
  const hot = trend.outlierFactor >= 10;
  return (
    <Card hover className="flex flex-col p-4">
      <div className="mb-2 flex items-center justify-between">
        <PlatformBadge platform={trend.platform} size="md" />
        <span
          className="chip font-bold"
          style={{ color: hot ? '#FF5A5A' : '#F7C14B', backgroundColor: hot ? '#FF5A5A18' : '#F7C14B18' }}
        >
          <Flame size={12} /> {trend.outlierFactor.toFixed(1)}× Outlier
        </span>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <span className="inline-flex items-center gap-1 font-display font-bold text-white">
          <TrendingUp size={14} className="text-brand-300" /> {compact(trend.views)}
        </span>
        <span className="text-xs text-slate-500">Views · {trend.creatorHandle}</span>
        <span className="ml-auto text-[10px] text-slate-600">vor {trend.daysAgo} T. · {trend.region}</span>
      </div>

      <p className="mt-2 text-sm font-semibold leading-snug text-white">{trend.hook}</p>
      <span className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">{trend.format}</span>

      <p className="mt-2 flex-1 text-xs leading-relaxed text-slate-400">{trend.whyItWorks}</p>

      <div className="mt-3 rounded-lg border border-brand-500/20 bg-brand-500/[0.06] p-2.5">
        <span className="stat-label flex items-center gap-1 text-brand-300"><ArrowUpRight size={12} /> Für Mr Real</span>
        <p className="mt-0.5 text-sm italic leading-relaxed text-brand-100">{trend.adaptHook}</p>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button onClick={onScript} className="btn-primary flex-1">
          <FileText size={15} /> Skript daraus
        </button>
        {trend.url && (
          <a href={trend.url} target="_blank" rel="noreferrer" className="btn-ghost" title="Original-Reel ansehen">
            <ArrowUpRight size={15} /> Ansehen
          </a>
        )}
      </div>
    </Card>
  );
}
