import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, FileText, Info, ExternalLink, Zap, Clock } from 'lucide-react';
import { Topbar } from '../components/layout/Topbar';
import { Card } from '../components/ui/primitives';
import { ScriptModal } from '../components/ScriptModal';
import { requestNews, type NewsSource } from '../services/newsService';
import { computeRelevance, verdictOf, VERDICT_META, SUB_META, freshness, agoLabel } from '../lib/newsScore';
import type { ContentIdea, NewsCategory, NewsItem } from '../types';

const CAT_META: Record<NewsCategory, { label: string; color: string }> = {
  immobilien: { label: 'Immobilien', color: '#EFA92B' },
  finanzen: { label: 'Finanzen', color: '#12D99A' },
  wirtschaft: { label: 'Wirtschaft', color: '#5B8DEF' },
  zinsen: { label: 'Zinsen', color: '#22D3EE' },
  politik: { label: 'Politik', color: '#FF5A5A' },
};

type Sort = 'potenzial' | 'neueste';

function newsToIdea(n: NewsItem): ContentIdea {
  return {
    id: `news-${n.id}`,
    title: n.headline.slice(0, 70),
    hook: n.hook,
    format: n.suggestedFormat,
    angle: n.angle,
    rationale: n.summary,
    effort: 'low',
    potential: computeRelevance(n.subs) >= 75 ? 'viral' : 'high',
    suggestedPlatforms: ['tiktok', 'instagram'],
  };
}

export function News() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [source, setSource] = useState<NewsSource>('demo');
  const [note, setNote] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState<NewsCategory | 'all'>('all');
  const [sort, setSort] = useState<Sort>('potenzial');
  const [scriptIdea, setScriptIdea] = useState<ContentIdea | null>(null);

  const load = () => {
    setLoading(true);
    requestNews().then((r) => {
      setItems(r.items);
      setSource(r.source);
      setNote(r.note);
      setLoading(false);
    });
  };
  useEffect(load, []);

  const scored = useMemo(
    () => items.map((n) => ({ ...n, total: computeRelevance(n.subs) })),
    [items],
  );

  const hero = useMemo(() => [...scored].sort((a, b) => b.total - a.total)[0], [scored]);

  const list = useMemo(() => {
    let l = cat === 'all' ? scored : scored.filter((n) => n.category === cat);
    l = l.filter((n) => n.id !== hero?.id);
    l.sort((a, b) => (sort === 'potenzial' ? b.total - a.total : a.publishedAgoHours - b.publishedAgoHours));
    return l;
  }, [scored, cat, sort, hero]);

  return (
    <>
      <Topbar title="News-Radar" subtitle="Tagesaktuell: was Wirtschaft, Immobilien & Finanzen bewegt – nach Video-Potenzial" />
      <div className="space-y-6 p-5 sm:p-8">
        {/* Source + refresh */}
        <div className="flex flex-wrap items-center gap-3">
          <div className={`flex flex-1 items-start gap-2 rounded-xl border p-3 text-sm ${source === 'live' ? 'border-brand-500/25 bg-brand-500/[0.06] text-brand-200' : 'border-tiktok/20 bg-tiktok/[0.06] text-slate-300'}`}>
            <Info size={16} className="mt-0.5 shrink-0 text-tiktok" />
            <span>{source === 'live' ? 'Live-News – nach jedem Refresh tagesaktuell.' : note ?? 'Demo-News aktiv.'}</span>
          </div>
          <button onClick={load} disabled={loading} className="btn-ghost">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <RefreshCw size={26} className="animate-spin text-brand-300" />
            <p className="text-sm text-slate-400">News werden geladen…</p>
          </div>
        ) : (
          <>
            {/* Top-Empfehlung des Tages */}
            {hero && <HeroNews item={hero} total={hero.total} onScript={() => setScriptIdea(newsToIdea(hero))} />}

            {/* Filter + Sort */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5 rounded-xl border border-white/[0.06] bg-ink-800/60 p-1">
                <Chip active={cat === 'all'} onClick={() => setCat('all')}>Alle</Chip>
                {(Object.keys(CAT_META) as NewsCategory[]).map((c) => (
                  <Chip key={c} active={cat === c} onClick={() => setCat(c)} color={CAT_META[c].color}>
                    {CAT_META[c].label}
                  </Chip>
                ))}
              </div>
              <div className="flex gap-1.5 rounded-xl border border-white/[0.06] bg-ink-800/60 p-1">
                <Chip active={sort === 'potenzial'} onClick={() => setSort('potenzial')}>Video-Potenzial</Chip>
                <Chip active={sort === 'neueste'} onClick={() => setSort('neueste')}>Neueste</Chip>
              </div>
            </div>

            {/* Cards */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {list.map((n) => (
                <NewsCard key={n.id} item={n} total={n.total} onScript={() => setScriptIdea(newsToIdea(n))} />
              ))}
            </div>
          </>
        )}
      </div>

      {scriptIdea && <ScriptModal idea={scriptIdea} onClose={() => setScriptIdea(null)} />}
    </>
  );
}

