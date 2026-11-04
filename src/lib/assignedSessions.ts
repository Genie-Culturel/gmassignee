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
  /** Client / group email for souvenir videos. */
  clientEmail?: string;
  /**
   * Optional explicit parcours. Normally resolved from the game's location
   * when the session starts (Planta → VR Center, Da Vinci Code → Sion…).
   */
  parcoursId?: string;
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

function hhmm(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** Slot close to now (start rounded down to 5 min, ~1h55 like a Saga). */
function nearbySlot(durationMinutes = 115): { startTime: string; endTime: string } {
  const start = new Date();
  start.setSeconds(0, 0);
  start.setMinutes(Math.floor(start.getMinutes() / 5) * 5);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  return { startTime: hhmm(start), endTime: hhmm(end) };
}

export function getMockAssignedSessions(gmId: string = DEMO_GM_ID): AssignedSession[] {
  const todaySlot = nearbySlot();
  const rows: AssignedSession[] = [
    {
      id: 'asgn-today-saga',
      gmId,
      gmName: DEMO_GM_NAME,
      game: 'La Saga',
      playerCount: 6,
      date: todayIso(),
      startTime: todaySlot.startTime,
      endTime: todaySlot.endTime,
      status: 'assigned',
      groupName: 'Famille Dupont',
      clientEmail: 'client.demo@vrcenter.ch',
    },
    {
      id: 'asgn-saga-2026-11-06-1430',
      gmId,
      gmName: DEMO_GM_NAME,
      game: 'La Saga',
      playerCount: 7,
      date: planningDate('2026-11-06', 4),
      startTime: '14:30',
      endTime: '16:25',
      status: 'assigned',
    },
    {
      id: 'asgn-davinci-2026-11-07-1400',
      gmId,
      gmName: DEMO_GM_NAME,
      game: 'Da Vinci Code',
      playerCount: 10,
      date: planningDate('2026-11-07', 4),
      startTime: '14:00',
      endTime: '16:45',
      status: 'assigned',
      groupName: 'Entreprise ABC',
    },
    {
      id: 'asgn-feu-sacre-2026-11-08-1000',
      gmId,
      gmName: DEMO_GM_NAME,
      game: 'Le Feu sacré',
      playerCount: 8,
      date: planningDate('2026-11-08', 5),
      startTime: '10:00',
      endTime: '12:45',
      status: 'assigned',
    },
    {
      id: 'asgn-novasphere-2026-11-10-1500',
      gmId,
      gmName: DEMO_GM_NAME,
      game: 'Novasphère',
      playerCount: 6,
      date: planningDate('2026-11-10', 7),
      startTime: '15:00',
      endTime: '15:45',
      status: 'assigned',
    },
    {
      id: 'asgn-schoolcrafter-2026-11-13-1630',
      gmId,
      gmName: DEMO_GM_NAME,
      game: 'Schoolcrafter',
      playerCount: 5,
      date: planningDate('2026-11-13', 11),
      startTime: '16:30',
      endTime: '17:50',
      status: 'assigned',
    },
    {
      id: 'asgn-schoolcrafter-2026-11-16-0900',
      gmId,
      gmName: DEMO_GM_NAME,
      game: 'Schoolcrafter',
      playerCount: 8,
      date: planningDate('2026-11-16', 14),
      startTime: '09:00',
      endTime: '10:20',
      status: 'assigned',
    },
    {
      id: 'asgn-schoolcrafter-2026-11-16-1000',
      gmId,
      gmName: DEMO_GM_NAME,
      game: 'Schoolcrafter',
      playerCount: 8,
      date: planningDate('2026-11-16', 14),
      startTime: '10:00',
      endTime: '11:20',
      status: 'assigned',
    },
    {
      id: 'asgn-schoolcrafter-2026-11-16-1100',
      gmId,
      gmName: DEMO_GM_NAME,
      game: 'Schoolcrafter',
      playerCount: 8,
      date: planningDate('2026-11-16', 14),
      startTime: '11:00',
      endTime: '12:20',
      status: 'assigned',
    },
  ];

  return sortAssignedSessions(rows.filter((s) => s.date >= todayIso()));
}

function sortAssignedSessions(sessions: AssignedSession[]): AssignedSession[] {
  return [...sessions].sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`));
}

/**
 * Fetch sessions assigned to the logged-in GM from Lovable planning tables.
 * Split into today / upcoming in the UI. Demo always includes a today slot.
 */
export async function getAssignedSessions(gmId: string): Promise<AssignedSession[]> {
  return fetchFromGmassigneePlanning(gmId);
}

/**
 * Fetch from the Lovable GMassignee planning (same Supabase project dnxyidnkmtrmkxucqrry).
 *
 * Schema:
 *   - profiles: user_id (auth.uid()) -> gm_id (game_masters.id)
 *   - game_masters: id, name
 *   - activities: id (text), title, date, start_time, end_time, description, notes, status
 *   - event_assignments: activity_id -> activities.id, gm_id -> game_masters.id
 *
 * Flow:
 *   1. Get current user's gm_id from profiles (profiles.user_id = auth.uid())
 *   2. Query event_assignments filtered by that gm_id
 *   3. Join with activities to get session details
 *
 * Mapping onto AssignedSession (all carried into gh_vr_sessions on start):
 *   id ← activities.id (text)     → gh_vr_sessions.planning_activity_id (text)
 *   game / playerCount ← title    → game, player_count (parsed from "Jeu [N]")
 *   date, startTime, endTime      → session_date, session_time, planned_end_time
 *   groupName ← description       → group_name
 *   notes ← notes                 → notes
 *
 * In demo/mock mode, always returns demo data.
 * In real mode (authenticated), NEVER falls back to mock - shows real data, empty state, or errors.
 */
export async function fetchFromGmassigneePlanning(gmId: string): Promise<AssignedSession[]> {
  const { isMockMode, supabase } = await import('./supabase');
  
  // Only use mock data if explicitly in mock mode
  if (isMockMode || !supabase) {
    console.log('[Planning] Running in mock mode');
    return getMockAssignedSessions(gmId);
  }

  console.log('[Planning] Fetching real assignments from Lovable backend...');

  try {
    // Step 1: Get current user's gm_id from profiles
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('[Planning] Auth error:', userError);
      throw new Error(`Authentification échouée: ${userError.message}`);
    }
    
    if (!user) {
      console.error('[Planning] No authenticated user');
      throw new Error('Pas d\'utilisateur connecté. Reconnectez-vous.');
    }

    console.log('[Planning] User authenticated:', user.email);

    // Defensive query: select all columns to avoid column name errors
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('[Planning] Profiles query error:', profileError);
      throw new Error(`Impossible de charger le profil GM: ${profileError.message}`);
    }

    if (!profile) {
      console.error('[Planning] No profile found for user:', user.id);
      throw new Error('Profil GM introuvable. Contactez l\'administrateur pour créer votre profil.');
    }

    console.log('[Planning] Profile found:', profile);

    const userGmId = profile.gm_id;
    if (!userGmId) {
      console.error('[Planning] Profile has no gm_id');
      throw new Error('Votre profil n\'est pas lié à un GM. Contactez l\'administrateur.');
    }

    console.log('[Planning] GM ID:', userGmId);

    // Step 2 & 3: Query activities via event_assignments - defensive select('*')
    // Note: PostgREST can't order parent by embedded columns, so we sort client-side
    const today = todayIso();
    console.log('[Planning] Querying assignments for date >=', today);

    const { data, error } = await supabase
      .from('event_assignments')
      .select('*, activities!inner(*)')
      .eq('gm_id', userGmId)
      .gte('activities.date', today)
      .limit(100); // Get more, will sort and limit client-side

    if (error) {
      console.error('[Planning] Assignments query error:', error);
      throw new Error(`Impossible de charger les activités assignées: ${error.message}`);
    }

    console.log('[Planning] Query result:', data?.length || 0, 'assignments found');
    
    if (data && data.length > 0) {
      console.log('[Planning] First assignment sample:', data[0]);
    }

    if (!data || data.length === 0) {
      console.log('[Planning] No assignments found for GM:', userGmId);
      return [];
    }

    const sessions: AssignedSession[] = [];
    
    for (const row of data as any[]) {
      const activity = row.activities;
      if (!activity) {
        console.warn('[Planning] Assignment without activity:', row);
        continue;
      }
      
      console.log('[Planning] Processing activity:', activity.id, activity.title);
      
      const title = String(activity.title || '');
      const { game, playerCount } = parseTitleForGameAndPlayers(title);
      
      sessions.push({
        id: String(activity.id),
        gmId: userGmId,
        gmName: '',
        game,
        playerCount,
        date: String(activity.date || '').slice(0, 10),
        startTime: String(activity.start_time || '').slice(0, 5),
        endTime: String(activity.end_time || '').slice(0, 5),
        status: 'assigned',
        groupName: String(activity.description || '').slice(0, 100) || undefined,
        notes: String(activity.notes || '') || undefined,
        clientEmail: undefined,
        parcoursId: undefined,
      });
    }

    console.log('[Planning] Successfully loaded', sessions.length, 'sessions');
    
    // Sort client-side by date + start_time, then take first 20
    const sorted = sortAssignedSessions(sessions);
    return sorted.slice(0, 20);
    
  } catch (err) {
    // In real mode, propagate the error instead of falling back to mock
    console.error('[Planning] Fatal error fetching assignments:', err);
    throw err;
  }
}

/**
 * Parse title like "Jeu [8]" or "Saga [6]" to extract game name and player count.
 */
function parseTitleForGameAndPlayers(title: string): { game: string; playerCount: number } {
  const match = title.match(/^(.+?)\s*\[(\d+)\]\s*$/);
  if (match) {
    return { game: match[1].trim(), playerCount: parseInt(match[2], 10) || 8 };
  }
  // Fallback: entire title is game name, default 8 players
  return { game: title || 'Session', playerCount: 8 };
}
