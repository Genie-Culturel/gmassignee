import { isMockMode, supabase } from './supabase';
import { SESSION_STEP_LABELS } from './constants';
import { IncidentType, LegacyVrStep, SessionStep } from './database.types';
import { DEFAULT_PARCOURS_ID, ParcoursDefinition, ParcoursStepDef, activeSteps } from './parcours';
import { PersistedSession, loadSession } from './sessionRepository';

/** Steps to show: snapshot taken at start, else current parcours; keep any completed legacy step. */
export function buildSessionSteps(
  snapshot: ParcoursStepDef[] | null,
  parcours: ParcoursDefinition,
  stepTimes: Partial<Record<SessionStep, string>>
): ParcoursStepDef[] {
  const base = snapshot && snapshot.length ? snapshot : activeSteps(parcours);
  const known = new Set(base.map((step) => step.key));
  const extra = Object.keys(stepTimes)
    .filter((key) => !known.has(key))
    .map((key) => {
      const fromParcours = parcours.steps.find((step) => step.key === key);
      return {
        key,
        label: fromParcours?.label || SESSION_STEP_LABELS[key as LegacyVrStep] || key,
        hint: null,
        note: null,
      };
    });
  return [...base, ...extra];
}

export type SessionFlagKind = 'incident' | 'remark';

export interface SessionFlag {
  kind: SessionFlagKind;
  /** Short excerpt for the tooltip. */
  excerpt: string;
}

export function computeSessionFlag(input: {
  hasIncident: boolean;
  incidentType: IncidentType | null;
  incidentDetails: string;
  notes: string;
  salesComment: string;
}): SessionFlag | null {
  const parts = [input.incidentDetails, input.notes, input.salesComment]
    .map((text) => (text || '').trim())
    .filter(Boolean);
  const excerpt = parts.join(' · ');
  const short = excerpt.length > 160 ? `${excerpt.slice(0, 157)}…` : excerpt;
  if (input.hasIncident || input.incidentType || (input.incidentDetails || '').trim()) {
    return { kind: 'incident', excerpt: short };
  }
  if (parts.length) return { kind: 'remark', excerpt: short };
  return null;
}

export interface RecordedSessionRow {
  sessionId: string;
  game: string;
  date: string;
  time: string;
  groupName: string;
  gmName: string;
  clientEmail: string | null;
  videosSentAt: string | null;
  isManual: boolean;
  incidentType: IncidentType | null;
  flag: SessionFlag | null;
  flagReviewedAt: string | null;
}

const DEMO_REVIEW_KEY = 'gmassignee_demo_flag_reviews';

