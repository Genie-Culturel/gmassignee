import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  FORMATION_EDITOR_TAB,
  applyFormationEditorQuery,
  formationEditorSearch,
  formationTabFromSearch,
  isFormationEditorPath,
  parseFormationEditorQuery,
  parcoursStepElementId,
} from '../src/lib/formationNav.ts';

test('lien nav Éditeur pointe vers Formations ?tab=admin', () => {
  assert.equal(formationEditorSearch(), '?tab=admin');
  assert.equal(FORMATION_EDITOR_TAB, 'admin');
});

test('isFormationEditorPath : HashRouter /formation?tab=admin', () => {
  assert.equal(isFormationEditorPath('/formation', '?tab=admin'), true);
  assert.equal(isFormationEditorPath('/formation', 'tab=admin'), true);
  assert.equal(isFormationEditorPath('/formation', ''), false);
  assert.equal(isFormationEditorPath('/dashboard', '?tab=admin'), false);
});

test('formationTabFromSearch : seulement si formateur/admin', () => {
  assert.equal(formationTabFromSearch('?tab=admin', true), 'admin');
  assert.equal(formationTabFromSearch('?tab=admin', false), null);
  assert.equal(formationTabFromSearch('', true), null);
});

test('deep link éditeur fiche depuis un chip de parcours', () => {
  const search = formationEditorSearch({
    editor: 'fiches',
    fiche: 'fiche-abc',
    retour: 'parcours',
    step: 'step-10',
  });
  assert.equal(
    search,
    '?tab=admin&editor=fiches&fiche=fiche-abc&retour=parcours&step=step-10'
  );
  assert.deepEqual(parseFormationEditorQuery(search), {
    editor: 'fiches',
    fiche: 'fiche-abc',
    retour: 'parcours',
    step: 'step-10',
  });
});

test('applyFormationEditorQuery conserve demo=1 et nettoie au départ de l’éditeur', () => {
  const withDemo = applyFormationEditorQuery('?demo=1&tab=admin&editor=fiches&fiche=x', {
    editor: 'parcours',
    fiche: null,
    retour: null,
    step: 'step-10',
  });
  assert.equal(withDemo, '?demo=1&tab=admin&editor=parcours&step=step-10');

  const left = applyFormationEditorQuery(withDemo, { tab: null });
  assert.equal(left, '?demo=1');
});

test('parseFormationEditorQuery ignore un editor inconnu', () => {
  assert.deepEqual(parseFormationEditorQuery('?tab=admin&editor=nope&fiche=1'), {
    editor: null,
    fiche: '1',
    retour: null,
    step: null,
  });
});

test('parcoursStepElementId ancre le scroll sur l’étape', () => {
  assert.equal(parcoursStepElementId('abc'), 'parcours-step-abc');
});
