import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  filterCatalogForCompetences,
  filterFichesByCompetences,
  idsForCompetenceFilter,
  parseAuthorizedGameIds,
} from '../src/lib/competenceFilter.ts';
import { ProcedureFiche } from '../src/lib/database.types.ts';
import { DEMO_CATALOG, VenueCatalog } from '../src/lib/venues.ts';

const catalog: VenueCatalog = {
  ...DEMO_CATALOG,
  games: [
    ...DEMO_CATALOG.games,
    {
      id: 'game-archeogame',
      location_id: 'loc-vr_center',
      slug: 'archeogame',
      name: 'ARcheo Game',
      sort_index: 5,
    },
    {
      id: 'game-nettoyage',
      location_id: 'loc-vr_center',
      slug: 'nettoyage',
      name: 'Nettoyage centre VR',
      sort_index: 6,
    },
  ],
};

function fiche(partial: Partial<ProcedureFiche> & Pick<ProcedureFiche, 'id' | 'title'>): ProcedureFiche {
  const now = '2026-11-05T00:00:00.000Z';
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
const drinks = fiche({ id: 'drinks', title: 'Procédure des boissons' });
const room = fiche({ id: 'room', title: 'Préparer la salle' });
const helmets = fiche({
  id: 'helmets',
  title: 'Nettoyage casques et manettes entre groupes',
  tags: ['nettoyage', 'hygiène', 'matériel'],
});
const weekly = fiche({
  id: 'weekly',
  title: 'Nettoyage hebdomadaire du centre',
  tags: ['nettoyage', 'semaine'],
});
const sagaPitch = fiche({
  id: 'saga-pitch',
  title: 'Présentation : La Saga',
  scope_kind: 'games',
  scope_location_ids: [],
  scope_game_ids: ['game-saga'],
});
const plantaPitch = fiche({
  id: 'planta-pitch',
  title: 'Présentation : Bataille de la Planta',
  scope_kind: 'games',
  scope_location_ids: [],
  scope_game_ids: ['game-planta'],
});
const archeo = fiche({
  id: 'archeo',
  title: 'Procédure ARcheo Game',
  scope_kind: 'games',
  scope_location_ids: [],
  scope_game_ids: ['game-archeogame'],
});
const chandoline = fiche({
  id: 'chandoline',
  title: 'Accueil Usine de Chandoline',
  scope_kind: 'locations',
  scope_location_ids: ['loc-chandoline'],
  scope_game_ids: [],
});
const novasphere = fiche({
  id: 'nova',
  title: 'Procédure Novasphère',
  scope_kind: 'games',
  scope_location_ids: [],
  scope_game_ids: ['game-usine_chandoline'],
});

const ALL = [
  lobby,
  popcorn,
  drinks,
  room,
  helmets,
  weekly,
  sagaPitch,
  plantaPitch,
  archeo,
  chandoline,
  novasphere,
];

function titles(fiches: ProcedureFiche[]): string[] {
  return fiches.map((row) => row.id).sort();
}

test('formateur / admin (null) : aucune fiche filtrée', () => {
  assert.equal(filterFichesByCompetences(ALL, null, catalog).length, ALL.length);
});

test('0 compétence RH : 0 fiche (pas de circuit VR Center par défaut)', () => {
  assert.deepEqual(filterFichesByCompetences(ALL, [], catalog), []);
});

test('Saga : circuit VR Center + fiches Saga, sans Planta / Archeogame / Chandoline / semaine', () => {
  const ids = titles(filterFichesByCompetences(ALL, ['game-saga'], catalog));
  assert.deepEqual(ids, ['drinks', 'helmets', 'lobby', 'popcorn', 'room', 'saga-pitch']);
});

test('Archeogame : seulement fiches Archeogame, pas le circuit VR', () => {
  const ids = titles(filterFichesByCompetences(ALL, ['game-archeogame'], catalog));
  assert.deepEqual(ids, ['archeo']);
});

test('nettoyage : seulement fiches nettoyage (session + semaine), rien d’autre', () => {
  const ids = titles(filterFichesByCompetences(ALL, ['game-nettoyage'], catalog));
  assert.deepEqual(ids, ['helmets', 'weekly']);
});

test('Novasphère : fiches Chandoline / jeu, pas le circuit VR Center', () => {
  const ids = titles(filterFichesByCompetences(ALL, ['game-usine_chandoline'], catalog));
  assert.deepEqual(ids, ['chandoline', 'nova']);
});

test('Da Vinci seul : pas le circuit VR Center', () => {
  const briefing = fiche({
    id: 'davinci',
    title: 'Briefing Davinci',
    scope_kind: 'games',
    scope_location_ids: [],
    scope_game_ids: ['game-davinci'],
  });
  const ids = titles(filterFichesByCompetences([...ALL, briefing], ['game-davinci'], catalog));
  assert.deepEqual(ids, ['davinci']);
});

test('catalogue GM : seulement les jeux autorisés', () => {
  const filtered = filterCatalogForCompetences(catalog, ['game-saga']);
  assert.deepEqual(
    filtered.games.map((game) => game.slug),
    ['saga']
  );
  assert.equal(filterCatalogForCompetences(catalog, null).games.length, catalog.games.length);
});

test('parseAuthorizedGameIds : null / vide / garbage → [] (jamais tout afficher)', () => {
  assert.deepEqual(parseAuthorizedGameIds(null), []);
  assert.deepEqual(parseAuthorizedGameIds(undefined), []);
  assert.deepEqual(parseAuthorizedGameIds({}), []);
  assert.deepEqual(parseAuthorizedGameIds([]), []);
  assert.deepEqual(parseAuthorizedGameIds(['game-saga', '', 1, null]), ['game-saga']);
});

test('idsForCompetenceFilter : GM null → [] (0 fiche), formateur → null', () => {
  assert.deepEqual(idsForCompetenceFilter(false, null), []);
  assert.deepEqual(idsForCompetenceFilter(false, undefined), []);
  assert.deepEqual(idsForCompetenceFilter(false, []), []);
  assert.equal(idsForCompetenceFilter(true, []), null);
  assert.equal(idsForCompetenceFilter(true, null), null);
  const lobbyOnly = filterFichesByCompetences(
    ALL,
    idsForCompetenceFilter(false, null),
    catalog
  );
  assert.deepEqual(lobbyOnly, []);
});
