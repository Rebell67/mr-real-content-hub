import { useCallback, useEffect, useState } from 'react';
import { X, Copy, Check, RefreshCw, Download, Sparkles, Loader2 } from 'lucide-react';
import type { ContentIdea } from '../types';
import { FORMAT_MAP } from '../data/formats';
import { scriptToText, type Script } from '../lib/scriptGenerator';
import { requestScript, type ScriptSource } from '../services/scriptService';
import { downloadFile } from '../lib/dataIO';

const SECTION_COLOR: Record<string, string> = {
  Hook: '#F7C14B',
  Lead: '#12D99A',
  'Body 1': '#22D3EE',
  'Open Loop 1': '#5B8DEF',
  'Body 2': '#22D3EE',
  'Open Loop 2': '#5B8DEF',
  'Body 3': '#22D3EE',
  CTA: '#00C389',
};

export function ScriptModal({ idea, onClose }: { idea: ContentIdea; onClose: () => void }) {
  const [script, setScript] = useState<Script | null>(null);
  const [source, setSource] = useState<ScriptSource>('template');
  const [note, setNote] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const fmt = FORMAT_MAP[idea.format];

  const load = useCallback(async () => {
    setLoading(true);
    setCopied(false);
    const result = await requestScript(idea);
    setScript(result.script);
    setSource(result.source);
    setNote(result.note);
    setLoading(false);
  }, [idea]);

  useEffect(() => {
    load();
  }, [load]);

  const copyAll = async () => {
    if (!script) return;
    try {
      await navigator.clipboard.writeText(scriptToText(script));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked (e.g. offline file) – ignore */
    }
  };

  const download = () => {
    if (!script) return;
    const safe = script.title.replace(/[^\wäöüÄÖÜß -]/g, '').slice(0, 40).trim() || 'skript';
    downloadFile(`Skript – ${safe}.txt`, scriptToText(script), 'text/plain');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div className="w-full max-w-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="card flex max-h-[90vh] flex-col">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] p-5">
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="chip" style={{ color: fmt?.color, backgroundColor: `${fmt?.color}18` }}>{fmt?.emoji} {fmt?.name}</span>
                <span className="text-xs text-slate-500">{script?.totalSeconds ?? '≈ 45–60 Sek.'}</span>
                <span className={`chip font-semibold ${source === 'ai' ? 'bg-brand-500/15 text-brand-300' : 'bg-white/[0.06] text-slate-400'}`}>
                  {source === 'ai' ? <><Sparkles size={11} /> Von Claude geschrieben</> : 'Vorlage'}
                </span>
              </div>
              <h2 className="font-display text-lg font-bold text-white">{idea.title}</h2>
              <p className="text-xs text-slate-500">Schema: Hook · Lead · Body · Open Loop · CTA – pass es an deine Stimme an</p>
            </div>
            <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"><X size={18} /></button>
          </div>

          {/* Sections */}
          <div className="flex-1 space-y-2.5 overflow-y-auto p-5">
            {loading || !script ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <Loader2 size={28} className="animate-spin text-brand-300" />
                <p className="text-sm text-slate-400">Skript wird erstellt…</p>
              </div>
            ) : (
              script.sections.map((s) => (
                <div key={s.key} className="rounded-xl border border-white/[0.05] bg-ink-850/40 p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide" style={{ color: SECTION_COLOR[s.label] ?? '#12D99A' }}>
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SECTION_COLOR[s.label] ?? '#12D99A' }} />
                      {s.label}
                    </span>
                    <span className="text-[10px] text-slate-600">{s.seconds} · {s.hint}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-100">{s.text}</p>
                </div>
              ))
            )}
            {note && !loading && <p className="px-1 pt-1 text-[11px] text-slate-500">{note}</p>}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 border-t border-white/[0.06] p-4">
            <button onClick={load} disabled={loading} className="btn-ghost">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Neue Variante
            </button>
            <button onClick={copyAll} disabled={loading} className="btn-ghost">
              {copied ? <><Check size={16} className="text-brand-300" /> Kopiert</> : <><Copy size={16} /> Kopieren</>}
            </button>
            <button onClick={download} disabled={loading} className="btn-ghost">
              <Download size={16} /> Als .txt
            </button>
            <span className="ml-auto hidden text-xs text-slate-500 sm:inline">Tipp: Hook laut vorlesen – zieht er dich rein?</span>
          </div>
        </div>
      </div>
    </div>
  );
}
