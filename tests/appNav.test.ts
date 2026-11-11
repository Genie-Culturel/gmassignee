import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  appLocationChanged,
  appNavTo,
  appSectionFromPathname,
  appSectionFromSearch,
  applyAppNavFlags,
  pagesHrefFromLocation,
  resolveAppLocation,
  stripRouteTabParam,
} from '../src/lib/appNav.ts';

const BASE = '/gmassignee/';

test('appSectionFromPathname lit HashRouter et ignore le basename Pages', () => {
  assert.equal(appSectionFromPathname('/suivi-parties'), 'suivi-parties');
  assert.equal(appSectionFromPathname('/formation'), 'formation');
  assert.equal(appSectionFromPathname('/dashboard'), 'dashboard');
  assert.equal(appSectionFromPathname('/'), 'dashboard');
  assert.equal(appSectionFromPathname('/gmassignee/suivi-parties'), 'suivi-parties');
  assert.equal(appSectionFromPathname('/gmassignee/formation'), 'formation');
});

test('appSectionFromSearch : ?tab= ouvre la bonne section', () => {
  assert.equal(appSectionFromSearch('?tab=suivi-parties'), 'suivi-parties');
  assert.equal(appSectionFromSearch('tab=suivi'), 'suivi-parties');
  assert.equal(appSectionFromSearch('?tab=formation'), 'formation');
  assert.equal(appSectionFromSearch('?tab=Formations et procédures'), 'formation');
  assert.equal(appSectionFromSearch('?tab=admin'), 'formation');
  assert.equal(appSectionFromSearch('?tab=dashboard'), 'dashboard');
  assert.equal(appSectionFromSearch(''), null);
  assert.equal(appSectionFromSearch('?demo=1'), null);
});

test('stripRouteTabParam enlève tab=suivi/formation mais garde tab=admin', () => {
  assert.equal(stripRouteTabParam('?tab=suivi-parties&demo=1'), '?demo=1');
  assert.equal(stripRouteTabParam('?tab=admin&editor=fiches'), '?tab=admin&editor=fiches');
  assert.equal(stripRouteTabParam('?handoff=1'), '?handoff=1');
});

test('resolveAppLocation : ?tab= depuis le hub Historique', () => {
  const flags = { showSuiviParties: true, showFormations: true };
  assert.deepEqual(resolveAppLocation('/dashboard', '?tab=suivi-parties', flags), {
    pathname: '/suivi-parties',
    search: '',
  });
  assert.deepEqual(resolveAppLocation('/dashboard', '?tab=formation', flags), {
    pathname: '/formation',
    search: '',
  });
  assert.deepEqual(resolveAppLocation('/dashboard', '?tab=admin', flags), {
    pathname: '/formation',
    search: '?tab=admin',
  });
  assert.deepEqual(resolveAppLocation('/formation', '?tab=admin', flags), {
    pathname: '/formation',
    search: '?tab=admin',
  });
  assert.deepEqual(resolveAppLocation('/suivi-parties', '', flags), {
    pathname: '/suivi-parties',
    search: '',
  });
  assert.equal(
    appLocationChanged('/dashboard', '?tab=suivi-parties', {
      pathname: '/suivi-parties',
      search: '',
    }),
    true
  );
  assert.equal(
    appLocationChanged('/suivi-parties', '', { pathname: '/suivi-parties', search: '' }),
    false
  );
});

test('resolveAppLocation respecte les Options GM', () => {
  const hidden = { showSuiviParties: false, showFormations: false };
  assert.deepEqual(resolveAppLocation('/suivi-parties', '', hidden), {
    pathname: '/dashboard',
    search: '',
  });
  assert.deepEqual(resolveAppLocation('/dashboard', '?tab=formation', hidden), {
    pathname: '/dashboard',
    search: '',
  });
  assert.equal(applyAppNavFlags('suivi-parties', { showSuiviParties: true, showFormations: false }), 'suivi-parties');
  assert.equal(applyAppNavFlags('formation', { showSuiviParties: true, showFormations: false }), 'dashboard');
});

test('appNavTo : liens nav Suivi / Formations / Éditeur', () => {
  assert.equal(appNavTo('dashboard'), '/dashboard');
  assert.equal(appNavTo('suivi-parties'), '/suivi-parties');
  assert.equal(appNavTo('formation'), '/formation');
  assert.equal(appNavTo('formation', { editor: true }), '/formation?tab=admin');
});

test('pagesHrefFromLocation : chemin Pages /suivi-parties → hash', () => {
  assert.equal(
    pagesHrefFromLocation({
      pathname: '/gmassignee/suivi-parties',
      search: '',
      hash: '',
      base: BASE,
    }),
    '/gmassignee/#/suivi-parties'
  );
  assert.equal(
    pagesHrefFromLocation({
      pathname: '/gmassignee/formation',
      search: '?tab=admin',
      hash: '',
      base: BASE,
    }),
    '/gmassignee/#/formation?tab=admin'
  );
});

test('pagesHrefFromLocation : ?tab= sur l’index Pages', () => {
  assert.equal(
    pagesHrefFromLocation({
      pathname: '/gmassignee/',
      search: '?tab=suivi-parties',
      hash: '',
      base: BASE,
    }),
    '/gmassignee/#/suivi-parties'
  );
  assert.equal(
    pagesHrefFromLocation({
      pathname: '/gmassignee/',
      search: '?tab=formation&handoff=1&email=a%40b.ch',
      hash: '',
      base: BASE,
    }),
    '/gmassignee/#/formation?handoff=1&email=a%40b.ch'
  );
});

test('pagesHrefFromLocation : hash hub ?tab= et basename accidentel', () => {
  assert.equal(
    pagesHrefFromLocation({
      pathname: '/gmassignee/',
      search: '',
      hash: '#/?tab=suivi-parties',
      base: BASE,
    }),
    '/gmassignee/#/suivi-parties'
  );
  assert.equal(
    pagesHrefFromLocation({
      pathname: '/gmassignee/',
      search: '',
      hash: '#/dashboard?tab=formation',
      base: BASE,
    }),
    '/gmassignee/#/formation'
  );
  assert.equal(
    pagesHrefFromLocation({
      pathname: '/gmassignee/',
      search: '',
      hash: '#/gmassignee/suivi-parties',
      base: BASE,
    }),
    '/gmassignee/#/suivi-parties'
  );
});

test('pagesHrefFromLocation : ne pas toucher un hash déjà correct (Lovable)', () => {
  assert.equal(
    pagesHrefFromLocation({
      pathname: '/gmassignee/',
      search: '',
      hash: '#/suivi-parties?handoff=1&email=gm%40x.ch',
      base: BASE,
    }),
    null
  );
  assert.equal(
    pagesHrefFromLocation({
      pathname: '/gmassignee/',
      search: '',
      hash: '#/formation?tab=admin',
      base: BASE,
    }),
    null
  );
  assert.equal(
    pagesHrefFromLocation({
      pathname: '/gmassignee/souvenirs/',
      search: '?token=abc',
      hash: '',
      base: BASE,
    }),
    null
  );
});
