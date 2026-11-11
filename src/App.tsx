import { ReactNode } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { SuiviParties } from './pages/SuiviParties';
import { FormationTechnique } from './pages/FormationTechnique';
import { Login } from './pages/Login';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { GmOptionsProvider, useGmOptions } from './hooks/useGmOptions';
import { isMockMode } from './lib/supabase';
import { resolveAppLocation } from './lib/appNav';

function LoadingPane() {
  return (
    <div className="min-h-[200px] flex items-center justify-center text-muted-foreground">
      Chargement…
    </div>
  );
}

function FeatureRoute({ allowed, children }: { allowed: boolean; children: ReactNode }) {
  const { loading } = useGmOptions();
  // Defaults hide Suivi/Formations until Options GM load — do not bounce to Historique.
  if (loading) return <LoadingPane />;
  if (!allowed) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function IndexRedirect() {
  const location = useLocation();
  const { showSuiviParties, showFormations, loading } = useGmOptions();
  if (loading) return <LoadingPane />;
  const next = resolveAppLocation(location.pathname, location.search, {
    showSuiviParties,
    showFormations,
  });
  return <Navigate to={`${next.pathname}${next.search}`} replace />;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  const { showSuiviParties, showFormations } = useGmOptions();

  if (!isMockMode && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Chargement…
      </div>
    );
  }

  if (!isMockMode && !user) {
    return <Login />;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<IndexRedirect />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route
          path="suivi-parties"
          element={
            <FeatureRoute allowed={showSuiviParties}>
              <SuiviParties />
            </FeatureRoute>
          }
        />
        <Route
          path="formation"
          element={
            <FeatureRoute allowed={showFormations}>
              <FormationTechnique />
            </FeatureRoute>
          }
        />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <GmOptionsProvider>
          <AppRoutes />
        </GmOptionsProvider>
      </AuthProvider>
    </HashRouter>
  );
}

export default App;
