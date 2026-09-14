import { useMemo, useState } from 'react';
import { Sparkles, FileText, Plus, Trash2, Pin, Inbox, Check } from 'lucide-react';
import { Topbar } from '../components/layout/Topbar';
import { Card, PlatformBadge } from '../components/ui/primitives';
import { CONTENT_FORMATS, FORMAT_MAP } from '../data/formats';
import { CONTENT_IDEAS } from '../data/ideas';
import { ScriptModal } from '../components/ScriptModal';
import { ideaStore, formatStore, generateIdeas, ideaToFormat, newId } from '../lib/contentStore';
import type { ContentFormatId, ContentIdea, Platform } from '../types';

const POTENTIAL_STYLE: Record<string, { label: string; color: string }> = {
  viral: { label: 'Viral-Potenzial', color: '#FF5A5A' },
  high: { label: 'Hohes Potenzial', color: '#12D99A' },
  medium: { label: 'Solide', color: '#22D3EE' },
};
const EFFORT_LABEL: Record<string, string> = { low: 'Geringer Aufwand', medium: 'Mittel', high: 'Hoch' };

export function Ideas() {
  const [extras, setExtras] = useState<ContentIdea[]>(() => ideaStore.extras());
  const [hidden, setHidden] = useState<string[]>(() => ideaStore.hidden());
  const [filter, setFilter] = useState<ContentFormatId | 'all'>('all');
  const [scriptIdea, setScriptIdea] = useState<ContentIdea | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftHook, setDraftHook] = useState('');
  const [draftFormat, setDraftFormat] = useState<ContentFormatId>('hot-take');
  const [pinned, setPinned] = useState<string | null>(null); // id der zuletzt übernommenen Idee

  const list = useMemo(() => {
    const merged = [...extras, ...CONTENT_IDEAS.filter((i) => !hidden.includes(i.id))];
    return filter === 'all' ? merged : merged.filter((i) => i.format === filter);
  }, [extras, hidden, filter]);

  const persistExtras = (v: ContentIdea[]) => { setExtras(v); ideaStore.saveExtras(v); };
  const persistHidden = (v: string[]) => { setHidden(v); ideaStore.saveHidden(v); };

  const addOwn = () => {
    const t = draftTitle.trim();
    if (!t) return;
    const idea: ContentIdea = {
      id: newId('idea'),
      title: t,
      hook: draftHook.trim() || t,
      format: draftFormat,
      angle: 'Eigene Idee',
      rationale: 'Selbst reingebrainstormt.',
      effort: 'low',
      potential: 'high',
      suggestedPlatforms: ['instagram', 'tiktok'],
    };
    persistExtras([idea, ...extras]);
    setDraftTitle(''); setDraftHook('');
  };

  const generate = () => persistExtras([...generateIdeas(3), ...extras]);

  const remove = (idea: ContentIdea) => {
    if (extras.some((e) => e.id === idea.id)) persistExtras(extras.filter((e) => e.id !== idea.id));
    else persistHidden([...hidden, idea.id]);
  };

  const pinToFormat = (idea: ContentIdea) => {
    const current = formatStore.extras();
    formatStore.saveExtras([ideaToFormat(idea), ...current]);
    setPinned(idea.id);
    setTimeout(() => setPinned((p) => (p === idea.id ? null : p)), 2000);
  };

  return (
    <>
      <Topbar title="Ideen-Inbox" subtitle="Dein roher Kreativ-Speicher – wirf eigene Ideen rein & generiere neue" />
      <div className="space-y-6 p-5 sm:p-8">
        {/* Eigene Idee reinbrainstormen */}
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Inbox size={18} className="text-brand-300" />
            <h2 className="section-title">Eigene Idee reinwerfen</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addOwn()}
              placeholder="Titel / Idee in einem Satz…"
              className="rounded-lg border border-white/[0.08] bg-ink-850/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand-500/40 focus:outline-none"
            />
            <input
              value={draftHook}
              onChange={(e) => setDraftHook(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addOwn()}
              placeholder="Hook (optional)…"
              className="rounded-lg border border-white/[0.08] bg-ink-850/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand-500/40 focus:outline-none"
            />
            <div className="flex gap-2">
              <select
                value={draftFormat}
                onChange={(e) => setDraftFormat(e.target.value as ContentFormatId)}
                className="rounded-lg border border-white/[0.08] bg-ink-850/60 px-2 py-2 text-sm text-slate-200 focus:outline-none"
              >
                {CONTENT_FORMATS.map((f) => (
                  <option key={f.id} value={f.id}>{f.emoji} {f.name}</option>
                ))}
              </select>
              <button onClick={addOwn} className="btn-primary whitespace-nowrap"><Plus size={16} /> Rein</button>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-xs text-slate-500">Ideen bleiben im Browser gespeichert.</span>
            <button onClick={generate} className="btn-ghost"><Sparkles size={15} /> 3 Ideen generieren</button>
          </div>
        </Card>

        {/* Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5 rounded-xl border border-white/[0.06] bg-ink-800/60 p-1">
            <FormatFilter active={filter === 'all'} onClick={() => setFilter('all')}>Alle</FormatFilter>
            {CONTENT_FORMATS.map((f) => (
              <FormatFilter key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)} color={f.color}>
                {f.emoji}
              </FormatFilter>
            ))}
          </div>
          <span className="text-xs text-slate-500">{list.length} Ideen</span>
        </div>

        {/* Ideen-Grid */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              pinned={pinned === idea.id}
              onScript={setScriptIdea}
              onPin={() => pinToFormat(idea)}
              onRemove={() => remove(idea)}
            />
          ))}
        </div>
      </div>

      {scriptIdea && <ScriptModal idea={scriptIdea} onClose={() => setScriptIdea(null)} />}
    </>
  );
}

