import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import WelcomePage from './pages/WelcomePage';
import AppInfoPage from './pages/AppInfoPage';
import WardrobePage from './pages/WardrobePage';
import UploadPage from './pages/UploadPage';
import StylistPage from './pages/StylistPage';
import DeclutterPage from './pages/DeclutterPage';
import DoINeedThisPage from './pages/DoINeedThisPage';
import OutfitsPage from './pages/OutfitsPage';
import './App.css';

function ReloadToHome() {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    const nav = performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined;
    const legacyNav = (performance as Performance & { navigation?: { type: number } }).navigation?.type;
    const isReload = nav?.type === 'reload' || legacyNav === 1;
    const onHome = location.pathname === '/';
    // Only on real reload, and only when not already on home (run once on mount)
    if (isReload && !onHome) navigate('/', { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function AppLayout() {
  return (
    <div className="app-layout">
      <main className="main-content">
        <Outlet />
      </main>
      <nav className="tabs">
        <NavLink to="/app" end className={({ isActive }) => (isActive ? 'active' : '')}>
          Wardrobe
        </NavLink>
        <NavLink to="/app/stylist" className={({ isActive }) => (isActive ? 'active' : '')}>
          Stylist
        </NavLink>
        <NavLink to="/app/declutter" className={({ isActive }) => (isActive ? 'active' : '')}>
          Declutter
        </NavLink>
        <NavLink to="/app/outfits" className={({ isActive }) => (isActive ? 'active' : '')}>
          Outfits
        </NavLink>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <ReloadToHome />
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/app-info" element={<AppInfoPage />} />
          <Route path="/do-i-need-this" element={<DoINeedThisPage />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<WardrobePage />} />
            <Route path="stylist" element={<StylistPage />} />
            <Route path="declutter" element={<DeclutterPage />} />
            <Route path="outfits" element={<OutfitsPage />} />
          </Route>
          <Route path="/upload" element={<UploadPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}
