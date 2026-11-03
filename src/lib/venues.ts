import { FicheScopeKind, ProcedureFiche } from './database.types';

export type { FicheScopeKind };

export const ALL_GAMES_VALUE = 'all';
export const SELECTED_GAME_STORAGE_KEY = 'gmassignee_selected_game';

export interface VenueLocation {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  kind: string;
  sort_index: number;
}

export interface VenueGame {
  id: string;
  location_id: string;
  slug: string;
  name: string;
  sort_index: number;
}

export interface VenueCatalog {
  locations: VenueLocation[];
  games: VenueGame[];
}

export const DEMO_LOCATIONS: VenueLocation[] = [
  { id: 'loc-vr_center', slug: 'vr_center', name: 'Virtual Reality Center', short_name: 'VR Center', kind: 'vr', sort_index: 1 },
  { id: 'loc-chandoline', slug: 'chandoline', name: 'Usine de Chandoline', short_name: 'Chandoline', kind: 'xr', sort_index: 2 },
  { id: 'loc-escape_sion', slug: 'escape_sion', name: 'Escape Life Sion', short_name: 'Sion', kind: 'outdoor', sort_index: 3 },
  { id: 'loc-escape_sierre', slug: 'escape_sierre', name: 'Escape Life Sierre', short_name: 'Sierre', kind: 'outdoor', sort_index: 4 },
];

export const DEMO_GAMES: VenueGame[] = [
  { id: 'game-planta', location_id: 'loc-vr_center', slug: 'planta', name: 'Planta', sort_index: 1 },
  { id: 'game-serviteur', location_id: 'loc-vr_center', slug: 'serviteur', name: 'Serviteur', sort_index: 2 },
  { id: 'game-saga', location_id: 'loc-vr_center', slug: 'saga', name: 'Saga', sort_index: 3 },
  { id: 'game-schoolcrafter', location_id: 'loc-vr_center', slug: 'schoolcrafter', name: 'Schoolcrafter', sort_index: 4 },
  { id: 'game-usine_chandoline', location_id: 'loc-chandoline', slug: 'usine_chandoline', name: 'Usine de Chandoline', sort_index: 1 },
  { id: 'game-davinci', location_id: 'loc-escape_sion', slug: 'davinci', name: 'Davinci', sort_index: 1 },
  { id: 'game-feux_sacres', location_id: 'loc-escape_sierre', slug: 'feux_sacres', name: 'Feux sacrés', sort_index: 1 },
];

export const DEMO_CATALOG: VenueCatalog = { locations: DEMO_LOCATIONS, games: DEMO_GAMES };

function extraFiche(
  id: string,
  category: ProcedureFiche['category'],
  title: string,
  summary: string,
  scope_kind: FicheScopeKind,
  scope_location_ids: string[],
  scope_game_ids: string[]
): ProcedureFiche {
  const now = new Date().toISOString();
  return {
    id,
    category,
    title,
    summary,
    content_steps: [{ order: 1, text: '🚧 À documenter' }],
    is_placeholder: true,
    tags: [],
    is_active: true,
    is_required: true,
    version: 1,
    deleted_at: null,
    scope_kind,
    scope_location_ids,
    scope_game_ids,
    created_at: now,
    updated_at: now,
  };
}

/** Demo-only example fiches for the non-VR venues + one « all locations » fiche. */
export const DEMO_EXTRA_FICHES: ProcedureFiche[] = [
  extraFiche(
    'demo-all-rules',
    'formation_technique',
    'Règles générales GM',
    'Règles communes à tous les lieux.',
    'all',
    [],
    []
  ),
  extraFiche(
    'demo-chandoline-accueil',
    'procedure_deroulement',
    'Accueil Usine de Chandoline',
    'Accueil des visiteurs à Chandoline.',
    'locations',
    ['loc-chandoline'],
    []
  ),
  extraFiche(
    'demo-planta-launch',
    'formation_technique',
    '🚧 Lancement de la Planta',
    'Lancement du jeu Planta.',
    'games',
    [],
    ['game-planta']
  ),
  extraFiche(
    'demo-saga-launch',
    'formation_technique',
    '🚧 Lancement de la Saga',
    'Lancement du jeu Saga.',
    'games',
    [],
    ['game-saga']
  ),
  extraFiche(
    'demo-chandoline-launch',
    'formation_technique',
    '🚧 Lancement Usine de Chandoline',
    'Lancement du jeu XR.',
    'games',
    [],
    ['game-usine_chandoline']
  ),
  extraFiche(
    'demo-davinci',
    'procedure_deroulement',
    'Briefing Davinci',
    'Briefing Escape Life Sion.',
    'games',
    [],
    ['game-davinci']
  ),
  extraFiche(
    'demo-feux',
    'procedure_deroulement',
    'Briefing Feux sacrés',
    'Briefing Escape Life Sierre.',
    'games',
    [],
    ['game-feux_sacres']
  ),
];

