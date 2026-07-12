import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { DailyMetric, HubData, Post } from '../types';
import { MockDataService } from '../services/MockDataService';
import { MetricoolService, type MetricoolConfig } from '../services/MetricoolService';
import type { DataService } from '../services/DataService';

type SourceId = 'mock' | 'metricool' | 'import';

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

function buildService(sourceId: SourceId, metricoolConfig: MetricoolConfig | null): DataService {
  if (sourceId === 'metricool') return new MetricoolService(metricoolConfig);
  return new MockDataService();
}

export function HubProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<HubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [sourceId, setSourceId] = useState<SourceId>(
    () => (localStorage.getItem(LS_SOURCE) as SourceId) || 'mock',
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
    // "import" is a client-side overlay – only auto-load real sources.
    if (sourceId !== 'import') load(sourceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reload = useCallback(() => load(sourceId === 'import' ? 'mock' : sourceId), [load, sourceId]);

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
      const base = prev ?? { generatedAt: new Date().toISOString(), dailyMetrics: [], posts: [], goals: [], postingWindows: [] };
      return { ...base, generatedAt: new Date().toISOString(), dailyMetrics: metrics };
    });
    setSourceId('import');
    localStorage.setItem(LS_SOURCE, 'import');
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
