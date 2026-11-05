import { FicheScopeKind, ProcedureFiche } from './database.types';
import { circuitIdForGame } from './competenceFilter';
import { ALL_GAMES_VALUE, VenueCatalog, VenueGame, findGame, findLocation } from './venues';

export function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids.filter(Boolean))];
}

export function toggleId(ids: string[], id: string, on: boolean): string[] {
  if (on) return uniqueIds([...ids, id]);
  return ids.filter((item) => item !== id);
}

export function deriveScopeKind(locationIds: string[], gameIds: string[]): FicheScopeKind {
  if (gameIds.length > 0) return 'games';
  if (locationIds.length > 0) return 'locations';
  return 'all';
}

export function arraysEqualAsSets(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const right = new Set(b);
  return a.every((id) => right.has(id));
}

export function vrCenterLocationId(catalog: VenueCatalog): string | undefined {
  return catalog.locations.find((location) => location.slug === 'vr_center')?.id;
}

export function nettoyageGame(catalog: VenueCatalog): VenueGame | undefined {
  return catalog.games.find((game) => game.slug === 'nettoyage');
}

export function dominantGameId(
  catalog: VenueCatalog,
  filterGameId: string | undefined,
  selectedGameIds: string[]
): string | undefined {
  if (filterGameId && filterGameId !== ALL_GAMES_VALUE && findGame(catalog, filterGameId)) {
    return filterGameId;
  }
  if (selectedGameIds.length === 1) return selectedGameIds[0];
  return undefined;
}

export function circuitShortcutScope(catalog: VenueCatalog, locationId?: string): {
  locationIds: string[];
  gameIds: string[];
} {
  const id = locationId || vrCenterLocationId(catalog);
  return { locationIds: id ? [id] : [], gameIds: [] };
}

export function gameLabelShortcutScope(gameId: string): { locationIds: string[]; gameIds: string[] } {
  return { locationIds: [], gameIds: [gameId] };
}

export function everyoneShortcutScope(): { locationIds: string[]; gameIds: string[] } {
  return { locationIds: [], gameIds: [] };
}

function joinFr(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} ou ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} ou ${names[names.length - 1]}`;
}

function gamesOnCircuit(catalog: VenueCatalog, circuitId: string): VenueGame[] {
  return catalog.games
    .filter((game) => circuitIdForGame(game, catalog) === circuitId)
    .sort((a, b) => a.sort_index - b.sort_index);
}

function circuitIdsForScope(
  catalog: VenueCatalog,
  locationIds: string[],
  gameIds: string[]
): string[] {
  const ids = new Set<string>();
  for (const locationId of locationIds) ids.add(locationId);
  for (const gameId of gameIds) {
    const game = findGame(catalog, gameId);
    if (game) ids.add(circuitIdForGame(game, catalog));
  }
  return [...ids];
}

/**
 * Compétences / jeux RH qui rendent la fiche visible.
 * Un jeu ou un lieu tagué ouvre TOUT le circuit de ce lieu.
 */
export function competencesVisibleForScope(
  catalog: VenueCatalog,
  locationIds: string[],
  gameIds: string[]
): string[] {
  const names = new Set<string>();
  for (const circuitId of circuitIdsForScope(catalog, locationIds, gameIds)) {
    for (const game of gamesOnCircuit(catalog, circuitId)) names.add(game.name);
  }
  return [...names];
}

export function describeFicheVisibility(
  catalog: VenueCatalog,
  locationIds: string[],
  gameIds: string[]
): string {
  if (locationIds.length === 0 && gameIds.length === 0) {
    return 'Visible pour les GM avec au moins une compétence RH. Les GM sans compétence ne voient aucune fiche.';
  }
  const circuits = circuitIdsForScope(catalog, locationIds, gameIds);
  const circuitLabels = circuits.map((circuitId) => {
    const location = findLocation(catalog, circuitId);
    if (location) return location.short_name || location.name;
    return 'circuit';
  });
  const names = competencesVisibleForScope(catalog, locationIds, gameIds);
  if (!names.length) {
    return 'Aucun jeu mappé pour cette portée — les GM ne verront pas cette fiche.';
  }
  return `Visible pour tout GM du circuit ${joinFr(circuitLabels)} (${joinFr(names)}).`;
}

export function ficheScopeBadgeItems(
  fiche: ProcedureFiche,
  catalog: VenueCatalog
): { key: string; label: string }[] {
  const locationIds = [...(fiche.scope_location_ids || [])];
  const gameIds = fiche.scope_game_ids || [];
  if ((fiche.scope_kind || 'all') === 'all' && locationIds.length === 0 && gameIds.length === 0) {
    return [{ key: 'all', label: 'Tout le monde' }];
  }
  const seenLoc = new Set(locationIds);
  for (const gameId of gameIds) {
    const game = findGame(catalog, gameId);
    if (!game) continue;
    const circuitId = circuitIdForGame(game, catalog);
    if (!circuitId.startsWith('circuit:') && !seenLoc.has(circuitId)) {
      seenLoc.add(circuitId);
      locationIds.push(circuitId);
    }
  }
  const items: { key: string; label: string }[] = [];
  for (const id of locationIds) {
    const location = findLocation(catalog, id);
    items.push({ key: `loc-${id}`, label: location?.short_name || location?.name || 'Circuit' });
  }
  for (const id of gameIds) {
    const game = findGame(catalog, id);
    items.push({ key: `game-${id}`, label: game?.name || 'Jeu' });
  }
  if (!items.length) {
    return [{ key: 'empty', label: fiche.scope_kind === 'games' ? 'Jeux' : 'Circuits' }];
  }
  return items;
}
