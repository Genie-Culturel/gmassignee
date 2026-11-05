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

const catalog: VenueCatalog = DEMO_CATALOG;

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
  scope_location_ids: ['loc-vr_center'],
  scope_game_ids: ['game-planta'],
});
const plantaStart = fiche({
  id: 'planta-start',
  title: 'Pitch start : Bataille de la Planta',
  scope_kind: 'games',
  scope_location_ids: ['loc-vr_center'],
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
  plantaStart,
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

const CIRCUIT = ['drinks', 'helmets', 'lobby', 'popcorn', 'room'];

function expectIds(actual: string[], extra: string[]) {
  assert.deepEqual(actual, [...CIRCUIT, ...extra].sort());
}

test('Saga : circuit VR Center + fiches Saga, sans Planta / Archeogame / Chandoline / semaine', () => {
  const ids = titles(filterFichesByCompetences(ALL, ['game-saga'], catalog));
  expectIds(ids, ['saga-pitch']);
  assert.equal(ids.includes('planta-pitch'), false);
  assert.equal(ids.includes('weekly'), false);
});

test('Planta : circuit VR Center + fiches Planta (pas Archeogame / Chandoline / semaine)', () => {
  const ids = titles(filterFichesByCompetences(ALL, ['game-planta'], catalog));
  expectIds(ids, ['planta-pitch', 'planta-start']);
  assert.equal(ids.includes('archeo'), false);
  assert.equal(ids.includes('weekly'), false);
});

test('double tag Pitch/Présentation Planta : visible Planta, pas Saga (le lieu VR n’élargit pas)', () => {
  const plantaIds = titles(filterFichesByCompetences(ALL, ['game-planta'], catalog));
  const sagaIds = titles(filterFichesByCompetences(ALL, ['game-saga'], catalog));
  assert.equal(plantaIds.includes('planta-pitch'), true);
  assert.equal(plantaIds.includes('planta-start'), true);
  assert.equal(plantaIds.includes('lobby'), true);
  assert.equal(sagaIds.includes('planta-pitch'), false);
  assert.equal(sagaIds.includes('planta-start'), false);
  assert.equal(sagaIds.includes('lobby'), true);
});

test('Planta + Da Vinci : circuit VR + Planta + fiches Da Vinci / lieu Sion', () => {
  const briefing = fiche({
    id: 'davinci',
    title: 'Briefing Davinci',
    scope_kind: 'games',
    scope_location_ids: [],
    scope_game_ids: ['game-davinci'],
  });
  const sion = fiche({
    id: 'sion-accueil',
    title: 'Accueil Escape Life Sion',
    scope_kind: 'locations',
    scope_location_ids: ['loc-escape_sion'],
    scope_game_ids: [],
  });
  const ids = titles(
    filterFichesByCompetences([...ALL, briefing, sion], ['game-planta', 'game-davinci'], catalog)
  );
  expectIds(ids, ['davinci', 'planta-pitch', 'planta-start', 'sion-accueil']);
});

test('Serviteur : circuit VR Center + fiches Serviteur', () => {
  const launch = fiche({
    id: 'serv-launch',
    title: 'Lancement du Serviteur',
    scope_kind: 'games',
    scope_location_ids: [],
    scope_game_ids: ['game-serviteur'],
  });
  const ids = titles(filterFichesByCompetences([...ALL, launch], ['game-serviteur'], catalog));
  expectIds(ids, ['serv-launch']);
});

test('Schoolcrafter : circuit VR Center + fiches Schoolcrafter', () => {
  const procedure = fiche({
    id: 'school-proc',
    title: 'Procédure GM Schoolcrafter',
    scope_kind: 'games',
    scope_location_ids: [],
    scope_game_ids: ['game-schoolcrafter'],
  });
  const ids = titles(filterFichesByCompetences([...ALL, procedure], ['game-schoolcrafter'], catalog));
  expectIds(ids, ['school-proc']);
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