function IdeaCard({
  idea, pinned, onScript, onPin, onRemove,
}: {
  idea: ContentIdea; pinned: boolean; onScript: (idea: ContentIdea) => void; onPin: () => void; onRemove: () => void;
}) {
  const fmt = FORMAT_MAP[idea.format];
  const pot = POTENTIAL_STYLE[idea.potential];
  return (
    <Card hover className="flex flex-col p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="chip" style={{ color: fmt?.color, backgroundColor: `${fmt?.color}18` }}>{fmt?.emoji} {fmt?.name}</span>
        <span className="chip font-semibold" style={{ color: pot.color, backgroundColor: `${pot.color}18` }}>{pot.label}</span>
      </div>
      <h3 className="text-sm font-semibold text-white">{idea.title}</h3>
      <p className="mt-1 rounded-lg bg-ink-850/60 px-2.5 py-2 text-sm italic leading-relaxed text-slate-200">„{idea.hook}"</p>
      <p className="mt-2 flex-1 text-xs leading-relaxed text-slate-400">{idea.rationale}</p>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-1">
          {idea.suggestedPlatforms.map((p: Platform) => <PlatformBadge key={p} platform={p} />)}
        </div>
        <span className="text-[10px] text-slate-500">{EFFORT_LABEL[idea.effort]}</span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button onClick={() => onScript(idea)} className="btn-primary flex-1"><FileText size={15} /> Skript</button>
        <button
          onClick={onPin}
          className={`btn-ghost ${pinned ? 'text-brand-300' : ''}`}
          title="In Formate übernehmen"
        >
          {pinned ? <><Check size={15} /> Drin</> : <><Pin size={15} /> Formate</>}
        </button>
        <button onClick={onRemove} className="btn-ghost text-slate-400 hover:text-youtube" title="Idee löschen">
          <Trash2 size={15} />
        </button>
      </div>
    </Card>
  );
}

function FormatFilter({ active, onClick, children, color }: { active: boolean; onClick: () => void; children: React.ReactNode; color?: string }) {
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
