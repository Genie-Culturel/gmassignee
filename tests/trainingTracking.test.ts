import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ProcedureFiche } from '../src/lib/database.types.ts';
import { buildTrackingRows, requiredFichesForGm } from '../src/lib/training.ts';
import { DEMO_CATALOG } from '../src/lib/venues.ts';

function fiche(partial: Partial<ProcedureFiche> & Pick<ProcedureFiche, 'id' | 'title'>): ProcedureFiche {
  const now = '2026-11-06T00:00:00.000Z';
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
    scope_kind: 'locations',
    scope_location_ids: ['loc-vr_center'],
    scope_game_ids: [],
    created_at: now,
    updated_at: now,
    ...partial,
  };
}

const lobby = fiche({ id: 'lobby', title: 'Setup du lobby' });
const popcorn = fiche({ id: 'popcorn', title: 'Utilisation de la machine à pop-corn' });
const general = fiche({
  id: 'general',
  title: 'Règles générales GM',
  scope_kind: 'all',
  scope_location_ids: [],
  scope_game_ids: [],
});
const sion = fiche({
  id: 'sion-accueil',
  title: 'Accueil Escape Life Sion',
  scope_kind: 'locations',
  scope_location_ids: ['loc-escape_sion'],
  scope_game_ids: [],
});
const feu = fiche({
  id: 'feu',
  title: 'Briefing Feu sacré',
  scope_kind: 'games',
  scope_location_ids: [],
  scope_game_ids: ['game-feux_sacres'],
});
const optional = fiche({
  id: 'opt',
  title: 'Fiche optionnelle',
  is_required: false,
});

const ALL = [lobby, popcorn, general, sion, feu, optional];

const profiles = [
  { gm_id: 'gm-planta', display_name: 'Aino', email: 'ainoaz@outlook.com' },
  { gm_id: 'gm-sion', display_name: 'Alex', email: 'alexandre.revaz@gmail.com' },
  { gm_id: 'gm-none', display_name: 'Baptiste', email: 'baptiste.e.1985@gmail.com' },
  { gm_id: 'gm-formateur', display_name: 'Julien', email: 'julien@genie-culturel.ch' },
];

test('requiredFichesForGm : 0 compétence → 0 fiche requise', () => {
  assert.deepEqual(requiredFichesForGm(ALL, [], DEMO_CATALOG), []);
});

test('requiredFichesForGm : Planta → circuit VR + générales, pas Sion / Feu, ignore optionnelle', () => {
  const ids = requiredFichesForGm(ALL, ['game-planta'], DEMO_CATALOG).map((row) => row.id).sort();
  assert.deepEqual(ids, ['general', 'lobby', 'popcorn']);
});

test('requiredFichesForGm : Da Vinci → Sion + générales', () => {
  const ids = requiredFichesForGm(ALL, ['game-davinci'], DEMO_CATALOG).map((row) => row.id).sort();
  assert.deepEqual(ids, ['general', 'sion-accueil']);
});

test('Suivi : dénominateurs et manquantes diffèrent par GM (plus de 0/N identique)', () => {
  const rows = buildTrackingRows(profiles, ALL, [], {
    catalog: DEMO_CATALOG,
    authorizedGameIdsByGm: {
      'gm-planta': ['game-planta'],
      'gm-sion': ['game-davinci'],
      'gm-none': [],
      'gm-formateur': null,
    },
  });
  const byId = Object.fromEntries(rows.map((row) => [row.gm_id, row]));

  assert.equal(byId['gm-planta'].total, 3);
  assert.equal(byId['gm-planta'].done, 0);
  assert.deepEqual(byId['gm-planta'].missing.sort(), ['Règles générales GM', 'Setup du lobby', 'Utilisation de la machine à pop-corn']);
  assert.equal(byId['gm-planta'].no_competences, false);

  assert.equal(byId['gm-sion'].total, 2);
  assert.deepEqual(byId['gm-sion'].missing.sort(), ['Accueil Escape Life Sion', 'Règles générales GM']);
  assert.equal(byId['gm-sion'].missing.includes('Setup du lobby'), false);

  assert.equal(byId['gm-none'].total, 0);
  assert.equal(byId['gm-none'].done, 0);
  assert.deepEqual(byId['gm-none'].missing, []);
  assert.equal(byId['gm-none'].no_competences, true);

  // Formateur (null) = pas de filtre, comme sa vue Formations : toutes les requises (5, hors optionnelle)
  assert.equal(byId['gm-formateur'].total, 5);
  assert.equal(byId['gm-formateur'].no_competences, false);
});

test('Suivi : GM absent de la map compétences → 0/0 (fail closed)', () => {
  const rows = buildTrackingRows(
    [{ gm_id: 'gm-unknown', display_name: 'X', email: 'x@y.ch' }],
    ALL,
    [],
    { catalog: DEMO_CATALOG, authorizedGameIdsByGm: { 'gm-planta': ['game-planta'] } }
  );
  assert.equal(rows[0].total, 0);
  assert.equal(rows[0].no_competences, true);
});

test('Suivi : validations comptées seulement sur les fiches du circuit du GM', () => {
  const rows = buildTrackingRows(
    [{ gm_id: 'gm-sion', display_name: 'Alex', email: 'a@b.ch' }],
    ALL,
    [
      { gm_id: 'gm-sion', fiche_id: 'lobby', version: 1, validated_at: '2026-11-06T00:00:00.000Z' },
      { gm_id: 'gm-sion', fiche_id: 'general', version: 1, validated_at: '2026-11-06T00:00:00.000Z' },
    ],
    { catalog: DEMO_CATALOG, authorizedGameIdsByGm: { 'gm-sion': ['game-davinci'] } }
  );
  // lobby n'est pas dans le circuit Sion → ignorée ; general compte ; sion-accueil manque
  assert.equal(rows[0].done, 1);
  assert.equal(rows[0].total, 2);
  assert.deepEqual(rows[0].missing, ['Accueil Escape Life Sion']);
});