export function gamesGroupedByLocation(catalog: VenueCatalog): { location: VenueLocation; games: VenueGame[] }[] {
  return [...catalog.locations]
    .sort((a, b) => a.sort_index - b.sort_index)
    .map((location) => ({
      location,
      games: catalog.games
        .filter((game) => game.location_id === location.id)
        .sort((a, b) => a.sort_index - b.sort_index),
    }))
    .filter((group) => group.games.length > 0);
}

export function findGame(catalog: VenueCatalog, gameId: string | null | undefined): VenueGame | undefined {
  if (!gameId || gameId === ALL_GAMES_VALUE) return undefined;
  return catalog.games.find((game) => game.id === gameId);
}

export function findLocation(catalog: VenueCatalog, locationId: string | undefined): VenueLocation | undefined {
  if (!locationId) return undefined;
  return catalog.locations.find((location) => location.id === locationId);
}

export function selectedGameLabel(catalog: VenueCatalog, gameId: string): string {
  const game = findGame(catalog, gameId);
  if (!game) return 'Tous les lieux et jeux';
  const location = findLocation(catalog, game.location_id);
  return location ? `${game.name} · ${location.name}` : game.name;
}

export function ficheAppliesToGame(
  fiche: ProcedureFiche,
  catalog: VenueCatalog,
  gameId: string
): boolean {
  if (!gameId || gameId === ALL_GAMES_VALUE) return true;
  const game = findGame(catalog, gameId);
  if (!game) return true;
  const kind = fiche.scope_kind || 'all';
  if (kind === 'all') return true;
  if (kind === 'locations') return (fiche.scope_location_ids || []).includes(game.location_id);
  if (kind === 'games') return (fiche.scope_game_ids || []).includes(game.id);
  return true;
}

export function filterFichesForGame(
  fiches: ProcedureFiche[],
  catalog: VenueCatalog,
  gameId: string
): ProcedureFiche[] {
  return fiches.filter((fiche) => ficheAppliesToGame(fiche, catalog, gameId));
}

export function ficheScopeBadgeLabel(fiche: ProcedureFiche, catalog: VenueCatalog): string {
  const kind = fiche.scope_kind || 'all';
  if (kind === 'all') return 'Tous les lieux';
  if (kind === 'locations') {
    const names = (fiche.scope_location_ids || [])
      .map((id) => findLocation(catalog, id)?.short_name)
      .filter(Boolean) as string[];
    if (!names.length) return 'Lieux';
    if (names.length === 1) return names[0];
    return names.slice(0, 2).join(', ') + (names.length > 2 ? ` +${names.length - 2}` : '');
  }
  const names = (fiche.scope_game_ids || [])
    .map((id) => catalog.games.find((game) => game.id === id)?.name)
    .filter(Boolean) as string[];
  if (!names.length) return 'Jeux';
  if (names.length === 1) return names[0];
  return names.slice(0, 2).join(', ') + (names.length > 2 ? ` +${names.length - 2}` : '');
}

export function readStoredGameId(): string {
  try {
    return window.localStorage.getItem(SELECTED_GAME_STORAGE_KEY) || ALL_GAMES_VALUE;
  } catch {
    return ALL_GAMES_VALUE;
  }
}

export function writeStoredGameId(gameId: string) {
  try {
    window.localStorage.setItem(SELECTED_GAME_STORAGE_KEY, gameId);
  } catch {
    /* ignore */
  }
}

export function defaultScopeForNewFiche(catalog: VenueCatalog, filterGameId: string): {
  scope_kind: FicheScopeKind;
  scope_location_ids: string[];
  scope_game_ids: string[];
} {
  const game = findGame(catalog, filterGameId);
  if (game) {
    return { scope_kind: 'games', scope_location_ids: [], scope_game_ids: [game.id] };
  }
  const vr = catalog.locations.find((location) => location.slug === 'vr_center');
  if (!vr) {
    return { scope_kind: 'all', scope_location_ids: [], scope_game_ids: [] };
  }
  return {
    scope_kind: 'locations',
    scope_location_ids: [vr.id],
    scope_game_ids: [],
  };
}
