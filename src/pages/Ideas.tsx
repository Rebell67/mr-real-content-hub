import { useState } from 'react';
import { Sparkles, Wand2, FileText } from 'lucide-react';
import { Topbar } from '../components/layout/Topbar';
import { Card, PlatformBadge } from '../components/ui/primitives';
import { CONTENT_FORMATS, FORMAT_MAP } from '../data/formats';
import { CONTENT_IDEAS } from '../data/ideas';
import { ScriptModal } from '../components/ScriptModal';
import type { ContentFormatId, ContentIdea, Platform } from '../types';

const POTENTIAL_STYLE: Record<string, { label: string; color: string }> = {
  viral: { label: 'Viral-Potenzial', color: '#FF5A5A' },
  high: { label: 'Hohes Potenzial', color: '#12D99A' },
  medium: { label: 'Solide', color: '#22D3EE' },
};
const EFFORT_LABEL: Record<string, string> = { low: 'Geringer Aufwand', medium: 'Mittel', high: 'Hoch' };

// Simple template bank for the idea generator (client-side, no API needed).
const TOPICS = ['Eigenkapital', 'Zinsen', 'Vorsorgewohnung', 'Miete vs. Kauf', 'Nebenkosten', 'Besichtigung', 'Wertsteigerung', 'Erstwohnung', 'Immobilien-Mythen', 'Standort Wien vs. Land'];
const HOOK_TEMPLATES: Record<ContentFormatId, string[]> = {
  'hot-take': ['Unpopuläre Meinung: {topic} wird komplett falsch verstanden.', 'Wer bei {topic} noch so denkt, verliert Geld.', '{topic}? Der größte Irrtum unserer Generation.'],
  explainer: ['{topic} in 45 Sekunden erklärt – ohne Fachchinesisch.', 'So funktioniert {topic} wirklich (mit Rechnung).', 'Das musst du über {topic} wissen, bevor du unterschreibst.'],
  'myth-buster': ['Der größte Mythos über {topic} – und die Wahrheit.', '"{topic}" – was alle glauben vs. was stimmt.', '3 Lügen über {topic}, die dich Geld kosten.'],
  story: ['Wie {topic} mir einen Deal gerettet hat.', 'Mein größter Fehler bei {topic}.', 'Was mir ein Kunde über {topic} beigebracht hat.'],
  'market-update': ['{topic} 2026: Was sich gerade wirklich ändert.', 'Neue Zahlen zu {topic} – und was du jetzt tun solltest.', '{topic}: Der Trend, den alle übersehen.'],
  'behind-the-scenes': ['Live bei einer Besichtigung: {topic} entlarvt.', 'So prüfe ich {topic} vor Ort.', 'Ein Tag als Makler: {topic} in echt.'],
  'property-breakdown': ['Dieses Objekt und {topic}: lohnt es sich?', '{topic} an einem echten Objekt durchgerechnet.', 'Kaufen oder Finger weg? {topic}-Check.'],
};

