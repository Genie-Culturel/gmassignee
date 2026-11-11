import { FORMATION_EDITOR_TAB, formationEditorSearch } from './formationNav';

/** Top-level HashRouter sections. */
export const APP_SECTIONS = ['dashboard', 'suivi-parties', 'formation'] as const;
export type AppSection = (typeof APP_SECTIONS)[number];

export const APP_SECTION_PATH: Record<AppSection, string> = {
  dashboard: '/dashboard',
  'suivi-parties': '/suivi-parties',
  formation: '/formation',
};

const SECTION_ALIASES: Record<string, AppSection> = {
  dashboard: 'dashboard',
  historique: 'dashboard',
  'historique-des-sessions': 'dashboard',
  sessions: 'dashboard',
  'suivi-parties': 'suivi-parties',
  suivi: 'suivi-parties',
  parties: 'suivi-parties',
  formation: 'formation',
  formations: 'formation',
  procedures: 'formation',
  'formations-et-procedures': 'formation',
};

export type AppNavFlags = {
  showSuiviParties: boolean;
  showFormations: boolean;
};

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');
}

export function isAppSection(value: string | null | undefined): value is AppSection {
  return value !== null && value !== undefined && (APP_SECTIONS as readonly string[]).includes(value);
}

function paramsFromSearch(search: string): URLSearchParams {
  const raw = search.startsWith('?') ? search.slice(1) : search;
  return new URLSearchParams(raw);
}

function searchString(params: URLSearchParams): string {
  const next = params.toString();
  return next ? `?${next}` : '';
}

/** `?tab=suivi-parties` / `?tab=formation` / `?tab=admin` (éditeur). */
export function appSectionFromTabParam(tab: string | null | undefined): AppSection | null {
  if (!tab) return null;
  const key = normalizeKey(tab);
  if (key === FORMATION_EDITOR_TAB) return 'formation';
  return SECTION_ALIASES[key] ?? null;
}

export function appSectionFromSearch(search: string): AppSection | null {
  return appSectionFromTabParam(paramsFromSearch(search).get('tab'));
}

export function stripRouteTabParam(search: string): string {
  const params = paramsFromSearch(search);
  const tab = params.get('tab');
  if (tab && tab !== FORMATION_EDITOR_TAB && appSectionFromTabParam(tab)) {
    params.delete('tab');
  }
  return searchString(params);
}

/**
 * HashRouter pathname, including a GitHub Pages base accidentally baked into the hash
 * (`#/gmassignee/suivi-parties`).
 */
export function appSectionFromPathname(pathname: string): AppSection {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] === 'gmassignee') parts.shift();
  const first = parts[0] || 'dashboard';
  return isAppSection(first) ? first : 'dashboard';
}

export function appNavTo(section: AppSection, opts?: { editor?: boolean }): string {
  if (section === 'formation' && opts?.editor) {
    return `/formation${formationEditorSearch()}`;
  }
  return APP_SECTION_PATH[section];
}

export function applyAppNavFlags(section: AppSection, flags: AppNavFlags): AppSection {
  if (section === 'suivi-parties' && !flags.showSuiviParties) return 'dashboard';
  if (section === 'formation' && !flags.showFormations) return 'dashboard';
  return section;
}

function normalizeSearch(search: string): string {
  if (!search) return '';
  return search.startsWith('?') ? search : `?${search}`;
}

/** Target HashRouter location for the current path + `?tab=`. */
export function resolveAppLocation(
  pathname: string,
  search: string,
  flags: AppNavFlags
): { pathname: string; search: string } {
  const fromTab = appSectionFromSearch(search);
  const fromPath = appSectionFromPathname(pathname);
  const section = applyAppNavFlags(fromTab ?? fromPath, flags);
  const nextSearch = fromTab ? stripRouteTabParam(search) : normalizeSearch(search);
  return { pathname: APP_SECTION_PATH[section], search: nextSearch };
}

export function appLocationChanged(
  pathname: string,
  search: string,
  next: { pathname: string; search: string }
): boolean {
  const curPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const curSearch = normalizeSearch(search);
  return curPath !== next.pathname || curSearch !== (next.search || '');
}

