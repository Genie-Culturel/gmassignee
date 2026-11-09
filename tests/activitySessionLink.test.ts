import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  activitySessionActionLabel,
  activitySessionState,
  endedSessionBadgeLabel,
  pickLinkedSession,
  planningAssignmentKeys,
  sessionMatchesActivity,
  shouldCreateNewSession,
  type LinkedSessionLike,
} from '../src/lib/activitySessionLink.ts';

const activity = { id: 'act-serviteur', date: '2026-11-09' };

function session(partial: Partial<LinkedSessionLike> & { sessionId: string }): LinkedSessionLike {
  return {
    assignmentId: `${activity.id}:${activity.date}`,
    planningActivityId: activity.id,
    startedAt: '2026-11-09T11:05:00.000Z',
    endedAt: null,
    cancelledAt: null,
    ...partial,
  };
}

test('clés de lien : activity id + assignment_id legacy', () => {
  assert.deepEqual(planningAssignmentKeys(activity), [
    'act-serviteur',
    'act-serviteur:2026-11-09',
  ]);
});

test('ignore les sessions annulées', () => {
  const cancelled = session({
    sessionId: 's-cancel',
    cancelledAt: '2026-11-09T11:10:00.000Z',
    endedAt: '2026-11-09T11:10:00.000Z',
  });
  assert.equal(sessionMatchesActivity(cancelled, activity), false);
  assert.equal(pickLinkedSession(activity, [cancelled]), null);
  assert.equal(shouldCreateNewSession(cancelled), true);
});

test('match par planning_activity_id (référence planning)', () => {
  const row = session({
    sessionId: 's-plan',
    assignmentId: null,
    planningActivityId: 'act-serviteur',
    endedAt: '2026-11-09T14:49:00.000Z',
  });
  assert.equal(sessionMatchesActivity(row, activity), true);
  assert.equal(pickLinkedSession(activity, [row])?.sessionId, 's-plan');
  assert.equal(activitySessionState(row), 'ended');
  assert.equal(shouldCreateNewSession(row), false);
});

test('match par assignment_id legacy id:date', () => {
  const row = session({
    sessionId: 's-legacy',
    planningActivityId: null,
    assignmentId: 'act-serviteur:2026-11-09',
  });
  assert.equal(sessionMatchesActivity(row, activity), true);
  assert.equal(pickLinkedSession(activity, [row])?.sessionId, 's-legacy');
});

test('match par assignment_id = activity id', () => {
  const row = session({
    sessionId: 's-id',
    planningActivityId: null,
    assignmentId: 'act-serviteur',
  });
  assert.equal(sessionMatchesActivity(row, activity), true);
});

test('ne matche pas une autre activité', () => {
  const row = session({
    sessionId: 's-other',
    planningActivityId: 'act-autre',
    assignmentId: 'act-autre:2026-11-09',
  });
  assert.equal(sessionMatchesActivity(row, activity), false);
  assert.equal(pickLinkedSession(activity, [row]), null);
});

test('session ouverte gagne sur une session terminée (pas de doublon affiché)', () => {
  const ended = session({
    sessionId: 's-ended',
    endedAt: '2026-11-09T13:00:00.000Z',
    startedAt: '2026-11-09T11:00:00.000Z',
  });
  const open = session({
    sessionId: 's-open',
    startedAt: '2026-11-09T14:00:00.000Z',
  });
  assert.equal(pickLinkedSession(activity, [ended, open])?.sessionId, 's-open');
  assert.equal(activitySessionState(open), 'in_progress');
});

test('parmi plusieurs sessions terminées, la plus récente', () => {
  const older = session({
    sessionId: 's-old',
    startedAt: '2026-11-09T10:00:00.000Z',
    endedAt: '2026-11-09T11:00:00.000Z',
  });
  const newer = session({
    sessionId: 's-new',
    startedAt: '2026-11-09T12:00:00.000Z',
    endedAt: '2026-11-09T13:00:00.000Z',
  });
  assert.equal(pickLinkedSession(activity, [older, newer])?.sessionId, 's-new');
});

test('préférer un match planning_activity_id à un assignment_id seul, à statut égal', () => {
  const byAssignment = session({
    sessionId: 's-assign',
    planningActivityId: null,
    assignmentId: 'act-serviteur:2026-11-09',
    endedAt: '2026-11-09T13:00:00.000Z',
    startedAt: '2026-11-09T12:30:00.000Z',
  });
  const byPlanning = session({
    sessionId: 's-planning',
    planningActivityId: 'act-serviteur',
    assignmentId: null,
    endedAt: '2026-11-09T14:49:00.000Z',
    startedAt: '2026-11-09T12:00:00.000Z',
  });
  assert.equal(pickLinkedSession(activity, [byAssignment, byPlanning])?.sessionId, 's-planning');
});

test('sans session : on peut créer ; avec session (même terminée) : non', () => {
  assert.equal(shouldCreateNewSession(null), true);
  assert.equal(
    shouldCreateNewSession(session({ sessionId: 's', endedAt: '2026-11-09T14:49:00.000Z' })),
    false
  );
});

test('libellés FR des actions et badge terminée', () => {
  assert.equal(activitySessionActionLabel('none'), 'Démarrer la session');
  assert.equal(activitySessionActionLabel('in_progress'), 'Reprendre');
  assert.equal(activitySessionActionLabel('ended'), 'Modifier la session');
  assert.match(endedSessionBadgeLabel('2026-11-09T14:49:00.000Z'), /^Terminée · \d{2}:\d{2}$/);
});