export function Ideas() {
  const [filter, setFilter] = useState<ContentFormatId | 'all'>('all');
  const [generated, setGenerated] = useState<ContentIdea[]>([]);
  const [scriptIdea, setScriptIdea] = useState<ContentIdea | null>(null);

  const ideas = filter === 'all' ? CONTENT_IDEAS : CONTENT_IDEAS.filter((i) => i.format === filter);

  const generate = () => {
    const formats = CONTENT_FORMATS;
    const picks: ContentIdea[] = [];
    for (let i = 0; i < 3; i++) {
      const fmt = formats[Math.floor(Math.random() * formats.length)];
      const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
      const templates = HOOK_TEMPLATES[fmt.id];
      const hook = templates[Math.floor(Math.random() * templates.length)].replace('{topic}', topic);
      const potentials: ContentIdea['potential'][] = ['medium', 'high', 'viral'];
      const platforms: Platform[] = fmt.id === 'market-update' || fmt.id === 'property-breakdown' ? ['instagram', 'youtube'] : ['tiktok', 'instagram'];
      picks.push({
        id: `gen-${Date.now()}-${i}`,
        title: `${topic} – ${fmt.name}`,
        hook,
        format: fmt.id,
        angle: fmt.description,
        rationale: `Automatisch generiert aus Format „${fmt.name}" × Thema „${topic}". ${fmt.purpose}`,
        effort: fmt.id === 'property-breakdown' ? 'high' : 'low',
        potential: potentials[Math.floor(Math.random() * potentials.length)],
        suggestedPlatforms: platforms,
      });
    }
    setGenerated(picks);
  };

  return (
    <>
      <Topbar title="Ideen & Formate" subtitle="Die Content-Engine hinter Mr Real" />
      <div className="space-y-8 p-5 sm:p-8">
        {/* Formats */}
        <section>
          <div className="mb-4">
            <h2 className="section-title">Wiederkehrende Formate</h2>
            <p className="mt-0.5 text-sm text-slate-400">Wiedererkennbare Formate schlagen Zufalls-Content. Das ist dein Wachstums-Gerüst.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {CONTENT_FORMATS.map((f) => (
              <Card key={f.id} hover className="p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-2xl">{f.emoji}</span>
                  <span className="chip" style={{ color: f.color, backgroundColor: `${f.color}18` }}>{f.cadence}</span>
                </div>
                <h3 className="font-display text-base font-semibold text-white">{f.name}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">{f.description}</p>
                <div className="mt-3 rounded-lg border border-white/[0.05] bg-ink-850/50 p-2.5">
                  <span className="stat-label">Strategischer Zweck</span>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-300">{f.purpose}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Idea generator */}
        <section>
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Wand2 size={18} className="text-brand-300" />
                <div>
                  <h2 className="section-title">Ideen-Generator</h2>
                  <p className="text-sm text-slate-400">Kombiniert deine Formate mit relevanten Themen zu neuen Hooks.</p>
                </div>
              </div>
              <button onClick={generate} className="btn-primary">
                <Sparkles size={16} /> 3 Ideen erzeugen
              </button>
            </div>
            {generated.length > 0 && (
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {generated.map((idea) => <IdeaCard key={idea.id} idea={idea} generated onScript={setScriptIdea} />)}
              </div>
            )}
          </Card>
        </section>

        {/* Idea bank */}
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="section-title">Ideen-Pool</h2>
              <p className="mt-0.5 text-sm text-slate-400">Kuratiert auf deine Positionierung – bereit für die Pipeline.</p>
            </div>
            <div className="flex flex-wrap gap-1.5 rounded-xl border border-white/[0.06] bg-ink-800/60 p-1">
              <FormatFilter active={filter === 'all'} onClick={() => setFilter('all')}>Alle</FormatFilter>
              {CONTENT_FORMATS.map((f) => (
                <FormatFilter key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)} color={f.color}>
                  {f.emoji}
                </FormatFilter>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ideas.map((idea) => <IdeaCard key={idea.id} idea={idea} onScript={setScriptIdea} />)}
          </div>
        </section>
      </div>

      {scriptIdea && <ScriptModal idea={scriptIdea} onClose={() => setScriptIdea(null)} />}
    </>
  );
}

function IdeaCard({ idea, generated, onScript }: { idea: ContentIdea; generated?: boolean; onScript: (idea: ContentIdea) => void }) {
  const fmt = FORMAT_MAP[idea.format];
  const pot = POTENTIAL_STYLE[idea.potential];
  return (
    <Card hover className={`flex flex-col p-4 ${generated ? 'ring-1 ring-brand-500/20' : ''}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="chip" style={{ color: fmt?.color, backgroundColor: `${fmt?.color}18` }}>{fmt?.emoji} {fmt?.name}</span>
        <span className="chip font-semibold" style={{ color: pot.color, backgroundColor: `${pot.color}18` }}>{pot.label}</span>
      </div>
      <h3 className="text-sm font-semibold text-white">{idea.title}</h3>
      <p className="mt-1 rounded-lg bg-ink-850/60 px-2.5 py-2 text-sm italic leading-relaxed text-slate-200">„{idea.hook}"</p>
      <p className="mt-2 flex-1 text-xs leading-relaxed text-slate-400">{idea.rationale}</p>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-1">
          {idea.suggestedPlatforms.map((p) => <PlatformBadge key={p} platform={p} />)}
        </div>
        <span className="text-[10px] text-slate-500">{EFFORT_LABEL[idea.effort]}</span>
      </div>
      <button onClick={() => onScript(idea)} className="btn-primary mt-3 w-full">
        <FileText size={15} /> Skript erstellen
      </button>
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
