import { useMemo, useState } from 'react';
import { CalendarDays, Columns3 } from 'lucide-react';
import { useHub } from '../state/HubContext';
import { Topbar } from '../components/layout/Topbar';
import { LoadingScreen } from '../components/ui/StatTile';
import { Card, PlatformBadge } from '../components/ui/primitives';
import { FORMAT_MAP } from '../data/formats';
import type { Post, PostStatus } from '../types';
import { formatDate } from '../lib/format';

const PIPELINE: { status: PostStatus; label: string; color: string }[] = [
  { status: 'idea', label: 'Idee', color: '#94A3B8' },
  { status: 'scripting', label: 'Skript', color: '#F7C14B' },
  { status: 'filming', label: 'Dreh', color: '#EFA92B' },
  { status: 'editing', label: 'Schnitt', color: '#22D3EE' },
  { status: 'scheduled', label: 'Geplant', color: '#12D99A' },
];

const STATUS_FLOW: PostStatus[] = ['idea', 'scripting', 'filming', 'editing', 'scheduled', 'published'];

export function Planner() {
  const { data, loading, updatePost } = useHub();
  const [tab, setTab] = useState<'board' | 'calendar'>('board');

  if (loading || !data) return <><Topbar title="Redaktionsplan" /><LoadingScreen /></>;

  const advance = (post: Post) => {
    const idx = STATUS_FLOW.indexOf(post.status);
    if (idx < STATUS_FLOW.length - 1) updatePost({ ...post, status: STATUS_FLOW[idx + 1] });
  };

  const pipelineCount = data.posts.filter((p) => p.status !== 'published').length;

  return (
    <>
      <Topbar title="Redaktionsplan" subtitle={`${pipelineCount} Inhalte in der Pipeline`} />
      <div className="space-y-6 p-5 sm:p-8">
        <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-ink-800/60 p-1 w-fit">
          <TabButton active={tab === 'board'} onClick={() => setTab('board')} icon={<Columns3 size={15} />}>Pipeline</TabButton>
          <TabButton active={tab === 'calendar'} onClick={() => setTab('calendar')} icon={<CalendarDays size={15} />}>Kalender</TabButton>
        </div>

        {tab === 'board' ? (
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
            {PIPELINE.map((col) => {
              const posts = data.posts.filter((p) => p.status === col.status);
              return (
                <div key={col.status} className="flex flex-col">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-semibold text-white">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                      {col.label}
                    </span>
                    <span className="text-xs text-slate-500">{posts.length}</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {posts.map((p) => (
                      <PipelineCard key={p.id} post={p} onAdvance={() => advance(p)} />
                    ))}
                    {posts.length === 0 && (
                      <div className="rounded-xl border border-dashed border-white/[0.08] py-6 text-center text-xs text-slate-600">leer</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <CalendarView posts={data.posts} />
        )}
      </div>
    </>
  );
}

function PipelineCard({ post, onAdvance }: { post: Post; onAdvance: () => void }) {
  const fmt = FORMAT_MAP[post.format];
  return (
    <Card hover className="p-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs text-slate-500">
        <span>{fmt?.emoji}</span>
        <span>{fmt?.name}</span>
      </div>
      <p className="text-sm font-semibold leading-snug text-white">{post.title}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400">{post.hook}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {post.platforms.map((pl) => <PlatformBadge key={pl} platform={pl} />)}
      </div>
      <button
        onClick={onAdvance}
        className="mt-3 w-full rounded-lg border border-white/[0.08] bg-white/[0.02] py-1.5 text-xs font-semibold text-slate-300 transition-all hover:border-brand-500/40 hover:bg-brand-500/10 hover:text-brand-300"
      >
        Weiterschieben →
      </button>
    </Card>
  );
}

function CalendarView({ posts }: { posts: Post[] }) {
  // Build a rolling 4-week grid around today.
  const today = new Date('2026-07-12T00:00:00Z');
  const start = new Date(today);
  start.setDate(start.getDate() - start.getDay() + 1 - 7); // Monday of previous week

  const weeks = useMemo(() => {
    const cells: Date[] = [];
    for (let i = 0; i < 28; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      cells.push(d);
    }
    const grouped: Date[][] = [];
    for (let i = 0; i < cells.length; i += 7) grouped.push(cells.slice(i, i + 7));
    return grouped;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const postsByDate = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const p of posts) map.set(p.date, [...(map.get(p.date) ?? []), p]);
    return map;
  }, [posts]);

  const todayIso = today.toISOString().slice(0, 10);

  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-500">
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="space-y-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-2">
            {week.map((d) => {
              const iso = d.toISOString().slice(0, 10);
              const dayPosts = postsByDate.get(iso) ?? [];
              const isToday = iso === todayIso;
              return (
                <div
                  key={iso}
                  className={`min-h-[84px] rounded-xl border p-2 ${
                    isToday ? 'border-brand-500/40 bg-brand-500/[0.06]' : 'border-white/[0.05] bg-ink-850/40'
                  }`}
                >
                  <div className={`mb-1 text-[11px] font-semibold ${isToday ? 'text-brand-300' : 'text-slate-500'}`}>
                    {d.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayPosts.map((p) => {
                      const fmt = FORMAT_MAP[p.format];
                      const published = p.status === 'published';
                      return (
                        <div
                          key={p.id}
                          className="truncate rounded-md px-1.5 py-1 text-[10px] font-medium"
                          style={{
                            backgroundColor: published ? '#ffffff0a' : `${fmt?.color}1e`,
                            color: published ? '#94A3B8' : fmt?.color,
                          }}
                          title={p.title}
                        >
                          {fmt?.emoji} {p.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-400" />Geplant</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-500" />Veröffentlicht</span>
        <span className="ml-auto">{formatDate(todayIso)} · heute</span>
      </div>
    </Card>
  );
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${
        active ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
