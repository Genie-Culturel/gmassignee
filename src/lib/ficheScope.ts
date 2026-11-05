import { FicheScopeKind, ProcedureFiche } from './database.types';
import { isVrCircuitGame, VR_CIRCUIT_SLUGS } from './competenceFilter';
import { ALL_GAMES_VALUE, VenueCatalog, VenueGame, findGame, findLocation } from './venues';

export function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids.filter(Boolean))];
}

export function toggleId(ids: string[], id: string, on: boolean): string[] {
  if (on) return uniqueIds([...ids, id]);
  return ids.filter((item) => item !== id);
}

/**
 * `scope_kind` dérivé (contrainte SQL all | locations | games).
 * S'il y a des jeux, on garde `games` pour que le filtre exclusif historique
 * n'interprète pas un double tag (Planta + VR Center) comme du circuit entier.
 */
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

export function circuitShortcutScope(catalog: VenueCatalog): {
  locationIds: string[];
  gameIds: string[];
} {
  const vrId = vrCenterLocationId(catalog);
  return { locationIds: vrId ? [vrId] : [], gameIds: [] };
}

export function gameOnlyShortcutScope(gameId: string): { locationIds: string[]; gameIds: string[] } {
  return { locationIds: [], gameIds: [gameId] };
}

/** Fiche d'un jeu VR Centre : jeu + lieu VR Center (double tag, sans élargir au circuit). */
export function gamePlusVrCenterShortcutScope(
  catalog: VenueCatalog,
  gameId: string
): { locationIds: string[]; gameIds: string[] } {
  const vrId = vrCenterLocationId(catalog);
  return { locationIds: vrId ? [vrId] : [], gameIds: [gameId] };
}

export function nettoyageShortcutScope(catalog: VenueCatalog): {
  locationIds: string[];
  gameIds: string[];
} {
  const game = nettoyageGame(catalog);
  return { locationIds: [], gameIds: game ? [game.id] : [] };
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

function circuitGameNames(catalog: VenueCatalog): string[] {
  return catalog.games
    .filter((game) => isVrCircuitGame(game, catalog))
    .sort((a, b) => a.sort_index - b.sort_index)
    .map((game) => game.name);
}

/**
 * Compétences RH qui rendent la fiche visible.
 * Jeux cochés → ces jeux seulement (le lieu VR Center est un tag, pas le circuit entier).
 * Lieux seuls → circuit / lieu du parcours.
 */
export function competencesVisibleForScope(
  catalog: VenueCatalog,
  locationIds: string[],
  gameIds: string[]
): string[] {
  const names = new Set<string>();
  if (gameIds.length > 0) {
    for (const gameId of gameIds) {
      const game = findGame(catalog, gameId);
      if (game) names.add(game.name);
    }
    return [...names];
  }
  for (const locationId of locationIds) {
    const location = findLocation(catalog, locationId);
    if (!location) continue;
    if (location.slug === 'vr_center') {
      for (const name of circuitGameNames(catalog)) names.add(name);
      continue;
    }
    for (const game of catalog.games.filter((row) => row.location_id === locationId)) {
      names.add(game.name);
    }
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
  const names = competencesVisibleForScope(catalog, locationIds, gameIds);
  if (!names.length) {
    return 'Aucun jeu mappé pour cette portée — les GM ne verront pas cette fiche.';
  }
  const vrId = vrCenterLocationId(catalog);
  const circuitOnly =
    Boolean(vrId) &&
    arraysEqualAsSets(locationIds, vrId ? [vrId] : []) &&
    gameIds.length === 0 &&
    names.length === VR_CIRCUIT_SLUGS.length;
  const vrTagged = Boolean(vrId) && vrId !== undefined && locationIds.includes(vrId);
  if (gameIds.length > 0 && vrTagged) {
    return `Visible pour les GM avec compétence ${joinFr(names)} (tag VR Center).`;
  }
  const suffix = circuitOnly ? ' (circuit VR Center)' : '';
  return `Visible pour les GM avec compétence ${joinFr(names)}${suffix}.`;
}

export function ficheScopeBadgeItems(
  fiche: ProcedureFiche,
  catalog: VenueCatalog
): { key: string; label: string }[] {
  const locationIds = fiche.scope_location_ids || [];
  const gameIds = fiche.scope_game_ids || [];
  if ((fiche.scope_kind || 'all') === 'all' && locationIds.length === 0 && gameIds.length === 0) {
    return [{ key: 'all', label: 'Tout le monde' }];
  }
  const items: { key: string; label: string }[] = [];
  for (const id of locationIds) {
    const location = findLocation(catalog, id);
    items.push({ key: `loc-${id}`, label: location?.short_name || location?.name || 'Lieu' });
  }
  const vrId = vrCenterLocationId(catalog);
  const hasVrLoc = Boolean(vrId) && locationIds.includes(vrId as string);
  const hasCircuitGame = gameIds.some((id) => {
    const game = findGame(catalog, id);
    return Boolean(game && isVrCircuitGame(game, catalog));
  });
  if (hasCircuitGame && !hasVrLoc && vrId) {
    const location = findLocation(catalog, vrId);
    items.unshift({ key: `loc-${vrId}`, label: location?.short_name || 'VR Center' });
  }
  for (const id of gameIds) {
    const game = findGame(catalog, id);
    items.push({ key: `game-${id}`, label: game?.name || 'Jeu' });
  }
  if (!items.length) {
    return [{ key: 'empty', label: fiche.scope_kind === 'games' ? 'Jeux' : 'Lieux' }];
  }
  return items;
}
