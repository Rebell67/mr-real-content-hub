import { HashRouter, Routes, Route } from 'react-router-dom';
import { HubProvider } from './state/HubContext';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Analytics } from './pages/Analytics';
import { Planner } from './pages/Planner';
import { Ideas } from './pages/Ideas';
import { Strategy } from './pages/Strategy';
import { GrowthPlan } from './pages/GrowthPlan';
import { Library } from './pages/Library';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <HubProvider>
      <HashRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="planner" element={<Planner />} />
            <Route path="ideas" element={<Ideas />} />
            <Route path="strategy" element={<Strategy />} />
            <Route path="plan" element={<GrowthPlan />} />
            <Route path="library" element={<Library />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </HashRouter>
    </HubProvider>
  );
}
