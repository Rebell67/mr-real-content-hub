import type { HubData } from '../types';

// ---------------------------------------------------------------------------
// The single seam through which ALL data enters the app. Swap the concrete
// implementation (mock, Metricool API, CSV import) without touching the UI.
// ---------------------------------------------------------------------------
export interface DataService {
  readonly id: string;
  readonly label: string;
  /** True when this source is actually configured & reachable. */
  isConfigured(): boolean;
  /** Load a full normalised snapshot of hub data. */
  fetchHubData(): Promise<HubData>;
}

export interface DataServiceStatus {
  id: string;
  label: string;
  configured: boolean;
  lastSync: string | null;
}
