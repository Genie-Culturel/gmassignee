import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  circuitShortcutScope,
  deriveScopeKind,
  describeFicheVisibility,
  ficheScopeBadgeItems,
} from '../src/lib/ficheScope.ts';
import { ProcedureFiche } from '../src/lib/database.types.ts';
import { DEMO_CATALOG } from '../src/lib/venues.ts';

const catalog = DEMO_CATALOG;

function pitch(): ProcedureFiche {
  const now = '2026-11-06T00:00:00.000Z';
  return {
    id: 'planta-pitch',
    category: 'procedure_deroulement',
    title: 'Présentation : Bataille de la Planta',
    summary: null,
    content_steps: [],
    is_placeholder: false,
    tags: [],
    is_active: true,
    is_required: false,
    version: 1,
    deleted_at: null,
    scope_kind: 'games',
    scope_location_ids: [],
    scope_game_ids: ['game-planta'],
    created_at: now,
    updated_at: now,
  };
}

test('deriveScopeKind : jeux (+ lieu) → games, lieux seuls → locations, vide → all', () => {
  assert.equal(deriveScopeKind([], []), 'all');
  assert.equal(deriveScopeKind(['loc-vr_center'], []), 'locations');
  assert.equal(deriveScopeKind([], ['game-planta']), 'games');
  assert.equal(deriveScopeKind(['loc-vr_center'], ['game-planta']), 'games');
});

test('Pitch Planta : badge circuit VR Center inféré + nom du jeu', () => {
  const labels = ficheScopeBadgeItems(pitch(), catalog).map((item) => item.label);
  assert.deepEqual(labels, ['VR Center', 'Bataille de la Planta']);
});

test('aperçu Pitch Planta : tout le circuit VR, pas seulement Planta', () => {
  const text = describeFicheVisibility(catalog, [], ['game-planta']);
  assert.match(text, /circuit VR Center/);
  assert.match(text, /Bataille de la Planta/);
  assert.match(text, /Saga/);
  assert.match(text, /Magi Room/);
});

test('aperçu circuit VR seul : jeux du lieu', () => {
  const text = describeFicheVisibility(catalog, ['loc-vr_center'], []);
  assert.match(text, /circuit VR Center/);
  assert.match(text, /Planta/);
  assert.match(text, /Saga/);
});

test('aperçu 0 chip : GM avec compétence, pas les GM sans', () => {
  const text = describeFicheVisibility(catalog, [], []);
  assert.match(text, /au moins une compétence/);
  assert.match(text, /sans compétence/);
});

test('raccourci circuit du jeu dominant', () => {
  assert.deepEqual(circuitShortcutScope(catalog, 'loc-vr_center'), {
    locationIds: ['loc-vr_center'],
    gameIds: [],
  });
});
