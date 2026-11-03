import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SouvenirsPage } from './pages/Souvenirs';
import './index.css';

// Fallback (e.g. served via 404.html): /souvenirs → public page, outside the PIN gate.
const isSouvenirs = /\/souvenirs\/?$/.test(window.location.pathname);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{isSouvenirs ? <SouvenirsPage /> : <App />}</React.StrictMode>
);
