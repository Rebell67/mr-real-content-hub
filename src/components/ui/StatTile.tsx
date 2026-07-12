import type { ReactNode } from 'react';
import { Delta, Sparkline } from './primitives';
import { compact, pct } from '../../lib/format';

export function StatTile({
  label,
  value,
  format = 'int',
  delta,
  spark,
  color = '#12D99A',
  icon,
}: {
  label: string;
  value: number;
  format?: 'int' | 'pct';
  delta?: number;
  spark?: number[];
  color?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="card card-hover animate-fade-in p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <span className="stat-label">{label}</span>
        {icon && <span className="text-slate-500">{icon}</span>}
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="font-display text-2xl font-bold tabular-nums text-white sm:text-3xl">
          {format === 'pct' ? pct(value) : compact(value)}
        </div>
        {typeof delta === 'number' && <Delta value={delta} />}
      </div>
      {spark && spark.length > 1 && (
        <div className="mt-3">
          <Sparkline values={spark} color={color} />
        </div>
      )}
    </div>
  );
}

export function LoadingScreen() {
  return (
    <div className="p-5 sm:p-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card h-28 animate-pulse bg-ink-800/40" />
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card h-80 animate-pulse bg-ink-800/40 lg:col-span-2" />
        <div className="card h-80 animate-pulse bg-ink-800/40" />
      </div>
    </div>
  );
}
