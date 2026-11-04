import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { SuiviParties } from './pages/SuiviParties';
import { FormationTechnique } from './pages/FormationTechnique';
import { Login } from './pages/Login';
import { PinGate } from './pages/PinGate';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { isMockMode } from './lib/supabase';

function ProtectedDashboard() {
  const { isAdmin } = useAuth();
  
  if (!isAdmin) {
    return <Navigate to="/suivi-parties" replace />;
  }
  
  return <Dashboard />;
}

function AppRoutes() {
  const { user, loading, isAdmin } = useAuth();

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
        <Route index element={<Navigate to={isAdmin ? "/dashboard" : "/suivi-parties"} replace />} />
        <Route path="dashboard" element={<ProtectedDashboard />} />
        <Route path="suivi-parties" element={<SuiviParties />} />
        <Route path="formation" element={<FormationTechnique />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <HashRouter>
      <PinGate>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </PinGate>
    </HashRouter>
  );
}

export default App;
