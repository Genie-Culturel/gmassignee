import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  MISSING_GM_LINK_ERROR,
  MISSING_PROFILE_ERROR,
  planningGmLinkError,
  resolvePlanningGmLink,
} from '../src/lib/assignedSessions.ts';

test('GM lié : on charge le planning', () => {
  assert.equal(
    resolvePlanningGmLink({ profileFound: true, gmId: 'gm-1', isStaff: false }),
    'continue'
  );
  assert.equal(
    resolvePlanningGmLink({ profileFound: true, gmId: 'gm-1', isStaff: true }),
    'continue'
  );
});

test('admin / formateur sans gm_id : état vide, pas d’erreur', () => {
  assert.equal(
    resolvePlanningGmLink({ profileFound: true, gmId: null, isStaff: true }),
    'empty'
  );
  assert.equal(
    resolvePlanningGmLink({ profileFound: true, gmId: undefined, isStaff: true }),
    'empty'
  );
  assert.equal(
    resolvePlanningGmLink({ profileFound: false, gmId: null, isStaff: true }),
    'empty'
  );
  assert.equal(planningGmLinkError('empty'), null);
});

test('GM sans gm_id : erreur bloquante (profil trouvé)', () => {
  assert.equal(
    resolvePlanningGmLink({ profileFound: true, gmId: null, isStaff: false }),
    'missing_gm_id'
  );
  assert.equal(planningGmLinkError('missing_gm_id'), MISSING_GM_LINK_ERROR);
  assert.match(MISSING_GM_LINK_ERROR, /pas lié à un GM/);
});

test('GM sans profil : erreur bloquante distincte', () => {
  assert.equal(
    resolvePlanningGmLink({ profileFound: false, gmId: null, isStaff: false }),
    'missing_profile'
  );
  assert.equal(planningGmLinkError('missing_profile'), MISSING_PROFILE_ERROR);
});
