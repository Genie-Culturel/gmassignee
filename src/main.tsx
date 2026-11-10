import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SouvenirsPage } from './pages/Souvenirs';
import { captureAuthHandoff } from './lib/authHandoff';
import './index.css';

// Snapshot ?handoff=1&email= before HashRouter / history.replaceState can drop them.
captureAuthHandoff();

// Fallback (e.g. served via 404.html): /souvenirs → public page, outside the PIN gate.
const isSouvenirs = /\/souvenirs\/?$/.test(window.location.pathname);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{isSouvenirs ? <SouvenirsPage /> : <App />}</React.StrictMode>
);
