import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  assertParcoursStepWriteResult,
  isParcoursStepRowId,
} from '../src/lib/parcours.ts';

test('isParcoursStepRowId : UUID live vs id composite démo (PR #21)', () => {
  assert.equal(isParcoursStepRowId('a1b2c3d4-e5f6-7890-abcd-ef1234567890'), true);
  assert.equal(isParcoursStepRowId('escape_life_sion:sion_booking_info'), false);
  assert.equal(isParcoursStepRowId('vr_centre_client:lobby_setup'), false);
  assert.equal(isParcoursStepRowId(''), false);
});

test('assertParcoursStepWriteResult : 0 ligne (RLS formateur / mauvais id) → erreur', () => {
  assert.throws(
    () => assertParcoursStepWriteResult([], { is_active: false }),
    /non enregistrée/
  );
  assert.throws(
    () => assertParcoursStepWriteResult(null, { is_active: false }),
    /non enregistrée/
  );
});

test('assertParcoursStepWriteResult : is_active renvoyé différent du patch → erreur', () => {
  assert.throws(
    () => assertParcoursStepWriteResult([{ id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', is_active: true }], {
      is_active: false,
    }),
    /Active/
  );
});

test('assertParcoursStepWriteResult : update Active OK', () => {
  assert.doesNotThrow(() =>
    assertParcoursStepWriteResult(
      [{ id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', is_active: false }],
      { is_active: false }
    )
  );
});
