/** Fields used to link a planning activity to a persisted VR session. */
export interface ActivityLinkRef {
  id: string;
  date: string;
}

export interface LinkedSessionLike {
  sessionId: string;
  assignmentId: string | null;
  planningActivityId: string | null;
  startedAt: string;
  endedAt: string | null;
  cancelledAt: string | null;
}

export type ActivitySessionState = 'none' | 'in_progress' | 'ended';

/**
 * Values stored on gh_vr_sessions that identify this planning row.
 * - activities.id → planning_activity_id (preferred)
 * - `${id}:${date}` → assignment_id (legacy key used at insert)
 * - activities.id → assignment_id (some older / partial rows)
 */
export function planningAssignmentKeys(activity: ActivityLinkRef): string[] {
  return [activity.id, `${activity.id}:${activity.date}`];
}

export function sessionMatchesActivity(
  session: LinkedSessionLike,
  activity: ActivityLinkRef
): boolean {
  if (session.cancelledAt) return false;
  if (session.planningActivityId && session.planningActivityId === activity.id) return true;
  if (session.assignmentId && planningAssignmentKeys(activity).includes(session.assignmentId)) {
    return true;
  }
  return false;
}

function matchRank(session: LinkedSessionLike, activity: ActivityLinkRef): number {
  const planning = session.planningActivityId === activity.id;
  const open = !session.endedAt;
  return (open ? 0 : 2) + (planning ? 0 : 1);
}

/**
 * Pick the session that belongs to this planning activity.
 * Cancelled rows are ignored. Prefer an open session, then a planning_activity_id
 * match, then the most recently started row.
 */
export function pickLinkedSession<T extends LinkedSessionLike>(
  activity: ActivityLinkRef,
  sessions: T[]
): T | null {
  const matches = sessions.filter((session) => sessionMatchesActivity(session, activity));
  if (!matches.length) return null;
  return [...matches].sort((a, b) => {
    const rank = matchRank(a, activity) - matchRank(b, activity);
    if (rank !== 0) return rank;
    return b.startedAt.localeCompare(a.startedAt);
  })[0];
}

export function activitySessionState(
  session: Pick<LinkedSessionLike, 'endedAt'> | null | undefined
): ActivitySessionState {
  if (!session) return 'none';
  return session.endedAt ? 'ended' : 'in_progress';
}

/** True when « Démarrer la session » must INSERT a new gh_vr_sessions row. */
export function shouldCreateNewSession(
  existing: Pick<LinkedSessionLike, 'cancelledAt'> | null | undefined
): boolean {
  return !existing || Boolean(existing.cancelledAt);
}

/** Local HH:MM for the « Terminée · HH:MM » badge (GM wall clock). */
export function formatEndedClock(endedAt: string): string {
  const d = new Date(endedAt);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function endedSessionBadgeLabel(endedAt: string): string {
  const clock = formatEndedClock(endedAt);
  return clock ? `Terminée · ${clock}` : 'Terminée';
}

export function activitySessionActionLabel(state: ActivitySessionState): string {
  if (state === 'in_progress') return 'Reprendre';
  if (state === 'ended') return 'Modifier la session';
  return 'Démarrer la session';
}
