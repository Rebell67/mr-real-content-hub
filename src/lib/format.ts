// Compact, locale-aware number formatting (German).
const nfCompact = new Intl.NumberFormat('de-AT', { notation: 'compact', maximumFractionDigits: 1 });
const nfFull = new Intl.NumberFormat('de-AT');

export function compact(n: number): string {
  if (!Number.isFinite(n)) return '–';
  return nfCompact.format(n);
}

export function full(n: number): string {
  if (!Number.isFinite(n)) return '–';
  return nfFull.format(Math.round(n));
}

// Always-short number for chart axes & gauges (independent of ICU compact
// support, which is patchy for the thousands range in some runtimes).
export function axisNum(n: number): string {
  if (!Number.isFinite(n)) return '';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',').replace(',0', '')} Mio.`;
  if (abs >= 1_000) return `${Math.round(n / 1000)}k`;
  return String(Math.round(n));
}

export function pct(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return '–';
  return `${(n * 100).toFixed(digits)}%`;
}

export function signed(n: number): string {
  const s = full(Math.abs(n));
  return n >= 0 ? `+${s}` : `−${s}`;
}

export function formatDate(iso: string): string {
  return new Date(iso + (iso.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('de-AT', {
    day: '2-digit',
    month: 'short',
  });
}

export function formatDateLong(iso: string): string {
  return new Date(iso + (iso.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('de-AT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}
