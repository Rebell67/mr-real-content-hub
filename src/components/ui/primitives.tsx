import type { ReactNode } from 'react';
import { PLATFORM_META, type Platform } from '../../types';

// ---------------------------------------------------------------------------
// Small, composable UI primitives shared across pages.
// ---------------------------------------------------------------------------

export function Card({
  children,
  className = '',
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return <div className={`card ${hover ? 'card-hover' : ''} ${className}`}>{children}</div>;
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PlatformBadge({ platform, size = 'sm' }: { platform: Platform; size?: 'sm' | 'md' }) {
  const meta = PLATFORM_META[platform];
  return (
    <span
      className={`chip border ${size === 'md' ? 'text-xs' : 'text-[11px] px-2 py-0.5'}`}
      style={{
        color: meta.color,
        borderColor: `${meta.color}44`,
        backgroundColor: `${meta.color}14`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      {meta.label}
    </span>
  );
}

const PRIORITY_STYLES = {
  critical: { color: '#FF5A5A', bg: '#FF5A5A18', label: 'Kritisch' },
  high: { color: '#F7C14B', bg: '#F7C14B18', label: 'Hoch' },
  medium: { color: '#22D3EE', bg: '#22D3EE18', label: 'Mittel' },
} as const;

export function PriorityBadge({ priority }: { priority: 'critical' | 'high' | 'medium' }) {
  const s = PRIORITY_STYLES[priority];
  return (
    <span className="chip font-semibold uppercase tracking-wide" style={{ color: s.color, backgroundColor: s.bg }}>
      {s.label}
    </span>
  );
}

export function Delta({ value, invert = false }: { value: number; invert?: boolean }) {
  const positive = invert ? value < 0 : value > 0;
  const neutral = Math.abs(value) < 0.001;
  const color = neutral ? 'text-slate-500' : positive ? 'text-brand-300' : 'text-youtube';
  const sign = value > 0 ? '+' : value < 0 ? '' : '';
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${color}`}>
      {!neutral && (positive ? '▲' : '▼')} {sign}
      {(value * 100).toFixed(1)}%
    </span>
  );
}

export function ProgressBar({ value, color = '#00C389' }: { value: number; color?: string }) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${clamped * 100}%`, backgroundColor: color }}
      />
    </div>
  );
}

export function Sparkline({ values, color = '#12D99A', height = 36 }: { values: number[]; color?: string; height?: number }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 120;
  const step = width / (values.length - 1);
  const points = values.map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 4) - 2}`);
  const areaPath = `M0,${height} L${points.join(' L')} L${width},${height} Z`;
  const gradId = `spark-${color.replace('#', '')}`;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function EmptyState({ icon, title, hint }: { icon?: ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      {icon && <div className="text-slate-600">{icon}</div>}
      <p className="font-medium text-slate-300">{title}</p>
      {hint && <p className="max-w-sm text-sm text-slate-500">{hint}</p>}
    </div>
  );
}
