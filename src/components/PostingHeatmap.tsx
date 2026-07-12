import { useMemo, useState } from 'react';
import { PLATFORMS, PLATFORM_META, type Platform, type PostingWindow } from '../types';

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const HOURS = Array.from({ length: 19 }, (_, i) => i + 5); // 5:00 – 23:00

function heatColor(score: number): string {
  // score 0..100 -> transparent brand green ramp
  const alpha = 0.08 + (score / 100) * 0.85;
  return `rgba(0, 195, 137, ${alpha.toFixed(2)})`;
}

export function PostingHeatmap({ windows, defaultPlatform }: { windows: PostingWindow[]; defaultPlatform: Platform }) {
  const [platform, setPlatform] = useState<Platform>(defaultPlatform);

  const grid = useMemo(() => {
    const map = new Map<string, number>();
    for (const w of windows) {
      if (w.platform === platform) map.set(`${w.day}-${w.hour}`, w.score);
    }
    return map;
  }, [windows, platform]);

  const best = useMemo(() => {
    return windows
      .filter((w) => w.platform === platform)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [windows, platform]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {PLATFORMS.map((p) => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              platform === p ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            style={platform === p ? { backgroundColor: `${PLATFORM_META[p].color}22`, color: PLATFORM_META[p].color } : undefined}
          >
            {PLATFORM_META[p].label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="flex gap-1">
            <div className="w-7 shrink-0" />
            {HOURS.map((h) => (
              <div key={h} className="w-6 shrink-0 text-center text-[9px] text-slate-600">
                {h % 3 === 0 ? h : ''}
              </div>
            ))}
          </div>
          {DAYS.map((day) => (
            <div key={day} className="mt-1 flex items-center gap-1">
              <div className="w-7 shrink-0 text-[10px] font-medium text-slate-500">{day}</div>
              {HOURS.map((h) => {
                const score = grid.get(`${day}-${h}`) ?? 0;
                return (
                  <div
                    key={h}
                    className="h-6 w-6 shrink-0 rounded-[4px] transition-transform hover:scale-110 hover:ring-1 hover:ring-white/30"
                    style={{ backgroundColor: heatColor(score) }}
                    title={`${day} ${h}:00 · Score ${score}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold text-slate-400">Top-Fenster:</span>
        {best.map((w, i) => (
          <span key={i} className="chip bg-brand-500/12 text-brand-300">
            {w.day} · {w.hour}:00
          </span>
        ))}
      </div>
    </div>
  );
}
