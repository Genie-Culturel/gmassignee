import { FicheCategory, FicheValidation, ProcedureFiche } from './database.types';
import { FORMATION_PAGE_CATEGORIES } from './constants';

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

export function requiredTrainingFiches(fiches: ProcedureFiche[]): ProcedureFiche[] {
  return fiches.filter(
    (fiche) =>
      fiche.is_active &&
      ficheIsRequired(fiche) &&
      FORMATION_PAGE_CATEGORIES.includes(fiche.category)
  );
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
