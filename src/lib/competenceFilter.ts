import { ProcedureFiche } from './database.types';
import { VenueCatalog, VenueGame } from './venues';

/**
 * Jeux VR du Centre qui ouvrent le circuit générique (lobby, pop-corn, salle, boissons…).
 * Archeogame et nettoyage sont au même lieu mais n'ouvrent PAS le circuit.
 */
export const VR_CIRCUIT_SLUGS = ['planta', 'serviteur', 'saga', 'schoolcrafter'] as const;

/** Jeux situés au VR Center qui n'ouvrent pas le circuit. */
export const VR_CIRCUIT_EXCLUDED_SLUGS = ['archeogame', 'nettoyage'] as const;

/** Compétence RH « Nettoyage centre VR » : fiches nettoyage seulement. */
export const NETTOYAGE_SLUGS = ['nettoyage'] as const;

export function isVrCircuitGame(
  game: Pick<VenueGame, 'slug' | 'location_id'>,
  catalog: VenueCatalog
): boolean {
  const slug = (game.slug || '').toLowerCase();
  if ((VR_CIRCUIT_EXCLUDED_SLUGS as readonly string[]).includes(slug)) return false;
  if ((VR_CIRCUIT_SLUGS as readonly string[]).includes(slug)) return true;
  const location = catalog.locations.find((row) => row.id === game.location_id);
  return location?.slug === 'vr_center';
}

export function isNettoyageGame(game: Pick<VenueGame, 'slug'>): boolean {
  return (NETTOYAGE_SLUGS as readonly string[]).includes(game.slug);
}

function tagsOf(fiche: ProcedureFiche): string[] {
  return (fiche.tags || []).map((tag) => tag.toLowerCase());
}

/** Fiches ménage hebdomadaire : visibles seulement avec la compétence nettoyage. */
export function isWeeklyCleaningFiche(fiche: ProcedureFiche): boolean {
  const tags = tagsOf(fiche);
  if (
    tags.includes('semaine') ||
    tags.includes('hebdomadaire') ||
    tags.includes('rh_nettoyage_semaine')
  ) {
    return true;
  }
  const title = (fiche.title || '').toLowerCase();
  return /nettoyage|ménage/.test(title) && /semaine|hebdo|hebdomadaire/.test(title);
}

/** Fiches de nettoyage (session ou semaine), identifiées par tag ou titre. */
export function isNettoyageFiche(fiche: ProcedureFiche): boolean {
  if (isWeeklyCleaningFiche(fiche)) return true;
  const tags = tagsOf(fiche);
  if (tags.includes('rh_nettoyage') || tags.includes('nettoyage')) return true;
  return /nettoyage/i.test(fiche.title || '');
}

function locationSlugsForFiche(fiche: ProcedureFiche, catalog: VenueCatalog): string[] {
  return (fiche.scope_location_ids || [])
    .map((id) => catalog.locations.find((location) => location.id === id)?.slug)
    .filter((slug): slug is string => Boolean(slug));
}

/**
 * Normalise la réponse RPC `gh_get_authorized_game_ids`.
 * Tableau vide, null, ou valeur inattendue → `[]` (0 fiche), jamais « tout afficher ».
 */
export function parseAuthorizedGameIds(data: unknown): string[] {
  if (!Array.isArray(data)) return [];
  return data.filter((id): id is string => typeof id === 'string' && id.length > 0);
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

/**
 * Filtre les fiches selon les compétences RH (jeux).
 *
 * - `authorizedGameIds === null` : pas de filtre (formateur / admin / démo).
 * - `[]` : aucune fiche (0 compétence RH).
 * - Planta / Serviteur / Saga / Schoolcrafter (ou autre jeu VR Center hors exclusions) :
 *   circuit VR Center + fiches du jeu.
 * - Archeogame : fiches Archeogame seulement (pas le circuit VR).
 * - Nettoyage : fiches nettoyage seulement.
 * - Da Vinci / Chandoline / etc. : fiches du jeu + fiches lieu du parcours, pas le circuit VR.
 */
export function filterFichesByCompetences(
  fiches: ProcedureFiche[],
  authorizedGameIds: string[] | null,
  catalog: VenueCatalog
): ProcedureFiche[] {
  if (authorizedGameIds === null) return fiches;
  if (authorizedGameIds.length === 0) return [];

  const authorized = new Set(authorizedGameIds);
  const authorizedGames = catalog.games.filter((game) => authorized.has(game.id));
  const hasVrCircuit = authorizedGames.some((game) => isVrCircuitGame(game, catalog));
  const hasNettoyage = authorizedGames.some(isNettoyageGame);
  const authorizedLocationIds = new Set(authorizedGames.map((game) => game.location_id));

  return fiches.filter((fiche) => {
    const kind = fiche.scope_kind || 'all';

    if (kind === 'games') {
      return (fiche.scope_game_ids || []).some((gameId) => authorized.has(gameId));
    }

    // Ménage hebdomadaire : jamais via le circuit VR, uniquement compétence nettoyage.
    if (isWeeklyCleaningFiche(fiche)) {
      return hasNettoyage;
    }

    // Fiches nettoyage de session : visibles pour la compétence nettoyage,
    // et aussi via le circuit VR (Planta / Saga / …) plus bas.
    if (hasNettoyage && isNettoyageFiche(fiche)) {
      return true;
    }

    if (kind === 'locations') {
      const locSlugs = locationSlugsForFiche(fiche, catalog);
      const locIds = fiche.scope_location_ids || [];
      if (locSlugs.includes('vr_center')) {
        return hasVrCircuit;
      }
      return locIds.some((locationId) => authorizedLocationIds.has(locationId));
    }

    // scope_kind = all : pas de visibilité automatique pour un GM (0 compétence → 0 fiche).
    return false;
  });
}

/** Restreint le sélecteur de jeux aux compétences du GM. Formateur/admin : catalogue intact. */
export function filterCatalogForCompetences(
  catalog: VenueCatalog,
  authorizedGameIds: string[] | null
): VenueCatalog {
  if (authorizedGameIds === null) return catalog;
  const allowed = new Set(authorizedGameIds);
  return {
    ...catalog,
    games: catalog.games.filter((game) => allowed.has(game.id)),
  };
}
