import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { compact, axisNum, formatDate } from '../../lib/format';

const AXIS = { stroke: '#4A5568', fontSize: 11 };
const GRID = '#ffffff10';

interface TooltipEntry {
  name?: string | number;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-ink-850/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      {label && <div className="mb-1 font-semibold text-slate-300">{formatDate(String(label))}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
            {p.name}
          </span>
          <span className="font-semibold tabular-nums text-white">
            {typeof p.value === 'number' ? compact(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export interface SeriesDef {
  key: string;
  name: string;
  color: string;
}

export function TrendAreaChart({
  data,
  series,
  height = 280,
}: {
  data: Array<Record<string, number | string>>;
  series: SeriesDef[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="date" tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => formatDate(String(v))} minTickGap={32} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => axisNum(Number(v))} width={40} />
        <Tooltip content={<ChartTooltip />} />
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2}
            fill={`url(#grad-${s.key})`}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MultiLineChart({
  data,
  series,
  height = 280,
}: {
  data: Array<Record<string, number | string>>;
  series: SeriesDef[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="date" tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => formatDate(String(v))} minTickGap={32} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => axisNum(Number(v))} width={40} />
        <Tooltip content={<ChartTooltip />} />
        {series.map((s) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function GoalProjectionChart({
  data,
  target,
  height = 280,
}: {
  data: Array<{ date: string; actual?: number; projected?: number }>;
  target: number;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="grad-actual" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00C389" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#00C389" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="date" tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => formatDate(String(v))} minTickGap={40} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => axisNum(Number(v))} width={40} />
        <Tooltip content={<ChartTooltip />} />
        <ReferenceLine y={target} stroke="#F7C14B" strokeDasharray="5 4" strokeWidth={1.5} label={{ value: `Ziel ${axisNum(target)}`, fill: '#F7C14B', fontSize: 11, position: 'insideTopRight' }} />
        <Area type="monotone" dataKey="actual" name="Ist" stroke="#00C389" strokeWidth={2.5} fill="url(#grad-actual)" dot={false} />
        <Area type="monotone" dataKey="projected" name="Prognose" stroke="#5B8DEF" strokeWidth={2} strokeDasharray="5 4" fill="none" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function HorizontalBars({
  data,
  height = 240,
}: {
  data: Array<{ name: string; value: number; color: string }>;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart layout="vertical" data={data} margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => axisNum(Number(v))} />
        <YAxis type="category" dataKey="name" tick={{ ...AXIS, fontSize: 12 }} tickLine={false} axisLine={false} width={110} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: '#ffffff08' }} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
