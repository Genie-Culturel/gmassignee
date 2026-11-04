import { ProcedureFiche } from '@/lib/database.types';
import { sortFichesByOrder } from '@/lib/training';

/** Sous-catégories d'affichage. `null` = Général (tous les jeux / lieux). */
export type FicheSubGroup = string | null;

export const FICHE_SUB_GROUPS: { value: FicheSubGroup; label: string }[] = [
  { value: null, label: 'Général' },
  { value: 'vr_center', label: 'VR Center' },
  { value: 'escape_life', label: 'Escape Life (Sion et Sierre)' },
  { value: 'escape_sion', label: 'Escape Life Sion' },
  { value: 'escape_sierre', label: 'Escape Life Sierre' },
  { value: 'chandoline', label: 'Usine de Chandoline (Novasphère)' },
];

export function ficheSubGroupLabel(value: FicheSubGroup): string {
  return FICHE_SUB_GROUPS.find((group) => group.value === value)?.label ?? value ?? 'Général';
}

const DEMO_GAME_LOCATION: Record<string, string> = {
  feux_sacres: 'escape_sierre',
  davinci: 'escape_sion',
  usine_chandoline: 'chandoline',
  novasphere: 'chandoline',
};

/** Colonne sub_group en base ; en démo (colonne absente) on la déduit de la portée. */
export function ficheSubGroup(fiche: ProcedureFiche): FicheSubGroup {
  if (fiche.sub_group !== undefined) return fiche.sub_group;
  if (!fiche.scope_kind || fiche.scope_kind === 'all') return null;
  const ids = fiche.scope_kind === 'games' ? fiche.scope_game_ids || [] : fiche.scope_location_ids || [];
  const slugs = new Set(
    ids.map((id) => {
      const slug = id.replace(/^(loc|game)-/, '');
      return fiche.scope_kind === 'games' ? DEMO_GAME_LOCATION[slug] ?? 'vr_center' : slug;
    })
  );
  if (slugs.size === 1) return [...slugs][0];
  if ([...slugs].every((slug) => slug === 'escape_sion' || slug === 'escape_sierre')) return 'escape_life';
  return null;
}

/** Groupes non vides dans l'ordre : Général, puis par lieu ; fiches triées par sort_order. */
export function groupFichesBySubGroup(
  fiches: ProcedureFiche[]
): { value: FicheSubGroup; label: string; fiches: ProcedureFiche[] }[] {
  const known = FICHE_SUB_GROUPS.map((group) => group.value);
  const extra = [...new Set(fiches.map(ficheSubGroup))].filter((value) => !known.includes(value));
  return [...known, ...extra]
    .map((value) => ({
      value,
      label: ficheSubGroupLabel(value),
      fiches: sortFichesByOrder(fiches.filter((fiche) => ficheSubGroup(fiche) === value)),
    }))
    .filter((group) => group.fiches.length > 0);
}
