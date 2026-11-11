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
  { id: 'loc-archeo_sion', slug: 'archeo_sion', name: 'ARCHEO Sion', short_name: 'ARCHEO Sion', kind: 'ar', sort_index: 5 },
  { id: 'loc-nettoyage_center', slug: 'nettoyage_center', name: 'Nettoyage Center', short_name: 'Nettoyage', kind: 'ops', sort_index: 6 },
  { id: 'loc-event', slug: 'event', name: 'Événement outdoor', short_name: 'Event', kind: 'event', sort_index: 7 },
];

export const DEMO_GAMES: VenueGame[] = [
  { id: 'game-planta', location_id: 'loc-vr_center', slug: 'planta', name: 'Bataille de la Planta', sort_index: 1 },
  { id: 'game-serviteur', location_id: 'loc-vr_center', slug: 'serviteur', name: 'Le Serviteur 1 & 2', sort_index: 2 },
  { id: 'game-saga', location_id: 'loc-vr_center', slug: 'saga', name: 'La Saga', sort_index: 3 },
  { id: 'game-schoolcrafter', location_id: 'loc-vr_center', slug: 'schoolcrafter', name: 'Schoolcrafter', sort_index: 4 },
  { id: 'game-magi_room', location_id: 'loc-vr_center', slug: 'magi_room', name: 'Magi Room', sort_index: 7 },
  { id: 'game-rave', location_id: 'loc-vr_center', slug: 'rave', name: 'RAVE', sort_index: 8 },
  { id: 'game-archeogame', location_id: 'loc-archeo_sion', slug: 'archeogame', name: 'ARcheo Game', sort_index: 1 },
  { id: 'game-nettoyage', location_id: 'loc-nettoyage_center', slug: 'nettoyage', name: 'Nettoyage centre VR', sort_index: 1 },
  { id: 'game-usine_chandoline', location_id: 'loc-chandoline', slug: 'usine_chandoline', name: 'Novasphère', sort_index: 1 },
  { id: 'game-davinci', location_id: 'loc-escape_sion', slug: 'davinci', name: 'Da Vinci Code', sort_index: 1 },
  { id: 'game-davinci_kids', location_id: 'loc-escape_sion', slug: 'davinci_kids', name: 'Da Vinci Kids', sort_index: 2 },
  { id: 'game-davinci_vinum', location_id: 'loc-escape_sion', slug: 'davinci_vinum', name: 'Da Vinci Vinum', sort_index: 3 },
  { id: 'game-feux_sacres', location_id: 'loc-escape_sierre', slug: 'feux_sacres', name: 'Le Feu sacré', sort_index: 1 },
  { id: 'game-event_outdoor', location_id: 'loc-event', slug: 'event_outdoor', name: 'Événement outdoor', sort_index: 1 },
];

export const DEMO_CATALOG: VenueCatalog = { locations: DEMO_LOCATIONS, games: DEMO_GAMES };

/** Former demo-only extras now exist in the live export (`DEMO_LIVE_FICHES`). */
export const DEMO_EXTRA_FICHES: ProcedureFiche[] = [];

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
  const locationIds = fiche.scope_location_ids || [];
  const gameIds = fiche.scope_game_ids || [];
  if (locationIds.length === 0 && gameIds.length === 0) return true;
  if (gameIds.length > 0) return gameIds.includes(game.id);
  return locationIds.includes(game.location_id);
}

export function filterFichesForGame(
  fiches: ProcedureFiche[],
  catalog: VenueCatalog,
  gameId: string
): ProcedureFiche[] {
  return fiches.filter((fiche) => ficheAppliesToGame(fiche, catalog, gameId));
}

export function ficheScopeBadgeLabel(fiche: ProcedureFiche, catalog: VenueCatalog): string {
  const locationIds = fiche.scope_location_ids || [];
  const gameIds = fiche.scope_game_ids || [];
  if ((fiche.scope_kind || 'all') === 'all' && locationIds.length === 0 && gameIds.length === 0) {
    return 'Tout le monde';
  }
  const locNames = locationIds
    .map((id) => findLocation(catalog, id)?.short_name)
    .filter(Boolean) as string[];
  const gameNames = gameIds
    .map((id) => catalog.games.find((game) => game.id === id)?.name)
    .filter(Boolean) as string[];
  const names = [...locNames, ...gameNames];
  if (!names.length) return locationIds.length ? 'Lieux' : 'Jeux';
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
