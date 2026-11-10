import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ProcedureFiche } from '../src/lib/database.types.ts';
import {
  assertFicheReorderWriteResult,
  sortFichesByOrder,
  sortOrderUpdatesForVisibleReorder,
} from '../src/lib/training.ts';
import { groupFichesBySubGroup } from '../src/lib/ficheSubGroups.ts';

function fiche(
  partial: Partial<ProcedureFiche> & Pick<ProcedureFiche, 'id' | 'title'>
): ProcedureFiche {
  const now = '2026-11-10T00:00:00.000Z';
  return {
    category: 'procedure_deroulement',
    summary: null,
    content_steps: [],
    is_placeholder: false,
    tags: [],
    is_active: true,
    is_required: true,
    version: 1,
    deleted_at: null,
    sort_order: 0,
    scope_kind: 'locations',
    sub_group: 'vr_center',
    scope_location_ids: ['loc-vr_center'],
    scope_game_ids: [],
    created_at: now,
    updated_at: now,
    ...partial,
  };
}

const lobby = fiche({ id: 'lobby', title: 'Setup du lobby', sort_order: 0 });
const salle = fiche({ id: 'salle', title: 'Préparer la salle', sort_order: 0 });
const popcorn = fiche({ id: 'popcorn', title: 'Utilisation de la machine à pop-corn', sort_order: 0 });
const accueil = fiche({ id: 'accueil', title: 'Accueil des clients', sort_order: 0 });
const general = fiche({
  id: 'general',
  title: 'Règles générales GM',
  sort_order: 0,
  sub_group: null,
  scope_kind: 'all',
  scope_location_ids: [],
});

test('doublons sort_order : le glisser-déposer numérote tout le groupe en 10, 20, 30…', () => {
  const group = [lobby, salle, popcorn, accueil];
  const updates = sortOrderUpdatesForVisibleReorder(group, ['accueil', 'lobby', 'salle', 'popcorn']);
  assert.deepEqual(updates, [
    { id: 'accueil', sort_order: 10 },
    { id: 'lobby', sort_order: 20 },
    { id: 'salle', sort_order: 30 },
    { id: 'popcorn', sort_order: 40 },
  ]);
});

test('après persist, le tri sort_order+titre conserve l’ordre choisi (plus de mélange par titre)', () => {
  const group = [lobby, salle, popcorn, accueil];
  const updates = sortOrderUpdatesForVisibleReorder(group, ['popcorn', 'accueil', 'salle', 'lobby']);
  const byId = new Map(updates.map((row) => [row.id, row.sort_order]));
  const resorted = sortFichesByOrder(
    group.map((row) => ({ ...row, sort_order: byId.get(row.id) }))
  ).map((row) => row.id);
  assert.deepEqual(resorted, ['popcorn', 'accueil', 'salle', 'lobby']);
});

test('réutiliser les slots dupliqués (ancien algo) ne survit pas au rechargement', () => {
  const group = [lobby, salle, popcorn];
  const intended = ['popcorn', 'lobby', 'salle'];
  const slots = [...group.map((row) => row.sort_order ?? 0)].sort((a, b) => a - b);
  const reused = intended.map((id, index) => ({
    id,
    sort_order: slots[index] ?? (index + 1) * 10,
  }));
  const byId = new Map(reused.map((row) => [row.id, row.sort_order]));
  const afterReload = sortFichesByOrder(
    group.map((row) => ({ ...row, sort_order: byId.get(row.id) }))
  ).map((row) => row.id);
  assert.deepEqual(afterReload, sortFichesByOrder(group).map((row) => row.id));
  assert.notDeepEqual(afterReload, intended);
});

test('un groupe filtré est recousu dans le groupe complet sans toucher les fiches cachées', () => {
  const group = [
    fiche({ id: 'a', title: 'A', sort_order: 10 }),
    fiche({ id: 'b', title: 'B', sort_order: 20 }),
    fiche({ id: 'c', title: 'C', sort_order: 30 }),
    fiche({ id: 'd', title: 'D', sort_order: 40 }),
  ];
  // Filtre jeu : B et D cachées. L’utilisateur met C devant A.
  const updates = sortOrderUpdatesForVisibleReorder(group, ['c', 'a']);
  assert.deepEqual(updates, [
    { id: 'c', sort_order: 10 },
    { id: 'b', sort_order: 20 },
    { id: 'a', sort_order: 30 },
    { id: 'd', sort_order: 40 },
  ]);
});

test('réordonner VR Center ne change pas les ids du groupe Général', () => {
  const grouped = groupFichesBySubGroup([lobby, salle, popcorn, general]);
  const vr = grouped.find((row) => row.value === 'vr_center');
  const gen = grouped.find((row) => row.value === null);
  assert.ok(vr && gen);
  const vrIds = new Set(vr.fiches.map((row) => row.id));
  const updates = sortOrderUpdatesForVisibleReorder(vr.fiches, ['popcorn', 'salle', 'lobby']);
  assert.deepEqual(updates.map((row) => row.id).sort(), [...vrIds].sort());
  assert.equal(updates.some((row) => row.id === general.id), false);
  assert.deepEqual(gen.fiches.map((row) => row.id), ['general']);
});

test('assertFicheReorderWriteResult : 0 ligne (RLS) → erreur', () => {
  assert.throws(
    () => assertFicheReorderWriteResult([], { id: 'lobby', sort_order: 10 }),
    /non enregistré/
  );
  assert.throws(
    () => assertFicheReorderWriteResult(null, { id: 'lobby', sort_order: 10 }),
    /non enregistré/
  );
});

test('assertFicheReorderWriteResult : sort_order renvoyé différent → erreur', () => {
  assert.throws(
    () =>
      assertFicheReorderWriteResult([{ id: 'lobby', sort_order: 0 }], {
        id: 'lobby',
        sort_order: 10,
      }),
    /non enregistré/
  );
});

test('assertFicheReorderWriteResult : update OK', () => {
  assert.doesNotThrow(() =>
    assertFicheReorderWriteResult([{ id: 'lobby', sort_order: 10 }], {
      id: 'lobby',
      sort_order: 10,
    })
  );
});