function readDemoReviews(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(DEMO_REVIEW_KEY) || '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

function demoSessions(): PersistedSession[] {
  const today = new Date().toISOString().slice(0, 10);
  const at = (hhmm: string) => new Date(`${today}T${hhmm}:00`).toISOString();
  const base = {
    assignmentId: null,
    date: today,
    playerCount: 6,
    parcoursId: DEFAULT_PARCOURS_ID,
    stepsSnapshot: null,
    sales: [],
    salesComment: '',
    plannedEndTime: null,
    planningActivityId: null,
  };
  return [
    {
      ...base,
      sessionId: 'demo-sent',
      assignmentId: 'asgn-demo-saga',
      isManual: false,
      plannedEndTime: '16:25',
      planningActivityId: 'asgn-demo-saga',
      game: 'Saga le Serviteur',
      time: '14:30',
      startedAt: at('14:12'),
      groupName: 'Famille Demo',
      gmName: 'GM Demo',
      notes: '',
      incidentType: null,
      incidentDetails: '',
      completedSteps: ['reception_seating', 'salon_briefing'],
      stepTimes: { reception_seating: at('14:15'), salon_briefing: at('14:24') },
      endedAt: at('15:40'),
      clientEmail: 'client.demo@vrcenter.ch',
      videosSentAt: at('15:45'),
      sales: [
        { id: 'd1', productName: 'Boisson', quantity: 4, unitPrice: 4, paymentMethod: 'twint' },
        { id: 'd2', productName: 'Partie VR', quantity: 1, unitPrice: 240, paymentMethod: 'facture' },
      ],
      salesComment: 'Facture à envoyer à la RH',
    },
    {
      ...base,
      sessionId: 'demo-pending',
      isManual: true,
      game: 'La Planta',
      time: '16:30',
      startedAt: at('16:20'),
      groupName: 'EVG',
      gmName: 'Aline',
      notes: 'Groupe très en retard (20 min).',
      incidentType: 'bug',
      incidentDetails: 'Freeze du casque 3 en fin de partie, relancé.',
      completedSteps: ['reception_seating'],
      stepTimes: { reception_seating: at('16:22') },
      endedAt: null,
      clientEmail: 'evg@example.com',
      videosSentAt: null,
    },
  ];
}

function sessionToRow(session: PersistedSession, hasIncident: boolean, reviewedAt: string | null): RecordedSessionRow {
  return {
    sessionId: session.sessionId,
    game: session.game,
    date: session.date,
    time: session.time,
    groupName: session.groupName,
    gmName: session.gmName,
    clientEmail: session.clientEmail || null,
    videosSentAt: session.videosSentAt,
    isManual: session.isManual,
    incidentType: session.incidentType,
    flag: computeSessionFlag({
      hasIncident,
      incidentType: session.incidentType,
      incidentDetails: session.incidentDetails,
      notes: session.notes,
      salesComment: session.salesComment,
    }),
    flagReviewedAt: reviewedAt,
  };
}

export async function listRecordedSessions(): Promise<RecordedSessionRow[]> {
  if (isMockMode || !supabase) {
    const reviews = readDemoReviews();
    return demoSessions().map((s) => sessionToRow(s, Boolean(s.incidentType), reviews[s.sessionId] || null));
  }
  const { data, error } = await supabase
    .from('vr_sessions')
    .select(
      'id, game, session_date, session_time, group_name, gm_name, client_email, videos_sent_at, has_incident, incident_type, incident_details, notes, sales_comment, flag_reviewed_at, is_manual, assignment_id'
    )
    .order('started_at', { ascending: false })
    .limit(60);
  if (error) throw new Error(error.message);
  return (data || []).map((row) => ({
    sessionId: row.id,
    game: row.game || 'Session VR',
    date: String(row.session_date || '').slice(0, 10),
    time: String(row.session_time || '').slice(0, 5),
    groupName: row.group_name || '',
    gmName: row.gm_name || '',
    clientEmail: row.client_email,
    videosSentAt: row.videos_sent_at,
    isManual: typeof row.is_manual === 'boolean' ? row.is_manual : !row.assignment_id,
    incidentType: row.incident_type,
    flag: computeSessionFlag({
      hasIncident: Boolean(row.has_incident),
      incidentType: row.incident_type,
      incidentDetails: row.incident_details || '',
      notes: row.notes || '',
      salesComment: row.sales_comment || '',
    }),
    flagReviewedAt: row.flag_reviewed_at || null,
  }));
}

/** Read-only full session for the admin consultation sheet. */
export async function loadSessionForConsultation(sessionId: string): Promise<PersistedSession | null> {
  if (isMockMode || !supabase) {
    return demoSessions().find((s) => s.sessionId === sessionId) || null;
  }
  return loadSession(sessionId);
}

/** Admin only (RPC set_session_flag_reviewed, migration 022). Returns the new reviewed timestamp. */
export async function setSessionFlagReviewed(sessionId: string, reviewed: boolean): Promise<string | null> {
  if (isMockMode || !supabase) {
    const reviews = readDemoReviews();
    const at = reviewed ? new Date().toISOString() : null;
    if (at) reviews[sessionId] = at;
    else delete reviews[sessionId];
    try {
      localStorage.setItem(DEMO_REVIEW_KEY, JSON.stringify(reviews));
    } catch {
      /* ignore */
    }
    return at;
  }
  const { data, error } = await supabase.rpc('set_session_flag_reviewed', {
    p_session_id: sessionId,
    p_reviewed: reviewed,
  });
  if (error) throw new Error(error.message);
  return (data as string | null) || null;
}
