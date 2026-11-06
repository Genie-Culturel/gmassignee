import { ProcedureFiche } from './database.types';
import { VenueCatalog, VenueGame } from './venues';

/**
 * Circuits canoniques (Julien, 2026-11-06). Circuit = lieu du jeu.
 * Une compétence RH sur un jeu ouvre TOUTES les fiches de ce circuit + les générales.
 */
export const CIRCUIT_SLUGS = {
  vr_center: 'vr_center',
  escape_sion: 'escape_sion',
  escape_sierre: 'escape_sierre',
  archeo_sion: 'archeo_sion',
  nettoyage_center: 'nettoyage_center',
  event: 'event',
  chandoline: 'chandoline',
} as const;

/** Slugs de jeux qui ont leur propre circuit, même s'ils sont encore rangés sous vr_center en base. */
const SLUG_CIRCUIT_OVERRIDE: Record<string, string> = {
  archeogame: CIRCUIT_SLUGS.archeo_sion,
  nettoyage: CIRCUIT_SLUGS.nettoyage_center,
  event_outdoor: CIRCUIT_SLUGS.event,
};

export function locationIdBySlug(catalog: VenueCatalog, slug: string): string | undefined {
  return catalog.locations.find((location) => location.slug === slug)?.id;
}

/**
 * Identifiant de circuit d'un jeu : son lieu, sauf overrides (Archeogame, Nettoyage, Event).
 */
export function circuitIdForGame(
  game: Pick<VenueGame, 'slug' | 'location_id'>,
  catalog: VenueCatalog
): string {
  const overrideSlug = SLUG_CIRCUIT_OVERRIDE[(game.slug || '').toLowerCase()];
  if (overrideSlug) {
    return locationIdBySlug(catalog, overrideSlug) || `circuit:${overrideSlug}`;
  }
  return game.location_id;
}

export function circuitIdsForAuthorizedGames(
  authorizedGameIds: string[],
  catalog: VenueCatalog
): Set<string> {
  const authorized = new Set(authorizedGameIds);
  const circuits = new Set<string>();
  for (const game of catalog.games) {
    if (authorized.has(game.id)) circuits.add(circuitIdForGame(game, catalog));
  }
  return circuits;
}

/** Tous les jeux des circuits autorisés (Planta → aussi Saga, Magi Room, …). */
export function expandAuthorizedGamesToCircuit(
  authorizedGameIds: string[] | null,
  catalog: VenueCatalog
): string[] | null {
  if (authorizedGameIds === null) return null;
  if (authorizedGameIds.length === 0) return [];
  const circuits = circuitIdsForAuthorizedGames(authorizedGameIds, catalog);
  return catalog.games.filter((game) => circuits.has(circuitIdForGame(game, catalog))).map((game) => game.id);
}

export function parseAuthorizedGameIds(data: unknown): string[] {
  if (!Array.isArray(data)) return [];
  return data.filter((id): id is string => typeof id === 'string' && id.length > 0);
}

/**
 * Résultat RPC `gh_get_authorized_game_ids` / `gh_list_gm_authorized_game_ids`.
 * `null` = formateur/admin (pas de filtre). `[]` = 0 compétence. Jamais confondre les deux.
 */
export function authorizedGameIdsFromRpc(data: unknown): string[] | null {
  if (data == null) return null;
  return parseAuthorizedGameIds(data);
}

/**
 * `null` uniquement pour formateur/admin (pas de filtre).
 * Un GM, y compris si `authorizedGameIds` est encore null, est traité comme `[]`.
 */
export function idsForCompetenceFilter(
  isFormateur: boolean,
  authorizedGameIds: string[] | null | undefined
): string[] | null {
  if (isFormateur) return null;
  return Array.isArray(authorizedGameIds) ? authorizedGameIds : [];
}

function ficheCircuitIds(fiche: ProcedureFiche, catalog: VenueCatalog): string[] {
  const ids = new Set<string>();
  for (const locId of fiche.scope_location_ids || []) ids.add(locId);
  for (const gameId of fiche.scope_game_ids || []) {
    const game = catalog.games.find((row) => row.id === gameId);
    if (game) ids.add(circuitIdForGame(game, catalog));
  }
  return [...ids];
}

function isGeneralFiche(fiche: ProcedureFiche): boolean {
  const gameIds = fiche.scope_game_ids || [];
  const locIds = fiche.scope_location_ids || [];
  return gameIds.length === 0 && locIds.length === 0;
}

/**
 * Filtre les fiches selon les compétences RH.
 *
 * - `authorizedGameIds === null` : pas de filtre (formateur / admin / démo).
 * - `[]` : 0 compétence → 0 fiche.
 * - sinon : toutes les fiches des circuits (lieux) des jeux autorisés + générales (« Tout le monde »).
 *
 * Exemples :
 *   Feu Sacré → Escape Life Sierre + générales
 *   Planta → tout VR Center (parcours partagé ET fiches des autres jeux du circuit) + générales
 *   Da Vinci + Planta → Escape Life Sion + VR Center + générales
 *   Archeogame → ARCHEO SION + générales (pas VR Center)
 *   Nettoyage → NETTOYAGE CENTER + générales (pas la boucle VR)
 */
export function filterFichesByCompetences(
  fiches: ProcedureFiche[],
  authorizedGameIds: string[] | null,
  catalog: VenueCatalog
): ProcedureFiche[] {
  if (authorizedGameIds === null) return fiches;
  if (authorizedGameIds.length === 0) return [];

  const circuits = circuitIdsForAuthorizedGames(authorizedGameIds, catalog);

  return fiches.filter((fiche) => {
    if (isGeneralFiche(fiche)) return true;
    return ficheCircuitIds(fiche, catalog).some((circuitId) => circuits.has(circuitId));
  });
}

/** Sélecteur de jeux : tous les jeux des circuits autorisés. Formateur/admin : catalogue intact. */
export function filterCatalogForCompetences(
  catalog: VenueCatalog,
  authorizedGameIds: string[] | null
): VenueCatalog {
  if (authorizedGameIds === null) return catalog;
  if (authorizedGameIds.length === 0) {
    return { ...catalog, locations: [], games: [] };
  }
  const circuits = circuitIdsForAuthorizedGames(authorizedGameIds, catalog);
  const games = catalog.games
    .filter((game) => circuits.has(circuitIdForGame(game, catalog)))
    .map((game) => {
      const circuitId = circuitIdForGame(game, catalog);
      if (circuitId.startsWith('circuit:') || circuitId === game.location_id) return game;
      return { ...game, location_id: circuitId };
    });
  const locationIds = new Set<string>();
  for (const circuitId of circuits) {
    if (!circuitId.startsWith('circuit:')) locationIds.add(circuitId);
  }
  return {
    ...catalog,
    locations: catalog.locations.filter((location) => locationIds.has(location.id)),
    games,
  };
}
