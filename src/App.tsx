import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { SuiviParties } from './pages/SuiviParties';
import { FormationTechnique } from './pages/FormationTechnique';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="suivi-parties" element={<SuiviParties />} />
          <Route path="formation" element={<FormationTechnique />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
