import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, LineChart, CalendarDays, Lightbulb, Rocket, Settings } from 'lucide-react';
import { Sidebar } from './Sidebar';

const MOBILE_NAV = [
  { to: '/', label: 'Cockpit', icon: LayoutDashboard },
  { to: '/analytics', label: 'Analytics', icon: LineChart },
  { to: '/planner', label: 'Plan', icon: CalendarDays },
  { to: '/ideas', label: 'Ideen', icon: Lightbulb },
  { to: '/strategy', label: 'Strategie', icon: Rocket },
  { to: '/settings', label: 'Setup', icon: Settings },
];

export function AppLayout() {
  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <Outlet />
        </main>

        {/* Mobile bottom navigation */}
        <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-white/[0.08] bg-ink-850/95 backdrop-blur-md lg:hidden">
          {MOBILE_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium ${
                  isActive ? 'text-brand-300' : 'text-slate-500'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
