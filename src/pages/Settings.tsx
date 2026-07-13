import { useRef, useState } from 'react';
import { Database, KeyRound, Upload, Download, CheckCircle2, AlertTriangle, FileJson, Plug, Flame, Mic, RotateCcw } from 'lucide-react';
import { useHub } from '../state/HubContext';
import { Topbar } from '../components/layout/Topbar';
import { Card } from '../components/ui/primitives';
import { PLATFORM_META, PLATFORMS } from '../types';
import { importCSV, importJSON, exportJSON, exportCSV, downloadFile, SAMPLE_CSV, type ImportResult } from '../lib/dataIO';
import { DEFAULT_STYLE, loadStyle, saveStyle, type Dialect, type StyleProfile } from '../lib/styleProfile';

export function Settings() {
  const { sourceId, setSource, metricoolConfig, saveMetricoolConfig, applyImportedMetrics, data, lastSync } = useHub();
  const [cfg, setCfg] = useState({
    apiToken: metricoolConfig?.apiToken ?? '',
    userId: metricoolConfig?.userId ?? '',
    blogId: metricoolConfig?.blogId ?? '',
  });
  const [savedMsg, setSavedMsg] = useState(false);
  const [importMsg, setImportMsg] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const text = await file.text();
    const result = file.name.endsWith('.json') ? importJSON(text) : importCSV(text);
    setImportMsg(result);
    if (result.ok && result.metrics) applyImportedMetrics(result.metrics);
  };

  const saveMetricool = () => {
    saveMetricoolConfig({ ...cfg, baseUrl: 'https://app.metricool.com/api' });
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  return (
    <>
      <Topbar title="Daten & Setup" subtitle="Datenquellen, API-Integration und Import" />
      <div className="mx-auto max-w-4xl space-y-6 p-5 sm:p-8">
        {/* Source selector */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Database size={18} className="text-brand-300" />
            <h2 className="section-title">Aktive Datenquelle</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SourceCard active={sourceId === 'real'} onClick={() => setSource('real')} title="Echte Daten" desc="Mr-Real-Snapshot aus Metricool (13.04.–11.07.)." icon={<Database size={18} />} badge="live-abzug" />
            <SourceCard active={sourceId === 'mock'} onClick={() => setSource('mock')} title="Demo-Daten" desc="Beispieldaten zum Ausprobieren." icon={<FileJson size={18} />} />
            <SourceCard active={sourceId === 'metricool'} onClick={() => setSource('metricool')} title="Metricool API" desc="Automatischer Abruf. Token erforderlich." icon={<Plug size={18} />} badge={metricoolConfig ? 'konfiguriert' : 'offen'} />
            <SourceCard active={sourceId === 'import'} onClick={() => fileRef.current?.click()} title="CSV / JSON Import" desc="Eigene Exporte hochladen." icon={<Upload size={18} />} />
          </div>
          {lastSync && <p className="mt-3 text-xs text-slate-500">Zuletzt synchronisiert: {new Date(lastSync).toLocaleString('de-AT')}</p>}
        </Card>

        {/* Style / voice */}
        <StyleCard />

        {/* Metricool config */}
        <Card className="p-5">
          <div className="mb-1 flex items-center gap-2">
            <KeyRound size={18} className="text-gold-400" />
            <h2 className="section-title">Metricool-Verbindung</h2>
          </div>
          <p className="mb-4 text-sm text-slate-400">
            Hinterlege Token & Brand-ID. Die Abruf-Schicht ist bereits vorbereitet – sobald ein gültiger Token vorliegt, werden Instagram, TikTok, YouTube & Facebook automatisch normalisiert geladen.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="API Token" value={cfg.apiToken} onChange={(v) => setCfg({ ...cfg, apiToken: v })} placeholder="mc_xxx…" type="password" />
            <Field label="User ID" value={cfg.userId} onChange={(v) => setCfg({ ...cfg, userId: v })} placeholder="123456" />
            <Field label="Brand / Blog ID" value={cfg.blogId} onChange={(v) => setCfg({ ...cfg, blogId: v })} placeholder="987654" />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button onClick={saveMetricool} className="btn-primary" disabled={!cfg.apiToken || !cfg.blogId}>Verbindung speichern</button>
            {savedMsg && <span className="flex items-center gap-1.5 text-sm text-brand-300"><CheckCircle2 size={15} /> Gespeichert</span>}
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-tiktok/20 bg-tiktok/[0.06] p-3 text-xs text-slate-300">
            <AlertTriangle size={15} className="mt-0.5 shrink-0 text-tiktok" />
            <span>Hinweis: Der Token wird nur lokal im Browser (localStorage) gespeichert. Für Produktion sollte der Abruf über ein Backend/Proxy laufen, damit der Token nicht im Client liegt.</span>
          </div>
        </Card>

        {/* Import / Export */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Upload size={18} className="text-tiktok" />
            <h2 className="section-title">Import & Export</h2>
          </div>

          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/[0.1] bg-ink-850/40 py-8 text-center transition-colors hover:border-brand-500/40 hover:bg-brand-500/[0.04]"
          >
            <Upload size={22} className="text-slate-500" />
            <p className="text-sm font-medium text-slate-300">CSV oder JSON hierher ziehen oder klicken</p>
            <p className="text-xs text-slate-500">Erwartete Spalten: date, platform, followers, impressions, reach, engagements</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.json"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
          />

          {importMsg && (
            <div className={`mt-3 flex items-center gap-2 rounded-xl border p-3 text-sm ${importMsg.ok ? 'border-brand-500/25 bg-brand-500/[0.06] text-brand-200' : 'border-youtube/25 bg-youtube/[0.06] text-youtube'}`}>
              {importMsg.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              {importMsg.message}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={() => data && downloadFile('mrreal-hubdata.json', exportJSON(data), 'application/json')} className="btn-ghost" disabled={!data}>
              <Download size={16} /> JSON exportieren
            </button>
            <button onClick={() => data && downloadFile('mrreal-metrics.csv', exportCSV(data.dailyMetrics), 'text/csv')} className="btn-ghost" disabled={!data}>
              <Download size={16} /> CSV exportieren
            </button>
            <button onClick={() => downloadFile('mrreal-vorlage.csv', SAMPLE_CSV, 'text/csv')} className="btn-ghost">
              <FileJson size={16} /> CSV-Vorlage laden
            </button>
          </div>
        </Card>

        {/* Trend source */}
        <Card className="p-5">
          <div className="mb-1 flex items-center gap-2">
            <Flame size={18} className="text-youtube" />
            <h2 className="section-title">Trend- & Outlier-Quelle</h2>
          </div>
          <p className="text-sm text-slate-400">
            Für echte, live gezogene Outlier-Videos von Instagram & TikTok wird eine <span className="font-semibold text-slate-200">kostenpflichtige</span> Trend-Quelle benötigt – es gibt keine kostenlose offizielle Schnittstelle dafür.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {['EnsembleData', 'Apify (Scraper)', 'RapidAPI'].map((p) => (
              <div key={p} className="rounded-lg border border-white/[0.06] bg-ink-850/40 px-3 py-2 text-center text-xs font-medium text-slate-300">{p}</div>
            ))}
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-tiktok/20 bg-tiktok/[0.06] p-3 text-xs text-slate-300">
            <AlertTriangle size={15} className="mt-0.5 shrink-0 text-tiktok" />
            <span>
              Ohne Quelle zeigt die App kuratierte <span className="font-semibold">Demo-Trends</span> (Muster deiner Nische). Zum Aktivieren <code className="rounded bg-white/10 px-1">TRENDS_PROVIDER_URL</code> und <code className="rounded bg-white/10 px-1">TRENDS_API_KEY</code> in Vercel hinterlegen (Details in <code className="rounded bg-white/10 px-1">.env.example</code>).
            </span>
          </div>
        </Card>

        {/* Connected platforms overview */}
        <Card className="p-5">
          <h2 className="section-title mb-4">Verknüpfte Kanäle</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {PLATFORMS.map((p) => {
              const meta = PLATFORM_META[p];
              const connected = Boolean(data?.dailyMetrics.some((m) => m.platform === p));
              return (
                <div key={p} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-ink-850/40 p-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg font-bold" style={{ backgroundColor: `${meta.color}1e`, color: meta.color }}>
                      {meta.short}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-white">{meta.label}</div>
                      <div className="text-xs text-slate-500">{meta.handle}</div>
                    </div>
                  </div>
                  <span className={`chip ${connected ? 'bg-brand-500/15 text-brand-300' : 'bg-white/[0.04] text-slate-500'}`}>
                    {connected ? 'Daten aktiv' : 'keine Daten'}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}

const DIALECTS: { id: Dialect; label: string }[] = [
  { id: 'hochdeutsch', label: 'Hochdeutsch' },
  { id: 'leicht-oesterreichisch', label: 'Leicht österreichisch' },
  { id: 'oesterreichisch', label: 'Österreichisch' },
];

function StyleCard() {
  const [style, setStyle] = useState<StyleProfile>(() => loadStyle());
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof StyleProfile>(key: K, value: StyleProfile[K]) => {
    setStyle((s) => ({ ...s, [key]: value }));
    setSaved(false);
  };
  const setLines = (key: 'catchphrases' | 'avoid' | 'examples', text: string) =>
    set(key, text.split('\n').map((l) => l.trim()).filter(Boolean));

  const save = () => {
    saveStyle(style);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };
  const reset = () => {
    setStyle(DEFAULT_STYLE);
    saveStyle(DEFAULT_STYLE);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <Card className="p-5">
      <div className="mb-1 flex items-center gap-2">
        <Mic size={18} className="text-brand-300" />
        <h2 className="section-title">Mein Stil (Voice)</h2>
      </div>
      <p className="mb-4 text-sm text-slate-400">
        Danach klingen deine Skripte. Der KI-Generator bekommt dieses Profil als Vorlage – je konkreter, desto mehr klingt es nach dir. Tipp: Bei „Beispiel-Zeilen" echte Sätze aus deinen besten Videos einfügen.
      </p>

      <div className="space-y-4">
        <label className="block">
          <span className="stat-label">Ton & Haltung</span>
          <textarea
            value={style.tone}
            onChange={(e) => set('tone', e.target.value)}
            rows={3}
            className="mt-1 w-full resize-y rounded-xl border border-white/[0.08] bg-ink-850/60 px-3 py-2.5 text-sm text-white focus:border-brand-500/40 focus:outline-none"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="stat-label">Sprache / Dialekt</span>
            <div className="mt-1 flex gap-1.5 rounded-xl border border-white/[0.08] bg-ink-850/60 p-1">
              {DIALECTS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => set('dialect', d.id)}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-all ${style.dialect === d.id ? 'bg-brand-500/20 text-brand-200' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </label>
          <label className="block">
            <span className="stat-label">Signatur / Abschluss (CTA-Ton)</span>
            <input
              value={style.signature}
              onChange={(e) => set('signature', e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/[0.08] bg-ink-850/60 px-3 py-2.5 text-sm text-white focus:border-brand-500/40 focus:outline-none"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="stat-label">Typische Wendungen (eine pro Zeile)</span>
            <textarea
              value={style.catchphrases.join('\n')}
              onChange={(e) => setLines('catchphrases', e.target.value)}
              rows={3}
              className="mt-1 w-full resize-y rounded-xl border border-white/[0.08] bg-ink-850/60 px-3 py-2.5 text-sm text-white focus:border-brand-500/40 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="stat-label">Vermeiden (eine pro Zeile)</span>
            <textarea
              value={style.avoid.join('\n')}
              onChange={(e) => setLines('avoid', e.target.value)}
              rows={3}
              className="mt-1 w-full resize-y rounded-xl border border-white/[0.08] bg-ink-850/60 px-3 py-2.5 text-sm text-white focus:border-brand-500/40 focus:outline-none"
            />
          </label>
        </div>

        <label className="block">
          <span className="stat-label">Beispiel-Zeilen in deiner Stimme (eine pro Zeile)</span>
          <textarea
            value={style.examples.join('\n')}
            onChange={(e) => setLines('examples', e.target.value)}
            rows={4}
            className="mt-1 w-full resize-y rounded-xl border border-white/[0.08] bg-ink-850/60 px-3 py-2.5 text-sm text-white focus:border-brand-500/40 focus:outline-none"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button onClick={save} className="btn-primary">Stil speichern</button>
        <button onClick={reset} className="btn-ghost"><RotateCcw size={15} /> Zurücksetzen</button>
        {saved && <span className="flex items-center gap-1.5 text-sm text-brand-300"><CheckCircle2 size={15} /> Gespeichert</span>}
      </div>
    </Card>
  );
}

function SourceCard({ active, onClick, title, desc, icon, badge }: { active: boolean; onClick: () => void; title: string; desc: string; icon: React.ReactNode; badge?: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition-all ${active ? 'border-brand-500/50 bg-brand-500/[0.08] ring-1 ring-brand-500/30' : 'border-white/[0.08] bg-ink-850/40 hover:border-white/20'}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className={active ? 'text-brand-300' : 'text-slate-400'}>{icon}</span>
        {badge && <span className="chip bg-white/[0.06] text-[10px] text-slate-400">{badge}</span>}
        {active && !badge && <span className="chip bg-brand-500/15 text-[10px] text-brand-300">aktiv</span>}
      </div>
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="mt-0.5 text-xs text-slate-500">{desc}</div>
    </button>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      <span className="stat-label">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-white/[0.08] bg-ink-850/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-brand-500/40 focus:outline-none"
      />
    </label>
  );
}