function RelevanceRing({ total }: { total: number }) {
  const v = verdictOf(total);
  const meta = VERDICT_META[v];
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
      <svg width="64" height="64" className="-rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#ffffff12" strokeWidth="6" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={meta.color} strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - total / 100)} />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-lg font-bold leading-none text-white">{total}</div>
        <div className="text-[8px] text-slate-500">Relevanz</div>
      </div>
    </div>
  );
}

function VerdictBadge({ total }: { total: number }) {
  const m = VERDICT_META[verdictOf(total)];
  return (
    <span className="chip font-bold" style={{ color: m.color, backgroundColor: `${m.color}1e` }}>
      {m.emoji} {m.label}
    </span>
  );
}

function SubBars({ item }: { item: NewsItem }) {
  return (
    <div className="space-y-1.5">
      {SUB_META.map((s) => (
        <div key={s.key} className="flex items-center gap-2" title={s.hint}>
          <span className="w-28 shrink-0 text-[10px] text-slate-500">{s.label}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full" style={{ width: `${item.subs[s.key]}%`, backgroundColor: s.color }} />
          </div>
          <span className="w-6 shrink-0 text-right text-[10px] tabular-nums text-slate-400">{item.subs[s.key]}</span>
        </div>
      ))}
    </div>
  );
}

function FreshnessTag({ item }: { item: NewsItem }) {
  const f = freshness(item.category, item.publishedAgoHours);
  const label = f > 0.66 ? 'Zeitfenster: hoch' : f > 0.33 ? 'Zeitfenster: mittel' : 'Zeitfenster: gering';
  const color = f > 0.66 ? '#12D99A' : f > 0.33 ? '#F7C14B' : '#FF5A5A';
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium" style={{ color }} title="Wie lange die Meldung noch frisch genug für ein Video ist">
      <Clock size={11} /> {label}
    </span>
  );
}

function HeroNews({ item, total, onScript }: { item: NewsItem & { total: number }; total: number; onScript: () => void }) {
  const cm = CAT_META[item.category];
  return (
    <Card className="relative overflow-hidden p-5 sm:p-6">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="relative">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="chip font-semibold" style={{ color: cm.color, backgroundColor: `${cm.color}1e` }}>{cm.label}</span>
          <span className="chip bg-brand-500/15 text-brand-300"><Zap size={12} /> Top-Empfehlung heute</span>
          <VerdictBadge total={total} />
          <span className="text-xs text-slate-500">{item.source} · {agoLabel(item.publishedAgoHours)}</span>
        </div>
        <div className="flex flex-col gap-5 lg:flex-row">
          <div className="flex-1">
            <h2 className="font-display text-xl font-bold text-white sm:text-2xl">{item.headline}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.summary}</p>
            <div className="mt-3 rounded-xl border border-brand-500/20 bg-brand-500/[0.06] p-3">
              <span className="stat-label text-brand-300">Sofort-Hook für Mr Real</span>
              <p className="mt-0.5 text-sm italic leading-relaxed text-brand-100">{item.hook}</p>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button onClick={onScript} className="btn-primary"><FileText size={15} /> Skript daraus</button>
              {item.url && (
                <a href={item.url} target="_blank" rel="noreferrer" className="btn-ghost"><ExternalLink size={15} /> Quelle</a>
              )}
              <FreshnessTag item={item} />
            </div>
          </div>
          <div className="flex items-center gap-4 lg:w-64 lg:flex-col lg:items-stretch">
            <RelevanceRing total={total} />
            <div className="flex-1 lg:mt-1">
              <SubBars item={item} />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function NewsCard({ item, total, onScript }: { item: NewsItem; total: number; onScript: () => void }) {
  const cm = CAT_META[item.category];
  return (
    <Card hover className="flex flex-col p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="chip font-semibold" style={{ color: cm.color, backgroundColor: `${cm.color}1e` }}>{cm.label}</span>
        <VerdictBadge total={total} />
      </div>

      <div className="flex items-start gap-3">
        <RelevanceRing total={total} />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold leading-snug text-white">{item.headline}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500">
            <span>{item.source}</span>
            <span>· {agoLabel(item.publishedAgoHours)}</span>
            <FreshnessTag item={item} />
          </div>
        </div>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-slate-400 line-clamp-2">{item.summary}</p>

      <div className="mt-3">
        <SubBars item={item} />
      </div>

      <div className="mt-3 flex-1 rounded-lg border border-brand-500/15 bg-brand-500/[0.05] p-2.5">
        <span className="stat-label text-brand-300">Hook</span>
        <p className="mt-0.5 text-sm italic leading-relaxed text-brand-100">{item.hook}</p>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button onClick={onScript} className="btn-primary flex-1"><FileText size={15} /> Skript daraus</button>
        {item.url && (
          <a href={item.url} target="_blank" rel="noreferrer" className="btn-ghost" title="Original-Artikel öffnen"><ExternalLink size={15} /> Quelle</a>
        )}
      </div>
    </Card>
  );
}

function Chip({ active, onClick, children, color }: { active: boolean; onClick: () => void; children: React.ReactNode; color?: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${active ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'}`}
      style={active && color ? { color, backgroundColor: `${color}20` } : undefined}
    >
      {children}
    </button>
  );
}
