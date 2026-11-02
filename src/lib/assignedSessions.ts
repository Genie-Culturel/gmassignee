import { DEFAULT_PARCOURS_ID } from './parcours';

/**
 * A session assigned to a GM in the GMassignee planning calendar.
 *
 * Shape mirrors the GM dashboard rows ("Mes Activités Aujourd'hui" /
 * "Mes Prochaines Activités"): game, player count, date, start/end time,
 * status. Real assignments live in the separate GMassignee Lovable app
 * (its own Supabase project). Until that source is wired,
 * `getAssignedSessions` returns demo data in this same shape.
 *
 * To plug in the real planning tables later, replace the body of
 * `fetchFromGmassigneePlanning` and map rows onto AssignedSession.
 */
export type AssignmentStatus = 'assigned';

export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  assigned: 'Assigné',
};

export interface AssignedSession {
  id: string;
  gmId: string;
  gmName: string;
  /** Game title, shown as "Name [players]". */
  game: string;
  /** Player count, shown in brackets after the game name. */
  playerCount: number;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM session start */
  startTime: string;
  /** HH:MM session end */
  endTime: string;
  /** GMassignee assignment status (badge "Assigné"). */
  status: AssignmentStatus;
  groupName?: string;
  notes?: string;
  /** Parcours to run; defaults to VR Center client flow. */
  parcoursId: string;
}

export const DEMO_GM_ID = 'gm-demo';
export const DEMO_GM_NAME = 'GM Demo';

export function assignmentTitle(session: Pick<AssignedSession, 'game' | 'playerCount'>): string {
  return `${session.game} [${session.playerCount}]`;
}

export function assignmentTimeRange(session: Pick<AssignedSession, 'startTime' | 'endTime'>): string {
  return `${session.startTime} - ${session.endTime}`;
}

export function assignmentStatusLabel(status: AssignmentStatus | string): string {
  return ASSIGNMENT_STATUS_LABELS[status as AssignmentStatus] || status;
}

export function splitAssignedSessions(sessions: AssignedSession[]): {
  today: AssignedSession[];
  upcoming: AssignedSession[];
} {
  const today = todayIso();
  return {
    today: sessions.filter((s) => s.date === today),
    upcoming: sessions.filter((s) => s.date > today),
  };
}

function isoDateOffset(days: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayIso(): string {
  return isoDateOffset(0);
}

/** Prefer the real GMassignee date when it is still upcoming, else a relative fallback. */
function planningDate(preferredIso: string, fallbackOffsetDays: number): string {
  return preferredIso > todayIso() ? preferredIso : isoDateOffset(fallbackOffsetDays);
}

export function getMockAssignedSessions(gmId: string = DEMO_GM_ID): AssignedSession[] {
  // Mirrors the GMassignee GM dashboard sample (today empty, upcoming rows).
  const rows: AssignedSession[] = [
    {
      id: 'asgn-saga-2026-11-06-1430',
      gmId,
      gmName: DEMO_GM_NAME,
      game: 'Saga le Serviteur de la Rédemption',
      playerCount: 7,
      date: planningDate('2026-11-06', 4),
      startTime: '14:30',
      endTime: '16:25',
      status: 'assigned',
      parcoursId: DEFAULT_PARCOURS_ID,
    },
    {
      id: 'asgn-schoolcrafter-2026-11-13-1630',
      gmId,
      gmName: DEMO_GM_NAME,
      game: 'SchoolCrafter',
      playerCount: 5,
      date: planningDate('2026-11-13', 11),
      startTime: '16:30',
      endTime: '17:50',
      status: 'assigned',
      parcoursId: DEFAULT_PARCOURS_ID,
    },
    {
      id: 'asgn-schoolcrafter-2026-11-16-0900',
      gmId,
      gmName: DEMO_GM_NAME,
      game: 'SchoolCrafter',
      playerCount: 8,
      date: planningDate('2026-11-16', 14),
      startTime: '09:00',
      endTime: '10:20',
      status: 'assigned',
      parcoursId: DEFAULT_PARCOURS_ID,
    },
    {
      id: 'asgn-schoolcrafter-2026-11-16-1000',
      gmId,
      gmName: DEMO_GM_NAME,
      game: 'SchoolCrafter',
      playerCount: 8,
      date: planningDate('2026-11-16', 14),
      startTime: '10:00',
      endTime: '11:20',
      status: 'assigned',
      parcoursId: DEFAULT_PARCOURS_ID,
    },
    {
      id: 'asgn-schoolcrafter-2026-11-16-1100',
      gmId,
      gmName: DEMO_GM_NAME,
      game: 'SchoolCrafter',
      playerCount: 8,
      date: planningDate('2026-11-16', 14),
      startTime: '11:00',
      endTime: '12:20',
      status: 'assigned',
      parcoursId: DEFAULT_PARCOURS_ID,
    },
  ];

  return sortAssignedSessions(rows.filter((s) => s.date >= todayIso()));
}

function sortAssignedSessions(sessions: AssignedSession[]): AssignedSession[] {
  return [...sessions].sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`));
}

/**
 * Fetch sessions assigned to the logged-in GM.
 * Split into today / upcoming in the UI.
 */
export async function getAssignedSessions(gmId: string): Promise<AssignedSession[]> {
  // Planning still lives in the other GMassignee app. Always mock until wired.
  return getMockAssignedSessions(gmId);
}

/**
 * Placeholder for the real GMassignee planning source.
 *
 * When the Lovable app's Supabase is reachable, query its events /
 * assignments tables here and map rows to AssignedSession:
 *
 *   const { data } = await planningClient
 *     .from('events')
 *     .select('id, game_name, start_at, end_at, player_count, status, gm_id, gm_name')
 *     .eq('gm_id', gmId)
 *     .gte('start_at', startOfToday)
 *     .order('start_at');
 *
 *   game ← game_name
 *   playerCount ← player_count
 *   date / startTime / endTime ← start_at, end_at
 *   status ← 'assigned' when the GM is assigned
 */
export async function fetchFromGmassigneePlanning(gmId: string): Promise<AssignedSession[]> {
  console.warn(
    'getAssignedSessions: GMassignee planning tables are not wired yet; using mock assignments.'
  );
  return getMockAssignedSessions(gmId);
}
