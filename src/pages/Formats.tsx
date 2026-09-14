import { useMemo, useState } from 'react';
import { FileText, Repeat, Zap, Users, Clapperboard, Sparkles, Pin, PinOff, Trash2 } from 'lucide-react';
import { Topbar } from '../components/layout/Topbar';
import { Card, PlatformBadge } from '../components/ui/primitives';
import { ScriptModal } from '../components/ScriptModal';
import { FORMAT_SEEDS } from '../data/formatBank';
import { formatStore, generateFormat, formatToIdea } from '../lib/contentStore';
import type { ContentIdea, SignatureFormat } from '../types';

type Filter = 'all' | 'pinned' | 'viral';

export function Formats() {
  const [extras, setExtras] = useState<SignatureFormat[]>(() => formatStore.extras());
  const [hidden, setHidden] = useState<string[]>(() => formatStore.hidden());
  const [pinned, setPinned] = useState<string[]>(() => formatStore.pinned());
  const [filter, setFilter] = useState<Filter>('all');
  const [scriptIdea, setScriptIdea] = useState<ContentIdea | null>(null);

  const persistExtras = (v: SignatureFormat[]) => { setExtras(v); formatStore.saveExtras(v); };
  const persistHidden = (v: string[]) => { setHidden(v); formatStore.saveHidden(v); };
  const persistPinned = (v: string[]) => { setPinned(v); formatStore.savePinned(v); };

  const list = useMemo(() => {
    const merged = [...extras, ...FORMAT_SEEDS].filter((f) => !hidden.includes(f.id));
    const filtered =
      filter === 'pinned' ? merged.filter((f) => pinned.includes(f.id))
      : filter === 'viral' ? merged.filter((f) => f.potential === 'viral')
      : merged;
    // Angepinnte immer zuerst.
    return [...filtered].sort((a, b) => Number(pinned.includes(b.id)) - Number(pinned.includes(a.id)));
  }, [extras, hidden, pinned, filter]);

  const togglePin = (id: string) =>
    persistPinned(pinned.includes(id) ? pinned.filter((p) => p !== id) : [id, ...pinned]);

  const remove = (f: SignatureFormat) => {
    if (extras.some((e) => e.id === f.id)) persistExtras(extras.filter((e) => e.id !== f.id));
    else persistHidden([...hidden, f.id]);
    if (pinned.includes(f.id)) persistPinned(pinned.filter((p) => p !== f.id));
  };

  const generate = () => persistExtras([generateFormat(), ...extras]);

  return (
    <>
      <Topbar title="Formate" subtitle="Deine besten Viral-Waffen – anpinnen, löschen, neue generieren" />
      <div className="space-y-6 p-5 sm:p-8">
        {/* Strategie-Hinweis */}
        <div className="flex items-start gap-2 rounded-xl border border-brand-500/25 bg-brand-500/[0.06] p-3 text-sm text-brand-100">
          <Sparkles size={16} className="mt-0.5 shrink-0 text-brand-300" />
          <span>
            In Österreich macht das fast niemand – dein Vorteil. Diese Formate sind auf{' '}
            <strong className="text-white">Reichweite &amp; Follower</strong> gebaut: unterhalten, hängenbleiben, Grund
            zum Folgen geben. Wenig Aufwand, nur Handy + eine deiner Listings. Pinne deine Favoriten,{' '}
            lösch, was nicht passt, und <strong className="text-white">generiere neue</strong> dazu.
          </span>
        </div>

        {/* Steuerung */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1.5 rounded-xl border border-white/[0.06] bg-ink-800/60 p-1">
            {([['all', 'Alle'], ['pinned', 'Angepinnt'], ['viral', 'Viral-Potenzial']] as [Filter, string][]).map(([f, label]) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${filter === f ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <button onClick={generate} className="btn-primary"><Sparkles size={16} /> Neues Format generieren</button>
        </div>

        {list.length === 0 ? (
          <div className="rounded-xl border border-white/[0.06] bg-ink-800/40 p-10 text-center text-sm text-slate-400">
            Keine Formate in dieser Ansicht. Pinne welche an oder generiere ein neues.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {list.map((f) => (
              <FormatCard
                key={f.id}
                f={f}
                pinned={pinned.includes(f.id)}
                onScript={() => setScriptIdea(formatToIdea(f))}
                onPin={() => togglePin(f.id)}
                onRemove={() => remove(f)}
              />
            ))}
          </div>
        )}
      </div>

      {scriptIdea && <ScriptModal idea={scriptIdea} onClose={() => setScriptIdea(null)} />}
    </>
  );
}

function FormatCard({
  f, pinned, onScript, onPin, onRemove,
}: {
  f: SignatureFormat; pinned: boolean; onScript: () => void; onPin: () => void; onRemove: () => void;
}) {
  const viral = f.potential === 'viral';
  return (
    <Card hover className={`flex flex-col p-4 ${pinned ? 'ring-1 ring-brand-500/40' : ''}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-2xl leading-none">{f.emoji}</span>
        <div className="flex items-center gap-1.5">
          {f.series && (
            <span className="chip font-bold text-tiktok" style={{ backgroundColor: '#22D3EE18' }}>
              <Repeat size={11} /> Serie
            </span>
          )}
          <span
            className="chip font-bold"
            style={{ color: viral ? '#FF5A5A' : '#12D99A', backgroundColor: viral ? '#FF5A5A18' : '#12D99A18' }}
          >
            <Zap size={12} /> {viral ? 'Viral' : 'Hoch'}
          </span>
        </div>
      </div>

      <h3 className="font-display text-base font-bold leading-snug text-white">{f.name}</h3>
      <p className="mt-1.5 text-sm font-semibold leading-snug text-brand-100">„{f.hook}"</p>

      <div className="mt-3 space-y-2 text-xs leading-relaxed">
        <div>
          <span className="stat-label flex items-center gap-1 text-slate-400"><Zap size={11} /> Warum es zündet</span>
          <p className="mt-0.5 text-slate-300">{f.entertain}</p>
        </div>
        <div>
          <span className="stat-label flex items-center gap-1 text-brand-300"><Users size={11} /> Warum es Follower bringt</span>
          <p className="mt-0.5 text-slate-300">{f.followTrigger}</p>
        </div>
      </div>

      <div className="mt-3 flex-1 rounded-lg border border-tiktok/20 bg-tiktok/[0.06] p-2.5">
        <span className="stat-label flex items-center gap-1 text-tiktok"><Clapperboard size={12} /> So drehst du's</span>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-300">{f.howTo}</p>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button onClick={onScript} className="btn-primary flex-1"><FileText size={15} /> Skript daraus</button>
        <button onClick={onPin} className={`btn-ghost ${pinned ? 'text-brand-300' : ''}`} title={pinned ? 'Lösen' : 'Anpinnen'}>
          {pinned ? <PinOff size={15} /> : <Pin size={15} />}
        </button>
        <button onClick={onRemove} className="btn-ghost text-slate-400 hover:text-youtube" title="Format löschen">
          <Trash2 size={15} />
        </button>
      </div>

      <div className="mt-2 flex items-center gap-1">
        {f.platforms.slice(0, 3).map((p) => <PlatformBadge key={p} platform={p} size="sm" />)}
      </div>
    </Card>
  );
}
