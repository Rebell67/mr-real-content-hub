import { useMemo, useState } from 'react';
import { FileText, Repeat, Zap, Users, Clapperboard, Sparkles } from 'lucide-react';
import { Topbar } from '../components/layout/Topbar';
import { Card, PlatformBadge } from '../components/ui/primitives';
import { ScriptModal } from '../components/ScriptModal';
import { SIGNATURE_FORMATS } from '../data/signatureFormats';
import type { ContentIdea, SignatureFormat } from '../types';

type Filter = 'all' | 'series' | 'viral';

// Wandelt ein Signature-Format in eine Idee für den Skript-Generator.
function sigToIdea(f: SignatureFormat): ContentIdea {
  return {
    id: `sig-${f.id}`,
    title: f.name,
    hook: f.hook,
    format: f.format,
    angle: f.entertain,
    rationale: `${f.followTrigger} · Umsetzung: ${f.howTo}`,
    effort: f.effort,
    potential: f.potential,
    suggestedPlatforms: f.platforms,
  };
}

export function Signature() {
  const [filter, setFilter] = useState<Filter>('all');
  const [scriptIdea, setScriptIdea] = useState<ContentIdea | null>(null);

  const list = useMemo(() => {
    if (filter === 'series') return SIGNATURE_FORMATS.filter((f) => f.series);
    if (filter === 'viral') return SIGNATURE_FORMATS.filter((f) => f.potential === 'viral');
    return SIGNATURE_FORMATS;
  }, [filter]);

  return (
    <>
      <Topbar
        title="Signature-Formate"
        subtitle="Deine Viral-Waffen als Wiener Makler – zum Herausstechen, Unterhalten & Follower gewinnen"
      />
      <div className="space-y-6 p-5 sm:p-8">
        {/* Strategie-Hinweis */}
        <div className="flex items-start gap-2 rounded-xl border border-brand-500/25 bg-brand-500/[0.06] p-3 text-sm text-brand-100">
          <Sparkles size={16} className="mt-0.5 shrink-0 text-brand-300" />
          <span>
            In Österreich macht das fast niemand – dein Vorteil. Diese Formate sind auf{' '}
            <strong className="text-white">Reichweite &amp; Follower</strong> gebaut: Sie unterhalten, bleiben hängen und
            geben Zuschauern einen Grund, dir zu folgen. Wenig Aufwand, nur Handy + eine deiner Listings. Leads kommen
            später von selbst – erst wird die Reichweite aufgebaut.
          </span>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5 rounded-xl border border-white/[0.06] bg-ink-800/60 p-1">
            {([
              ['all', 'Alle'],
              ['viral', 'Viral-Potenzial'],
              ['series', 'Als Serie'],
            ] as [Filter, string][]).map(([f, label]) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  filter === f ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-500">
            <Repeat size={11} className="mb-0.5 mr-1 inline" />
            Serie = feste Reihe → baut eine Zuschauer-Gewohnheit auf
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((f) => (
            <SignatureCard key={f.id} f={f} onScript={() => setScriptIdea(sigToIdea(f))} />
          ))}
        </div>
      </div>

      {scriptIdea && <ScriptModal idea={scriptIdea} onClose={() => setScriptIdea(null)} />}
    </>
  );
}

function SignatureCard({ f, onScript }: { f: SignatureFormat; onScript: () => void }) {
  const viral = f.potential === 'viral';
  return (
    <Card hover className="flex flex-col p-4">
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
          <span className="stat-label flex items-center gap-1 text-slate-400">
            <Zap size={11} /> Warum es zündet
          </span>
          <p className="mt-0.5 text-slate-300">{f.entertain}</p>
        </div>
        <div>
          <span className="stat-label flex items-center gap-1 text-brand-300">
            <Users size={11} /> Warum es Follower bringt
          </span>
          <p className="mt-0.5 text-slate-300">{f.followTrigger}</p>
        </div>
      </div>

      <div className="mt-3 flex-1 rounded-lg border border-tiktok/20 bg-tiktok/[0.06] p-2.5">
        <span className="stat-label flex items-center gap-1 text-tiktok">
          <Clapperboard size={12} /> So drehst du's
        </span>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-300">{f.howTo}</p>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button onClick={onScript} className="btn-primary flex-1">
          <FileText size={15} /> Skript daraus
        </button>
        <div className="flex items-center gap-1">
          {f.platforms.slice(0, 2).map((p) => (
            <PlatformBadge key={p} platform={p} size="sm" />
          ))}
        </div>
      </div>
    </Card>
  );
}
