import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isIncidentNoteRequired } from '../src/lib/incidentNote.ts';

test('note d’incident requise si une catégorie est choisie et aucun bug', () => {
  assert.equal(isIncidentNoteRequired('bug', 0), true);
  assert.equal(isIncidentNoteRequired('malaise', 0), true);
  assert.equal(isIncidentNoteRequired('casse', 0), true);
  assert.equal(isIncidentNoteRequired('autre', 0), true);
});

test('note d’incident non requise dès qu’un bug de session existe', () => {
  assert.equal(isIncidentNoteRequired('bug', 1), false);
  assert.equal(isIncidentNoteRequired('bug', 3), false);
  assert.equal(isIncidentNoteRequired('malaise', 1), false);
});

test('note d’incident non requise sans catégorie, même sans bug', () => {
  assert.equal(isIncidentNoteRequired(null, 0), false);
  assert.equal(isIncidentNoteRequired(undefined, 0), false);
  assert.equal(isIncidentNoteRequired(null, 2), false);
});
