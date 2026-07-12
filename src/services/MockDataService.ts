import type { HubData } from '../types';
import { generateHubData } from '../data/mockData';
import type { DataService } from './DataService';

// Default data source: fully deterministic demo data. Lets the whole app be
// explored end-to-end with zero configuration.
export class MockDataService implements DataService {
  readonly id = 'mock';
  readonly label = 'Demo-Daten';

  isConfigured(): boolean {
    return true;
  }

  async fetchHubData(): Promise<HubData> {
    // Simulate a tiny bit of latency so loading states are exercised.
    await new Promise((r) => setTimeout(r, 250));
    return generateHubData();
  }
}
