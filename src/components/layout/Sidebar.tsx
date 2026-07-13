import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  LineChart,
  CalendarDays,
  Lightbulb,
  Flame,
  Rocket,
  Map,
  Library,
  Settings,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  hint: string;
}

const NAV: NavItem[] = [
  { to: '/', label: 'Cockpit', icon: LayoutDashboard, hint: 'Überblick & Ziele' },
  { to: '/analytics', label: 'Analytics', icon: LineChart, hint: 'Plattform-Deep-Dive' },
  { to: '/planner', label: 'Redaktionsplan', icon: CalendarDays, hint: 'Pipeline & Kalender' },
  { to: '/ideas', label: 'Ideen & Formate', icon: Lightbulb, hint: 'Content-Engine' },
  { to: '/trends', label: 'Trends & Outlier', icon: Flame, hint: 'Virale Formate' },
  { to: '/strategy', label: 'Strategie', icon: Rocket, hint: 'Empfehlungen' },
  { to: '/plan', label: 'Wachstums-Plan', icon: Map, hint: 'Fahrplan zu 20k' },
  { to: '/library', label: 'Bibliothek', icon: Library, hint: 'Content-Archiv' },
  { to: '/settings', label: 'Daten & Setup', icon: Settings, hint: 'Import & API' },
];

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-white/[0.06] bg-ink-850/60 px-3 py-5 backdrop-blur-sm lg:flex">
      <div className="mb-7 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 font-display text-lg font-bold text-ink-950 shadow-[0_6px_20px_-6px_rgba(0,195,137,0.7)]">
          MR
        </div>
        <div className="leading-tight">
          <div className="font-display text-[15px] font-semibold text-white">Mr Real</div>
          <div className="text-xs text-slate-500">@mr.r3al · Content OS</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                isActive
                  ? 'bg-brand-500/12 text-white ring-1 ring-inset ring-brand-500/25'
                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={18}
                  className={isActive ? 'text-brand-300' : 'text-slate-500 group-hover:text-slate-300'}
                />
                <span className="flex-1 font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-4 rounded-xl border border-white/[0.06] bg-ink-800/60 p-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Ziel bis 31.12.</div>
        <div className="mt-1 font-display text-lg font-bold text-white">20.000 Follower</div>
        <div className="text-xs text-slate-500">500k–1 Mio. Impressionen / Monat</div>
      </div>
    </aside>
  );
}
