import { useMemo, useState } from 'react';
import { Search, MessageCircle, Share2, Bookmark, UserPlus, X } from 'lucide-react';
import { useHub } from '../state/HubContext';
import { Topbar } from '../components/layout/Topbar';
import { LoadingScreen } from '../components/ui/StatTile';
import { Card, PlatformBadge, EmptyState } from '../components/ui/primitives';
import { FORMAT_MAP, CONTENT_FORMATS } from '../data/formats';
import type { Post } from '../types';
import { compact, full, pct, formatDate } from '../lib/format';

type SortKey = 'date' | 'impressions' | 'engagement' | 'follows';

export function Library() {
  const { data, loading } = useHub();
  const [query, setQuery] = useState('');
  const [format, setFormat] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'pipeline'>('all');
  const [sort, setSort] = useState<SortKey>('date');
  const [selected, setSelected] = useState<Post | null>(null);

  const posts = useMemo(() => {
    if (!data) return [];
    let list = data.posts.slice();
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q) || p.hook.toLowerCase().includes(q) || p.tags.some((t) => t.includes(q)));
    }
    if (format !== 'all') list = list.filter((p) => p.format === format);
    if (statusFilter === 'published') list = list.filter((p) => p.status === 'published');
    if (statusFilter === 'pipeline') list = list.filter((p) => p.status !== 'published');

    const eng = (p: Post) => (p.metrics ? p.metrics.likes + p.metrics.comments + p.metrics.shares + p.metrics.saves : 0);
    list.sort((a, b) => {
      switch (sort) {
        case 'impressions': return (b.metrics?.impressions ?? 0) - (a.metrics?.impressions ?? 0);
        case 'engagement': return eng(b) - eng(a);
        case 'follows': return (b.metrics?.followsFromPost ?? 0) - (a.metrics?.followsFromPost ?? 0);
        default: return b.date.localeCompare(a.date);
      }
    });
    return list;
  }, [data, query, format, statusFilter, sort]);

  if (loading || !data) return <><Topbar title="Bibliothek" /><LoadingScreen /></>;

  return (
    <>
      <Topbar title="Bibliothek" subtitle={`${data.posts.length} Inhalte im Archiv`} />
      <div className="space-y-5 p-5 sm:p-8">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Titel, Hook oder Tag suchen…"
              className="w-full rounded-xl border border-white/[0.08] bg-ink-800/60 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-500/40 focus:outline-none"
            />
          </div>
          <select value={format} onChange={(e) => setFormat(e.target.value)} className="select">
            <option value="all">Alle Formate</option>
            {CONTENT_FORMATS.map((f) => <option key={f.id} value={f.id}>{f.emoji} {f.name}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="select">
            <option value="all">Alle Status</option>
            <option value="published">Veröffentlicht</option>
            <option value="pipeline">In Pipeline</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="select">
            <option value="date">Neueste zuerst</option>
            <option value="impressions">Impressionen</option>
            <option value="engagement">Engagement</option>
            <option value="follows">Follows / Post</option>
          </select>
        </div>

        {posts.length === 0 ? (
          <Card className="p-6"><EmptyState title="Keine Inhalte gefunden" hint="Passe Suche oder Filter an." /></Card>
        ) : (
          <div className="grid gap-3">
            {posts.map((p) => (
              <button key={p.id} onClick={() => setSelected(p)} className="text-left">
                <Card hover className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl" style={{ backgroundColor: `${FORMAT_MAP[p.format]?.color}18` }}>
                    {FORMAT_MAP[p.format]?.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-white">{p.title}</p>
                      {p.status !== 'published' && <span className="chip bg-gold-400/15 text-gold-300">{statusLabel(p.status)}</span>}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-slate-500">{p.hook}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-slate-500">{formatDate(p.date)}</span>
                      {p.platforms.map((pl) => <PlatformBadge key={pl} platform={pl} />)}
                    </div>
                  </div>
                  {p.metrics && (
                    <div className="flex shrink-0 gap-5 sm:gap-6">
                      <Metric label="Impressionen" value={compact(p.metrics.impressions)} />
                      <Metric label="Engagement" value={pct((p.metrics.likes + p.metrics.comments + p.metrics.shares + p.metrics.saves) / (p.metrics.impressions || 1))} />
                      <Metric label="Follows" value={`+${full(p.metrics.followsFromPost)}`} accent />
                    </div>
                  )}
                </Card>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && <PostDetail post={selected} onClose={() => setSelected(null)} />}

      <style>{`.select{background:rgba(20,25,34,.6);border:1px solid rgba(255,255,255,.08);border-radius:.75rem;padding:.6rem .75rem;font-size:.8rem;color:#e2e8f0;outline:none}.select:focus{border-color:rgba(0,195,137,.4)}`}</style>
    </>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="text-right">
      <div className={`font-display text-sm font-bold tabular-nums ${accent ? 'text-brand-300' : 'text-white'}`}>{value}</div>
      <div className="text-[10px] text-slate-500">{label}</div>
    </div>
  );
}

function PostDetail({ post, onClose }: { post: Post; onClose: () => void }) {
  const fmt = FORMAT_MAP[post.format];
  const m = post.metrics;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div className="w-full max-w-lg animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <Card className="max-h-[85vh] overflow-y-auto p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="chip" style={{ color: fmt?.color, backgroundColor: `${fmt?.color}18` }}>{fmt?.emoji} {fmt?.name}</span>
              <span className="text-xs text-slate-500">{formatDate(post.date)}</span>
            </div>
            <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"><X size={18} /></button>
          </div>

          <h2 className="font-display text-xl font-bold text-white">{post.title}</h2>
          <div className="mt-3 rounded-xl bg-ink-850/60 p-3">
            <span className="stat-label">Hook</span>
            <p className="mt-1 text-sm italic text-slate-200">„{post.hook}"</p>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.platforms.map((pl) => <PlatformBadge key={pl} platform={pl} size="md" />)}
            {post.tags.map((t) => <span key={t} className="chip bg-white/[0.04] text-slate-400">#{t}</span>)}
          </div>

          {m ? (
            <>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <BigMetric label="Impressionen" value={full(m.impressions)} />
                <BigMetric label="Reichweite" value={full(m.reach)} />
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                <SmallMetric icon={<MessageCircle size={14} />} label="Kommentare" value={full(m.comments)} />
                <SmallMetric icon={<Share2 size={14} />} label="Shares" value={full(m.shares)} />
                <SmallMetric icon={<Bookmark size={14} />} label="Saves" value={full(m.saves)} />
                <SmallMetric icon={<UserPlus size={14} />} label="Follows" value={`+${full(m.followsFromPost)}`} />
              </div>
              {m.completionRate != null && (
                <div className="mt-3 flex items-center justify-between rounded-xl border border-white/[0.06] bg-ink-850/40 px-3 py-2 text-sm">
                  <span className="text-slate-400">Ø Wiedergabe-Rate</span>
                  <span className="font-semibold text-white">{pct(m.completionRate)} · {m.avgWatchTimeSec}s</span>
                </div>
              )}
            </>
          ) : (
            <div className="mt-5 rounded-xl border border-gold-400/20 bg-gold-400/[0.06] p-3 text-sm text-gold-200">
              Status: <span className="font-semibold">{statusLabel(post.status)}</span> – noch keine Performance-Daten.
            </div>
          )}

          {post.notes && (
            <div className="mt-4 rounded-xl border border-white/[0.06] bg-ink-850/40 p-3">
              <span className="stat-label">Notiz / Learning</span>
              <p className="mt-1 text-sm leading-relaxed text-slate-300">{post.notes}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function BigMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-ink-850/40 p-3">
      <div className="stat-label">{label}</div>
      <div className="mt-0.5 font-display text-xl font-bold text-white">{value}</div>
    </div>
  );
}

function SmallMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.05] bg-ink-850/40 p-2 text-center">
      <div className="mx-auto mb-1 w-fit text-slate-500">{icon}</div>
      <div className="text-sm font-bold text-white">{value}</div>
      <div className="text-[9px] text-slate-500">{label}</div>
    </div>
  );
}

function statusLabel(s: Post['status']): string {
  return { idea: 'Idee', scripting: 'Skript', filming: 'Dreh', editing: 'Schnitt', scheduled: 'Geplant', published: 'Veröffentlicht' }[s];
}
