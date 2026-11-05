import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  deriveScopeKind,
  describeFicheVisibility,
  ficheScopeBadgeItems,
  gamePlusVrCenterShortcutScope,
} from '../src/lib/ficheScope.ts';
import { ProcedureFiche } from '../src/lib/database.types.ts';
import { DEMO_CATALOG } from '../src/lib/venues.ts';

const catalog = DEMO_CATALOG;

function pitch(): ProcedureFiche {
  const now = '2026-11-05T00:00:00.000Z';
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
    scope_location_ids: ['loc-vr_center'],
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

test('Pitch Planta double tag : badges VR Center + Bataille de la Planta', () => {
  const labels = ficheScopeBadgeItems(pitch(), catalog).map((item) => item.label);
  assert.deepEqual(labels, ['VR Center', 'Bataille de la Planta']);
});

test('Pitch Planta sans lieu en base : badge VR Center inféré (jeu circuit)', () => {
  const row = pitch();
  row.scope_location_ids = [];
  const labels = ficheScopeBadgeItems(row, catalog).map((item) => item.label);
  assert.deepEqual(labels, ['VR Center', 'Bataille de la Planta']);
});

test('aperçu Pitch Planta + VR Center : compétence Planta, pas tout le circuit', () => {
  const text = describeFicheVisibility(catalog, ['loc-vr_center'], ['game-planta']);
  assert.match(text, /Bataille de la Planta/);
  assert.match(text, /tag VR Center/);
  assert.equal(/Serviteur|Saga|Schoolcrafter/.test(text), false);
});

test('aperçu circuit VR seul : jeux VR Centre', () => {
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

test('raccourci Ce jeu + VR Center', () => {
  assert.deepEqual(gamePlusVrCenterShortcutScope(catalog, 'game-planta'), {
    locationIds: ['loc-vr_center'],
    gameIds: ['game-planta'],
  });
});
