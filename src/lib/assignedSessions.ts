import { isMockMode, supabase } from './supabase';
import { DEFAULT_PARCOURS_ID } from './parcours';

/**
 * A session assigned to a GM in the planning calendar.
 *
 * Real assignments live in the separate GMassignee Lovable app
 * (its own Supabase project — not this module's database). Until that
 * source is wired, `getAssignedSessions` returns demo data.
 *
 * To plug in the real planning tables later, replace the body of
 * `fetchFromGmassigneePlanning` (keep this AssignedSession shape).
 */
export interface AssignedSession {
  id: string;
  gmId: string;
  gmName: string;
  game: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM (session start) */
  time: string;
  groupName: string;
  playerCount: number;
  notes?: string;
  /** Parcours to run; defaults to VR Center client flow. */
  parcoursId: string;
}

export const DEMO_GM_ID = 'gm-demo';
export const DEMO_GM_NAME = 'GM Demo';

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

export function getMockAssignedSessions(gmId: string = DEMO_GM_ID): AssignedSession[] {
  const rows: AssignedSession[] = [
    {
      id: 'asgn-today-1400',
      gmId,
      gmName: DEMO_GM_NAME,
      game: 'Le Serviteur I',
      date: isoDateOffset(0),
      time: '14:00',
      groupName: 'Entreprise ABC',
      playerCount: 6,
      notes: 'Facture entreprise demandée.',
      parcoursId: DEFAULT_PARCOURS_ID,
    },
    {
      id: 'asgn-today-1630',
      gmId,
      gmName: DEMO_GM_NAME,
      game: 'La Bataille de la Planta',
      date: isoDateOffset(0),
      time: '16:30',
      groupName: 'Anniversaire Sophie',
      playerCount: 8,
      parcoursId: DEFAULT_PARCOURS_ID,
    },
    {
      id: 'asgn-tomorrow-1000',
      gmId,
      gmName: DEMO_GM_NAME,
      game: 'La Saga',
      date: isoDateOffset(1),
      time: '10:00',
      groupName: 'Team building Horizon',
      playerCount: 12,
      parcoursId: DEFAULT_PARCOURS_ID,
    },
    {
      id: 'asgn-plus2-1800',
      gmId,
      gmName: DEMO_GM_NAME,
      game: 'SchoolCrafter',
      date: isoDateOffset(2),
      time: '18:00',
      groupName: 'EVJF Camille',
      playerCount: 7,
      parcoursId: DEFAULT_PARCOURS_ID,
    },
  ];

  return sortAssignedSessions(rows.filter((s) => s.date >= todayIso()));
}

function sortAssignedSessions(sessions: AssignedSession[]): AssignedSession[] {
  return [...sessions].sort((a, b) => {
    const today = todayIso();
    const aToday = a.date === today ? 0 : 1;
    const bToday = b.date === today ? 0 : 1;
    if (aToday !== bToday) return aToday - bToday;
    return `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`);
  });
}

/**
 * Fetch sessions assigned to the logged-in GM.
 * Today first, then upcoming. Past days are omitted.
 */
export async function getAssignedSessions(gmId: string): Promise<AssignedSession[]> {
  if (isMockMode || !supabase) {
    return getMockAssignedSessions(gmId);
  }

  return fetchFromGmassigneePlanning(gmId);
}

/**
 * Placeholder for the real GMassignee planning source.
 *
 * When the Lovable app's Supabase is reachable, query its events /
 * assignments tables here and map rows to AssignedSession:
 *
 *   const { data } = await planningClient
 *     .from('events')
 *     .select('id, game_name, start_at, group_name, player_count, gm_id, gm_name')
 *     .eq('gm_id', gmId)
 *     .gte('start_at', startOfToday)
 *     .order('start_at');
 */
async function fetchFromGmassigneePlanning(gmId: string): Promise<AssignedSession[]> {
  console.warn(
    'getAssignedSessions: GMassignee planning tables are not wired yet; using mock assignments.'
  );
  return getMockAssignedSessions(gmId);
}
