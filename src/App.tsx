import { ReactNode } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { SuiviParties } from './pages/SuiviParties';
import { FormationTechnique } from './pages/FormationTechnique';
import { Login } from './pages/Login';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { GmOptionsProvider, useGmOptions } from './hooks/useGmOptions';
import { isMockMode } from './lib/supabase';

function FeatureRoute({ allowed, children }: { allowed: boolean; children: ReactNode }) {
  if (!allowed) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
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
        <Route index element={<Navigate to="/dashboard" replace />} />
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
