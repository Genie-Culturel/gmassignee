import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  FORMATION_EDITOR_TAB,
  formationEditorSearch,
  formationTabFromSearch,
  isFormationEditorPath,
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
