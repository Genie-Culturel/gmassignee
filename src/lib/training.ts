import { FicheCategory, FicheValidation, ProcedureFiche } from './database.types';
import { FORMATION_PAGE_CATEGORIES } from './constants';
import { filterFichesByCompetences } from './competenceFilter';
import { VenueCatalog } from './venues';

export interface GmTrainingRow {
  gm_id: string;
  display_name: string;
  email: string;
  done: number;
  total: number;
  missing: string[];
  revalidate: string[];
  /** True when the GM has 0 RH compétence (progression 0/0). */
  no_competences: boolean;
}

function gameIdsForProfile(
  gmId: string,
  authorizedGameIdsByGm?: Map<string, string[] | null> | Record<string, string[] | null>
): string[] | null | undefined {
  if (!authorizedGameIdsByGm) return undefined;
  if (authorizedGameIdsByGm instanceof Map) {
    return authorizedGameIdsByGm.has(gmId) ? authorizedGameIdsByGm.get(gmId) : [];
  }
  return Object.prototype.hasOwnProperty.call(authorizedGameIdsByGm, gmId)
    ? authorizedGameIdsByGm[gmId]
    : [];
}

export function buildTrackingRows(
  profiles: { gm_id: string; display_name: string; email: string }[],
  fiches: ProcedureFiche[],
  validations: FicheValidation[],
  opts?: {
    catalog?: VenueCatalog;
    authorizedGameIdsByGm?: Map<string, string[] | null> | Record<string, string[] | null>;
  }
): GmTrainingRow[] {
  const catalog = opts?.catalog;
  const byGm = opts?.authorizedGameIdsByGm;
  return profiles.map((profile) => {
    const gameIds = gameIdsForProfile(profile.gm_id, byGm);
    const noCompetences = gameIds !== undefined && gameIds !== null && gameIds.length === 0;
    const required =
      catalog && gameIds !== undefined
        ? requiredFichesForGm(fiches, gameIds, catalog)
        : requiredTrainingFiches(fiches);
    const mine = validations.filter((row) => row.gm_id === profile.gm_id);
    const byFiche = new Map(mine.map((row) => [row.fiche_id, row]));
    const missing: string[] = [];
    const revalidate: string[] = [];
    let done = 0;
    for (const fiche of required) {
      const row = byFiche.get(fiche.id);
      if (!row) missing.push(fiche.title);
      else if (row.version < (fiche.version ?? 1)) revalidate.push(fiche.title);
      else done += 1;
    }
    return {
      gm_id: profile.gm_id,
      display_name: profile.display_name,
      email: profile.email,
      done,
      total: required.length,
      missing,
      revalidate,
      no_competences: noCompetences,
    };
  });
}

export type TrainingStatus = 'todo' | 'done' | 'revalidate';

export const TRAINING_STATUS_LABELS: Record<TrainingStatus, string> = {
  todo: 'À faire',
  done: 'Validée',
  revalidate: 'À revalider',
};

export function ficheVersion(fiche: ProcedureFiche): number {
  return fiche.version ?? 1;
}

export function ficheIsRequired(fiche: ProcedureFiche): boolean {
  return fiche.is_required !== false;
}

export function isFicheDeleted(fiche: Pick<ProcedureFiche, 'deleted_at'>): boolean {
  return Boolean(fiche.deleted_at);
}

export function sortFichesByOrder(fiches: ProcedureFiche[]): ProcedureFiche[] {
  return [...fiches].sort((a, b) => {
    const order = (a.sort_order ?? 0) - (b.sort_order ?? 0);
    if (order !== 0) return order;
    return a.title.localeCompare(b.title, 'fr');
  });
}

export function sortOrderUpdatesForVisibleReorder(
  visible: ProcedureFiche[],
  orderedIds: string[]
): { id: string; sort_order: number }[] {
  const slots = [...visible.map((fiche) => fiche.sort_order ?? 0)].sort((a, b) => a - b);
  return orderedIds.map((id, index) => ({ id, sort_order: slots[index] ?? (index + 1) * 10 }));
}

export function requiredTrainingFiches(fiches: ProcedureFiche[]): ProcedureFiche[] {
  return fiches.filter(
    (fiche) =>
      !isFicheDeleted(fiche) &&
      fiche.is_active &&
      ficheIsRequired(fiche) &&
      FORMATION_PAGE_CATEGORIES.includes(fiche.category)
  );
}

/**
 * Fiches requises pour UN GM : même filtre circuit que sa vue Formations
 * (`filterFichesByCompetences` + fiches actives/requises).
 * `authorizedGameIds === null` → pas de filtre (formateur). `[]` → 0 fiche.
 */
export function requiredFichesForGm(
  fiches: ProcedureFiche[],
  authorizedGameIds: string[] | null,
  catalog: VenueCatalog
): ProcedureFiche[] {
  return requiredTrainingFiches(filterFichesByCompetences(fiches, authorizedGameIds, catalog));
}

export function ficheStatus(
  fiche: ProcedureFiche,
  validation: FicheValidation | undefined
): TrainingStatus {
  if (!validation) return 'todo';
  if (validation.version < ficheVersion(fiche)) return 'revalidate';
  return 'done';
}

export function validationMap(rows: FicheValidation[]): Map<string, FicheValidation> {
  const map = new Map<string, FicheValidation>();
  for (const row of rows) map.set(row.fiche_id, row);
  return map;
}

export function progressFor(
  fiches: ProcedureFiche[],
  validations: FicheValidation[],
  category?: FicheCategory
) {
  const required = requiredTrainingFiches(fiches).filter((fiche) =>
    category ? fiche.category === category : true
  );
  const byFiche = validationMap(validations);
  let done = 0;
  let revalidate = 0;
  let todo = 0;
  for (const fiche of required) {
    const status = ficheStatus(fiche, byFiche.get(fiche.id));
    if (status === 'done') done += 1;
    else if (status === 'revalidate') revalidate += 1;
    else todo += 1;
  }
  return {
    total: required.length,
    done,
    revalidate,
    todo,
    percent: required.length ? Math.round((done / required.length) * 100) : 0,
  };
}
