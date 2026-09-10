import { RefreshCw, Circle, Zap } from 'lucide-react';
import { useHub } from '../../state/HubContext';

const SOURCE_LABEL: Record<string, string> = {
  real: 'Echte Daten (09.09.)',
  mock: 'Demo-Daten',
  metricool: 'Metricool',
  import: 'Import (CSV/JSON)',
};

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { loading, reload, sourceId, lastSync, error } = useHub();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-white/[0.06] bg-ink-900/80 px-5 py-4 backdrop-blur-md sm:px-8">
      <div className="min-w-0">
        <h1 className="truncate font-display text-xl font-semibold text-white sm:text-2xl">{title}</h1>
        {subtitle && <p className="truncate text-sm text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-xl border border-white/[0.06] bg-ink-800/60 px-3 py-2 sm:flex">
          <Circle
            size={8}
            className={error ? 'fill-youtube text-youtube' : 'fill-brand-400 text-brand-400'}
          />
          <div className="leading-tight">
            <div className="text-xs font-semibold text-slate-200">{SOURCE_LABEL[sourceId] ?? sourceId}</div>
            <div className="text-[10px] text-slate-500">
              {error ? 'Fehler – Demo aktiv' : lastSync ? `Sync ${new Date(lastSync).toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })}` : 'Nicht synchronisiert'}
            </div>
          </div>
        </div>

        <button onClick={reload} disabled={loading} className="btn-ghost" title="Daten neu laden">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Sync</span>
        </button>

        <button className="btn-primary hidden md:inline-flex" title="Schnell-Aktion">
          <Zap size={16} />
          Neuer Post
        </button>
      </div>
    </header>
  );
}