function stripBase(pathname: string, base: string): string {
  const prefix = `/${base.replace(/^\/|\/$/g, '')}`.replace(/\/$/, '');
  if (!prefix || prefix === '/') return pathname || '/';
  if (pathEquals(pathname, prefix)) return '/';
  if (pathname.startsWith(`${prefix}/`)) {
    const rest = pathname.slice(prefix.length);
    return rest || '/';
  }
  return pathname || '/';
}

function pathEquals(a: string, b: string): boolean {
  return a.replace(/\/$/, '') === b.replace(/\/$/, '');
}

/**
 * Convert GitHub Pages path URLs and `?tab=` (document search or `#/?tab=`)
 * into a HashRouter hash (`#/suivi-parties`). Returns the origin-relative href
 * to `replaceState`, or null when the URL is already correct.
 */
export function pagesHrefFromLocation(input: {
  pathname: string;
  search: string;
  hash: string;
  base?: string;
}): string | null {
  if (/\/souvenirs\/?$/.test(input.pathname)) return null;

  const baseRaw = input.base ?? '/';
  const basePrefix = `/${baseRaw.replace(/^\/|\/$/g, '')}`.replace(/\/$/, '');
  const path = stripBase(input.pathname, baseRaw);

  const hashRaw = (input.hash || '').replace(/^#/, '');
  const q = hashRaw.indexOf('?');
  const hashPath = q >= 0 ? hashRaw.slice(0, q) : hashRaw;
  const hashSearch = q >= 0 ? hashRaw.slice(q) : '';

  const pathSeg = path.replace(/^\//, '').split('/')[0] || '';
  const hashSegRaw = hashPath.replace(/^\//, '').split('/')[0] || '';
  const hashSeg = hashSegRaw === 'gmassignee' ? hashPath.replace(/^\//, '').split('/')[1] || '' : hashSegRaw;

  const docParams = paramsFromSearch(input.search);
  const hashParams = paramsFromSearch(hashSearch);
  const merged = new URLSearchParams(docParams);
  hashParams.forEach((value, key) => merged.set(key, value));

  const fromPath = isAppSection(pathSeg) ? pathSeg : null;
  const fromHash = isAppSection(hashSeg) ? hashSeg : null;
  const fromTab = appSectionFromTabParam(merged.get('tab'));
  // `?tab=` names the destination (Lovable hub / deep links). Hash path wins only if no tab.
  const section = fromTab ?? fromHash ?? fromPath ?? null;

  if (!section) return null;

  if (merged.get('tab') && merged.get('tab') !== FORMATION_EDITOR_TAB && appSectionFromTabParam(merged.get('tab'))) {
    merged.delete('tab');
  }

  const nextHashPath = `/${section}`;
  const nextHashSearch = searchString(merged);
  const nextHash = `#${nextHashPath}${nextHashSearch}`;
  const publicBase = basePrefix && basePrefix !== '/' ? `${basePrefix}/` : '/';
  const nextHref = `${publicBase}${nextHash}`;

  const currentHashPath = hashPath.startsWith('/') || hashPath === '' ? hashPath : `/${hashPath}`;
  const alreadyHashed =
    currentHashPath === nextHashPath &&
    normalizeSearch(hashSearch) === nextHashSearch &&
    [...docParams.keys()].every((key) => hashParams.has(key) || (key === 'tab' && !merged.has('tab')));

  if (alreadyHashed) return null;
  return nextHref;
}

export function applyPagesHashRoute(
  loc: { pathname: string; search: string; hash: string; href: string } = window.location,
  base: string = import.meta.env.BASE_URL
): boolean {
  const next = pagesHrefFromLocation({
    pathname: loc.pathname,
    search: loc.search,
    hash: loc.hash,
    base,
  });
  if (!next) return false;
  const current = `${loc.pathname}${loc.search}${loc.hash}`;
  if (next === current) return false;
  window.history.replaceState(null, '', next);
  return true;
}
