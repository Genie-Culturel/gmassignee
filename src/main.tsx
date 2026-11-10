import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SouvenirsPage } from './pages/Souvenirs';
import { captureAuthHandoff } from './lib/authHandoff';
import './index.css';

// Snapshot ?handoff=1&email= before HashRouter / history.replaceState can drop them.
captureAuthHandoff();

/**
 * GitHub Pages copies index.html to 404.html. A relative image src like
 * `uuid/uuid.jpg` therefore loads the SPA at `/gmassignee/uuid/uuid.jpg` (empty
 * hash → dashboard). Keep the app on its base path and preserve hash/search.
 */
function recoverGithubPagesSpaLocation() {
  const base = import.meta.env.BASE_URL || '/';
  const path = window.location.pathname;
  if (/\/souvenirs\/?$/.test(path)) return;
  const expected = base.endsWith('/') ? base : `${base}/`;
  const expectedNoSlash = expected === '/' ? '/' : expected.slice(0, -1);
  if (path === expected || path === expectedNoSlash || path === '/') return;
  window.history.replaceState(null, '', `${expected}${window.location.search}${window.location.hash}`);
}
recoverGithubPagesSpaLocation();

// Fallback (e.g. served via 404.html): /souvenirs → public page, outside the PIN gate.
const isSouvenirs = /\/souvenirs\/?$/.test(window.location.pathname);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{isSouvenirs ? <SouvenirsPage /> : <App />}</React.StrictMode>
);
