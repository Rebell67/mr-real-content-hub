import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { DailyMetric, HubData, Post } from '../types';
import { MockDataService } from '../services/MockDataService';
import { MetricoolService, type MetricoolConfig } from '../services/MetricoolService';
import { RealDataService } from '../services/RealDataService';
import type { DataService } from '../services/DataService';
import { generateHubData } from '../data/mockData';

type SourceId = 'real' | 'mock' | 'metricool' | 'import';

interface HubState {
  data: HubData | null;
  loading: boolean;
  error: string | null;
  sourceId: SourceId;
  lastSync: string | null;
  metricoolConfig: MetricoolConfig | null;
  reload: () => void;
  setSource: (id: SourceId) => void;
  saveMetricoolConfig: (cfg: MetricoolConfig) => void;
  applyImportedMetrics: (metrics: DailyMetric[]) => void;
  updatePost: (post: Post) => void;
}

const HubContext = createContext<HubState | null>(null);

const LS_SOURCE = 'mrreal.source';
const LS_METRICOOL = 'mrreal.metricool';
const LS_IMPORT = 'mrreal.importedMetrics';

function buildService(sourceId: SourceId, metricoolConfig: MetricoolConfig | null): DataService {
  if (sourceId === 'metricool') return new MetricoolService(metricoolConfig);
  if (sourceId === 'mock') return new MockDataService();
  return new RealDataService();
}

export function HubProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<HubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [sourceId, setSourceId] = useState<SourceId>(
    () => (localStorage.getItem(LS_SOURCE) as SourceId) || 'real',
  );
  const [metricoolConfig, setMetricoolConfig] = useState<MetricoolConfig | null>(() => {
    const raw = localStorage.getItem(LS_METRICOOL);
    return raw ? (JSON.parse(raw) as MetricoolConfig) : null;
  });

  const load = useCallback(
    async (id: SourceId) => {
      setLoading(true);
      setError(null);
      try {
        const service = buildService(id, metricoolConfig);
        const result = await service.fetchHubData();
        setData(result);
        setLastSync(new Date().toISOString());
      } catch (e) {
        setError((e as Error).message);
        // Fall back to mock so the app is never empty.
        try {
          setData(await new MockDataService().fetchHubData());
        } catch {
          /* ignore */
        }
      } finally {
        setLoading(false);
      }
    },
    [metricoolConfig],
  );

  useEffect(() => {
    // Imported data is persisted in localStorage so it survives closing the
    // app (important for the local single-file usage). Rehydrate it here;
    // otherwise fall back to the regular sources.
    if (sourceId === 'import') {
      const stored = localStorage.getItem(LS_IMPORT);
      if (stored) {
        try {
          const metrics = JSON.parse(stored) as DailyMetric[];
          const scaffold = generateHubData();
          setData({ ...scaffold, dailyMetrics: metrics, generatedAt: new Date().toISOString() });
          setLastSync(new Date().toISOString());
          setLoading(false);
          return;
        } catch {
          /* corrupt store – fall back to mock */
        }
      }
      load('real');
      return;
    }
    load(sourceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reload = useCallback(() => load(sourceId === 'import' ? 'real' : sourceId), [load, sourceId]);

  const setSource = useCallback(
    (id: SourceId) => {
      setSourceId(id);
      localStorage.setItem(LS_SOURCE, id);
      if (id !== 'import') load(id);
    },
    [load],
  );

  const saveMetricoolConfig = useCallback((cfg: MetricoolConfig) => {
    setMetricoolConfig(cfg);
    localStorage.setItem(LS_METRICOOL, JSON.stringify(cfg));
  }, []);

  const applyImportedMetrics = useCallback((metrics: DailyMetric[]) => {
    setData((prev) => {
      // Keep posts/goals/posting windows – only the account metrics change.
      const base = prev ?? generateHubData();
      return { ...base, generatedAt: new Date().toISOString(), dailyMetrics: metrics };
    });
    setSourceId('import');
    localStorage.setItem(LS_SOURCE, 'import');
    try {
      localStorage.setItem(LS_IMPORT, JSON.stringify(metrics));
    } catch {
      /* storage quota exceeded – data still lives for this session */
    }
    setLastSync(new Date().toISOString());
    setError(null);
  }, []);

  const updatePost = useCallback((post: Post) => {
    setData((prev) => {
      if (!prev) return prev;
      return { ...prev, posts: prev.posts.map((p) => (p.id === post.id ? post : p)) };
    });
  }, []);

  const value = useMemo<HubState>(
    () => ({
      data,
      loading,
      error,
      sourceId,
      lastSync,
      metricoolConfig,
      reload,
      setSource,
      saveMetricoolConfig,
      applyImportedMetrics,
      updatePost,
    }),
    [data, loading, error, sourceId, lastSync, metricoolConfig, reload, setSource, saveMetricoolConfig, applyImportedMetrics, updatePost],
  );

  return <HubContext.Provider value={value}>{children}</HubContext.Provider>;
}

export function useHub(): HubState {
  const ctx = useContext(HubContext);
  if (!ctx) throw new Error('useHub must be used within HubProvider');
  return ctx;
}
