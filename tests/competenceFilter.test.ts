import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  circuitIdForGame,
  expandAuthorizedGamesToCircuit,
  filterCatalogForCompetences,
  filterFichesByCompetences,
  idsForCompetenceFilter,
  parseAuthorizedGameIds,
  authorizedGameIdsFromRpc,
} from '../src/lib/competenceFilter.ts';
import { ProcedureFiche } from '../src/lib/database.types.ts';
import { DEMO_CATALOG, VenueCatalog } from '../src/lib/venues.ts';

const catalog: VenueCatalog = DEMO_CATALOG;

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
const drinks = fiche({ id: 'drinks', title: 'Procédure des boissons' });
const room = fiche({ id: 'room', title: 'Préparer la salle' });
const helmets = fiche({
  id: 'helmets',
  title: 'Nettoyage casques et manettes entre groupes',
});
const weekly = fiche({
  id: 'weekly',
  title: 'Nettoyage hebdomadaire du centre',
  scope_kind: 'games',
  scope_location_ids: ['loc-nettoyage_center'],
  scope_game_ids: ['game-nettoyage'],
});
const general = fiche({
  id: 'general',
  title: 'Règles générales GM',
  scope_kind: 'all',
  scope_location_ids: [],
  scope_game_ids: [],
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
const magi = fiche({
  id: 'magi',
  title: 'Procédure Magi Room',
  scope_kind: 'games',
  scope_location_ids: [],
  scope_game_ids: ['game-magi_room'],
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
const davinci = fiche({
  id: 'davinci',
  title: 'Briefing Davinci',
  scope_kind: 'games',
  scope_location_ids: [],
  scope_game_ids: ['game-davinci'],
});
const davinciKids = fiche({
  id: 'davinci-kids',
  title: 'Briefing Da Vinci Kids',
  scope_kind: 'games',
  scope_location_ids: [],
  scope_game_ids: ['game-davinci_kids'],
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
const sierre = fiche({
  id: 'sierre-accueil',
  title: 'Accueil Escape Life Sierre',
  scope_kind: 'locations',
  scope_location_ids: ['loc-escape_sierre'],
  scope_game_ids: [],
});
const eventFiche = fiche({
  id: 'event',
  title: 'Briefing événement outdoor',
  scope_kind: 'games',
  scope_location_ids: [],
  scope_game_ids: ['game-event_outdoor'],
});

const ALL = [
  lobby,
  popcorn,
  drinks,
  room,
  helmets,
  weekly,
  general,
  sagaPitch,
  plantaPitch,
  magi,
  archeo,
  chandoline,
  davinci,
  davinciKids,
  sion,
  feu,
  sierre,
  eventFiche,
];

function ids(fiches: ProcedureFiche[]): string[] {
  return fiches.map((row) => row.id).sort();
}

const VR_LOOP = ['drinks', 'general', 'helmets', 'lobby', 'magi', 'planta-pitch', 'popcorn', 'room', 'saga-pitch'];

test('formateur / admin (null) : aucune fiche filtrée', () => {
  assert.equal(filterFichesByCompetences(ALL, null, catalog).length, ALL.length);
});

test('0 compétence RH : 0 fiche', () => {
  assert.deepEqual(filterFichesByCompetences(ALL, [], catalog), []);
});

test('Feu Sacré seul → circuit Escape Life Sierre + générales', () => {
  assert.deepEqual(ids(filterFichesByCompetences(ALL, ['game-feux_sacres'], catalog)), [
    'feu',
    'general',
    'sierre-accueil',
  ]);
});

test('Planta seul → toute la boucle VR Center (autres jeux du circuit) + générales', () => {
  const actual = ids(filterFichesByCompetences(ALL, ['game-planta'], catalog));
  assert.deepEqual(actual, VR_LOOP.sort());
  assert.equal(actual.includes('archeo'), false);
  assert.equal(actual.includes('weekly'), false);
  assert.equal(actual.includes('davinci'), false);
  assert.equal(actual.includes('feu'), false);
});

test('Saga voit aussi les fiches Planta / Magi (même circuit)', () => {
  const actual = ids(filterFichesByCompetences(ALL, ['game-saga'], catalog));
  assert.equal(actual.includes('planta-pitch'), true);
  assert.equal(actual.includes('saga-pitch'), true);
  assert.equal(actual.includes('magi'), true);
  assert.equal(actual.includes('lobby'), true);
  assert.equal(actual.includes('archeo'), false);
});

test('Da Vinci + Planta → Escape Life Sion + VR Center + générales', () => {
  const actual = ids(filterFichesByCompetences(ALL, ['game-planta', 'game-davinci'], catalog));
  for (const id of VR_LOOP) assert.equal(actual.includes(id), true, id);
  assert.equal(actual.includes('davinci'), true);
  assert.equal(actual.includes('davinci-kids'), true);
  assert.equal(actual.includes('sion-accueil'), true);
  assert.equal(actual.includes('feu'), false);
  assert.equal(actual.includes('archeo'), false);
});

test('Da Vinci Kids seul → même circuit Sion que Da Vinci Code', () => {
  const actual = ids(filterFichesByCompetences(ALL, ['game-davinci_kids'], catalog));
  assert.deepEqual(actual, ['davinci', 'davinci-kids', 'general', 'sion-accueil']);
});

test('Archeogame → ARCHEO Sion + générales, pas VR Center', () => {
  assert.deepEqual(ids(filterFichesByCompetences(ALL, ['game-archeogame'], catalog)), ['archeo', 'general']);
});

test('Nettoyage → circuit nettoyage + générales, pas la boucle VR', () => {
  assert.deepEqual(ids(filterFichesByCompetences(ALL, ['game-nettoyage'], catalog)), ['general', 'weekly']);
});

test('Magi Room → circuit VR Center', () => {
  const actual = ids(filterFichesByCompetences(ALL, ['game-magi_room'], catalog));
  assert.deepEqual(actual, VR_LOOP.sort());
});

test('Event outdoor → circuit Event + générales', () => {
  assert.deepEqual(ids(filterFichesByCompetences(ALL, ['game-event_outdoor'], catalog)), ['event', 'general']);
});

test('Novasphère / Chandoline : son circuit, pas VR Center', () => {
  assert.deepEqual(ids(filterFichesByCompetences(ALL, ['game-usine_chandoline'], catalog)), [
    'chandoline',
    'general',
  ]);
});

test('catalogue GM Planta : tous les jeux du circuit VR, pas Archeogame / Nettoyage / Da Vinci', () => {
  const filtered = filterCatalogForCompetences(catalog, ['game-planta']);
  const slugs = filtered.games.map((game) => game.slug).sort();
  assert.deepEqual(slugs, ['magi_room', 'planta', 'rave', 'saga', 'schoolcrafter', 'serviteur']);
  assert.equal(filtered.locations.some((location) => location.slug === 'vr_center'), true);
  assert.equal(filtered.locations.some((location) => location.slug === 'escape_sion'), false);
});

test('catalogue Da Vinci + Planta : VR Center + Escape Life Sion', () => {
  const filtered = filterCatalogForCompetences(catalog, ['game-planta', 'game-davinci']);
  const locSlugs = filtered.locations.map((location) => location.slug).sort();
  assert.deepEqual(locSlugs, ['escape_sion', 'vr_center']);
  assert.equal(filtered.games.some((game) => game.slug === 'davinci_kids'), true);
  assert.equal(filtered.games.some((game) => game.slug === 'feux_sacres'), false);
});

test('expandAuthorizedGamesToCircuit : Planta → jeux VR Center', () => {
  const expanded = expandAuthorizedGamesToCircuit(['game-planta'], catalog) || [];
  assert.equal(expanded.includes('game-saga'), true);
  assert.equal(expanded.includes('game-archeogame'), false);
  assert.equal(expandAuthorizedGamesToCircuit([], catalog)?.length, 0);
  assert.equal(expandAuthorizedGamesToCircuit(null, catalog), null);
});

test('circuitIdForGame : overrides Archeogame / Nettoyage même si le jeu est encore sous vr_center', () => {
  const misplacedArcheo = { ...catalog.games.find((game) => game.slug === 'archeogame')!, location_id: 'loc-vr_center' };
  assert.equal(circuitIdForGame(misplacedArcheo, catalog), 'loc-archeo_sion');
  const misplacedNettoyage = {
    ...catalog.games.find((game) => game.slug === 'nettoyage')!,
    location_id: 'loc-vr_center',
  };
  assert.equal(circuitIdForGame(misplacedNettoyage, catalog), 'loc-nettoyage_center');
});

function liveBeforeSqlCatalog(): VenueCatalog {
  return {
    locations: catalog.locations.filter(
      (location) => !['archeo_sion', 'nettoyage_center', 'event'].includes(location.slug)
    ),
    games: catalog.games
      .filter((game) => !['magi_room', 'rave', 'davinci_kids', 'davinci_vinum', 'event_outdoor'].includes(game.slug))
      .map((game) =>
        game.slug === 'archeogame' || game.slug === 'nettoyage'
          ? { ...game, location_id: 'loc-vr_center' }
          : game
      ),
  };
}

test('live avant SQL 057 : Archeogame encore sous vr_center n’ouvre pas la boucle VR', () => {
  const live = liveBeforeSqlCatalog();
  const actual = ids(filterFichesByCompetences(ALL, ['game-archeogame'], live));
  assert.equal(actual.includes('archeo'), true);
  assert.equal(actual.includes('general'), true);
  assert.equal(actual.includes('lobby'), false);
  assert.equal(actual.includes('planta-pitch'), false);

  const planta = ids(filterFichesByCompetences(ALL, ['game-planta'], live));
  assert.equal(planta.includes('lobby'), true);
  assert.equal(planta.includes('saga-pitch'), true);
  assert.equal(planta.includes('archeo'), false);
  assert.equal(planta.includes('weekly'), false);
});

test('catalogue Archeogame (jeu encore sous vr_center) : pas le lieu VR Center', () => {
  const live = liveBeforeSqlCatalog();
  const filtered = filterCatalogForCompetences(live, ['game-archeogame']);
  assert.deepEqual(
    filtered.games.map((game) => game.slug),
    ['archeogame']
  );
  assert.equal(filtered.locations.some((location) => location.slug === 'vr_center'), false);
});

test('parseAuthorizedGameIds / idsForCompetenceFilter', () => {
  assert.deepEqual(parseAuthorizedGameIds(null), []);
  assert.deepEqual(parseAuthorizedGameIds(['game-saga', '', 1, null]), ['game-saga']);
  assert.deepEqual(idsForCompetenceFilter(false, null), []);
  assert.equal(idsForCompetenceFilter(true, []), null);
});

test('authorizedGameIdsFromRpc : null formateur ≠ [] (0 compétence)', () => {
  assert.equal(authorizedGameIdsFromRpc(null), null);
  assert.equal(authorizedGameIdsFromRpc(undefined), null);
  assert.deepEqual(authorizedGameIdsFromRpc([]), []);
  assert.deepEqual(authorizedGameIdsFromRpc(['game-planta']), ['game-planta']);
});
