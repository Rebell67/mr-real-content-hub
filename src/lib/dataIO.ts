import type { DailyMetric, HubData, Platform } from '../types';
import { PLATFORMS } from '../types';

// ---------------------------------------------------------------------------
// Import / export helpers. Lets Mr Real drop in a CSV or JSON export from
// Metricool (or a native platform) and immediately see it in the hub.
// ---------------------------------------------------------------------------

export interface ImportResult {
  ok: boolean;
  message: string;
  metrics?: DailyMetric[];
}

const REQUIRED_COLUMNS = ['date', 'platform', 'followers', 'impressions'];

/** Minimal, dependency-free CSV parser (handles quoted fields & commas). */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',' || c === ';') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c !== '\r') {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((v) => v.trim() !== ''));
}

function normalisePlatform(raw: string): Platform | null {
  const v = raw.trim().toLowerCase();
  const map: Record<string, Platform> = {
    instagram: 'instagram',
    ig: 'instagram',
    tiktok: 'tiktok',
    tt: 'tiktok',
    youtube: 'youtube',
    'youtube shorts': 'youtube',
    yt: 'youtube',
    facebook: 'facebook',
    fb: 'facebook',
  };
  return map[v] ?? (PLATFORMS.includes(v as Platform) ? (v as Platform) : null);
}

export function importCSV(text: string): ImportResult {
  const rows = parseCSV(text);
  if (rows.length < 2) {
    return { ok: false, message: 'CSV enthält keine Datenzeilen.' };
  }
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const missing = REQUIRED_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length) {
    return {
      ok: false,
      message: `Fehlende Spalten: ${missing.join(', ')}. Erwartet: ${REQUIRED_COLUMNS.join(', ')}, reach, engagements, profileViews.`,
    };
  }
  const col = (name: string) => header.indexOf(name);
  const metrics: DailyMetric[] = [];
  const byPlatform = new Map<Platform, DailyMetric[]>();

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const platform = normalisePlatform(r[col('platform')] ?? '');
    const date = (r[col('date')] ?? '').trim().slice(0, 10);
    if (!platform || !date) continue;
    const num = (name: string) => {
      const idx = col(name);
      const v = idx >= 0 ? Number((r[idx] ?? '').replace(/[^\d.-]/g, '')) : 0;
      return Number.isFinite(v) ? v : 0;
    };
    const metric: DailyMetric = {
      date,
      platform,
      followers: num('followers'),
      followerChange: 0,
      impressions: num('impressions'),
      reach: num('reach') || Math.round(num('impressions') * 0.65),
      profileViews: num('profileviews'),
      engagements: num('engagements'),
    };
    metrics.push(metric);
    byPlatform.set(platform, [...(byPlatform.get(platform) ?? []), metric]);
  }

  // Derive followerChange per platform from consecutive follower counts.
  for (const group of byPlatform.values()) {
    group.sort((a, b) => a.date.localeCompare(b.date));
    for (let i = 0; i < group.length; i++) {
      group[i].followerChange = i === 0 ? 0 : group[i].followers - group[i - 1].followers;
    }
  }

  if (metrics.length === 0) {
    return { ok: false, message: 'Keine gültigen Zeilen erkannt (Plattform/Datum prüfen).' };
  }
  return { ok: true, message: `${metrics.length} Datenpunkte importiert.`, metrics };
}

export function importJSON(text: string): ImportResult {
  try {
    const data = JSON.parse(text);
    const arr: DailyMetric[] = Array.isArray(data) ? data : data.dailyMetrics;
    if (!Array.isArray(arr)) {
      return { ok: false, message: 'JSON muss ein Array von Metriken oder ein HubData-Objekt sein.' };
    }
    const metrics = arr.filter((m) => m && normalisePlatform(m.platform) && m.date);
    if (!metrics.length) return { ok: false, message: 'Keine gültigen Metriken im JSON gefunden.' };
    return { ok: true, message: `${metrics.length} Datenpunkte importiert.`, metrics };
  } catch (e) {
    return { ok: false, message: `Ungültiges JSON: ${(e as Error).message}` };
  }
}

/** Serialise the current hub data to a downloadable JSON blob. */
export function exportJSON(data: HubData): string {
  return JSON.stringify(data, null, 2);
}

/** Serialise daily metrics to CSV. */
export function exportCSV(metrics: DailyMetric[]): string {
  const header = ['date', 'platform', 'followers', 'followerChange', 'impressions', 'reach', 'profileViews', 'engagements'];
  const lines = [header.join(',')];
  for (const m of metrics) {
    lines.push(
      [m.date, m.platform, m.followers, m.followerChange, m.impressions, m.reach, m.profileViews, m.engagements].join(','),
    );
  }
  return lines.join('\n');
}

export function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Sample CSV shown in the import UI so users know the expected shape. */
export const SAMPLE_CSV = `date,platform,followers,impressions,reach,engagements,profileViews
2026-07-10,instagram,4210,28400,18900,1520,410
2026-07-10,tiktok,3180,41200,26100,2890,0
2026-07-11,instagram,4231,31100,20400,1610,455`;
