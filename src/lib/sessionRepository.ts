import { supabase, isMockMode } from './supabase';
import {
  IncidentType,
  PaymentMethod,
  SalesProduct,
  SessionStep,
} from './database.types';
import { AssignedSession } from './assignedSessions';
import {
  LinkedSessionLike,
  pickLinkedSession,
  sessionMatchesActivity,
  shouldCreateNewSession,
} from './activitySessionLink';
import { DEFAULT_PARCOURS_ID, ParcoursStepDef } from './parcours';
import { mockSalesProducts } from './mockData';
import { computeSalesTotals } from './salesLogic';
import { ACTIVE_SESSION_STORAGE_KEY } from './config';

export interface SaleItem {
  id: string;
  productId?: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  paymentMethod: PaymentMethod;
  /** « Offert » : prix facturé 0, quantité conservée (consommation). */
  isOffered?: boolean;
  /** Prix catalogue de référence (valeur offerte). */
  catalogUnitPrice?: number | null;
}

export interface PersistedSession {
  sessionId: string;
  assignmentId: string | null;
  game: string;
  date: string;
  time: string;
  /** Real GM arrival / session start (vr_sessions.started_at). */
  startedAt: string;
  groupName: string;
  playerCount: number;
  gmName: string;
  parcoursId: string;
  /** Steps the session was started with (null = legacy session, use current parcours). */
  stepsSnapshot: ParcoursStepDef[] | null;
  notes: string;
  incidentType: IncidentType | null;
  incidentDetails: string;
  completedSteps: SessionStep[];
  /** ISO timestamps keyed by step (session_steps.completed_at). */
  stepTimes: Partial<Record<SessionStep, string>>;
  sales: SaleItem[];
  salesComment: string;
  /** ISO timestamp when the GM saved the encaissement module (null = never used). */
  salesRecordedAt: string | null;
  endedAt: string | null;
  /** GM cancelled a wrong start / test (gh_vr_sessions.cancelled_at). */
  cancelledAt: string | null;
  clientEmail: string;
  videosSentAt: string | null;
  /** Started via « Démarrer une session manuelle » (vr_sessions.is_manual). */
  isManual: boolean;
  /** Planned end (planning GMassignee), HH:MM. */
  plannedEndTime: string | null;
  /** activities.id in the GMassignee planning. */
  planningActivityId: string | null;
}

export interface SessionBug {
  bugSessionId: string;
  ref: string | null;
  description: string;
  criticality: string | null;
  category: string | null;
  position: number;
  status: string | null;
}

export function assignmentKey(assignment: AssignedSession): string {
  return `${assignment.id}:${assignment.date}`;
}

export type LinkedSessionSummary = LinkedSessionLike;

function rowToLinkedSummary(row: Record<string, unknown>): LinkedSessionSummary {
  return {
    sessionId: String(row.id),
    assignmentId: (row.assignment_id as string) || null,
    planningActivityId: (row.planning_activity_id as string) || null,
    startedAt: String(row.started_at || ''),
    endedAt: (row.ended_at as string) || null,
    cancelledAt: (row.cancelled_at as string) || null,
  };
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export function rememberActiveSession(id: string | null) {
  try {
    if (id) localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, id);
    else localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function readRememberedSessionId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

function throwIfError(error: { message: string } | null, context: string) {
  if (error) throw new Error(`${context}: ${error.message}`);
}

type LoadedStep = { step: SessionStep; completedAt: string };

function stepsPayload(steps: LoadedStep[]): {
  completedSteps: SessionStep[];
  stepTimes: Partial<Record<SessionStep, string>>;
} {
  const stepTimes: Partial<Record<SessionStep, string>> = {};
  for (const item of steps) {
    stepTimes[item.step] = item.completedAt;
  }
  return { completedSteps: steps.map((item) => item.step), stepTimes };
}

function parseSnapshot(value: unknown): ParcoursStepDef[] | null {
  if (!Array.isArray(value) || !value.length) return null;
  return value
    .filter((item) => item && typeof item === 'object' && typeof (item as ParcoursStepDef).key === 'string')
    .map((item) => {
      const step = item as ParcoursStepDef;
      return { key: step.key, label: step.label || step.key, hint: step.hint ?? null, note: step.note ?? null };
    });
}

function rowToSession(
  row: Record<string, unknown>,
  steps: LoadedStep[],
  sales: SaleItem[],
  salesComment: string
): PersistedSession {
  const time = String(row.session_time || '00:00').slice(0, 5);
  const loaded = stepsPayload(steps);
  return {
    sessionId: String(row.id),
    assignmentId: (row.assignment_id as string) || null,
    game: (row.game as string) || 'VR Session',
    date: String(row.session_date || '').slice(0, 10),
    time,
    startedAt: String(row.started_at || new Date().toISOString()),
    groupName: (row.group_name as string) || '',
    playerCount: Number(row.player_count || 0) || 8,
    gmName: (row.gm_name as string) || 'GM',
    parcoursId: (row.parcours_id as string) || DEFAULT_PARCOURS_ID,
    stepsSnapshot: parseSnapshot(row.steps_snapshot),
    notes: (row.notes as string) || '',
    incidentType: (row.incident_type as IncidentType) || null,
    incidentDetails: (row.incident_details as string) || '',
    completedSteps: loaded.completedSteps,
    stepTimes: loaded.stepTimes,
    sales,
    salesComment,
    salesRecordedAt: (row.sales_recorded_at as string) || null,
    endedAt: (row.ended_at as string) || null,
    cancelledAt: (row.cancelled_at as string) || null,
    clientEmail: (row.client_email as string) || '',
    videosSentAt: (row.videos_sent_at as string) || null,
    isManual: typeof row.is_manual === 'boolean' ? row.is_manual : !row.assignment_id,
    plannedEndTime: row.planned_end_time ? String(row.planned_end_time).slice(0, 5) : null,
    planningActivityId: (row.planning_activity_id as string) || null,
  };
}

async function loadParts(sessionId: string): Promise<{
  steps: LoadedStep[];
  sales: SaleItem[];
  salesComment: string;
}> {
  const [stepsRes, salesRes, sessionRes] = await Promise.all([
    supabase!.from('gh_session_steps').select('step, completed_at').eq('session_id', sessionId),
    supabase!.from('gh_session_sales').select('*').eq('session_id', sessionId),
    supabase!.from('gh_vr_sessions').select('sales_comment').eq('id', sessionId).maybeSingle(),
  ]);
  throwIfError(stepsRes.error, 'Chargement des étapes');
  throwIfError(salesRes.error, 'Chargement des ventes');

  return {
    steps: (stepsRes.data || []).map((s) => ({
      step: s.step as SessionStep,
      completedAt: String(s.completed_at || new Date().toISOString()),
    })),
    sales: (salesRes.data || []).map((s) => ({
      id: s.id,
      productId: s.product_id,
      productName: s.product_name,
      quantity: s.quantity,
      unitPrice: Number(s.unit_price),
      paymentMethod: s.payment_method,
      isOffered: Boolean(s.is_offered),
      catalogUnitPrice: s.catalog_unit_price == null ? null : Number(s.catalog_unit_price),
    })),
    salesComment: sessionRes.data?.sales_comment || '',
  };
}

export async function fetchSalesProducts(): Promise<SalesProduct[]> {
  const activeMock = mockSalesProducts.filter((p) => p.is_active);
  if (isMockMode || !supabase) return activeMock;
  const { data, error } = await supabase
    .from('gh_sales_products')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true });
  if (error || !data?.length) return activeMock;
  return data;
}

export async function loadSession(sessionId: string): Promise<PersistedSession | null> {
  if (isMockMode || !supabase) return null;
  const { data, error } = await supabase
    .from('gh_vr_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle();
  throwIfError(error, 'Chargement de la session');
  if (!data) return null;
  const parts = await loadParts(sessionId);
  return rowToSession(data as Record<string, unknown>, parts.steps, parts.sales, parts.salesComment);
}

export async function listOpenSessions(gmId: string): Promise<PersistedSession[]> {
  if (isMockMode || !supabase) {
    ensureDemoLinkedFixtures();
    return [...demoSessions.values()].filter((row) => !row.endedAt && !row.cancelledAt);
  }
  const { data, error } = await supabase
    .from('gh_vr_sessions')
    .select('*')
    .eq('gm_id', gmId)
    .is('ended_at', null)
    .is('cancelled_at', null)
    .order('started_at', { ascending: false });
  throwIfError(error, 'Liste des sessions ouvertes');
  const rows = data || [];
  const loaded: PersistedSession[] = [];
  for (const row of rows) {
    const parts = await loadParts(row.id);
    loaded.push(rowToSession(row as Record<string, unknown>, parts.steps, parts.sales, parts.salesComment));
  }
  return loaded;
}

const LINKED_SESSION_COLUMNS =
  'id, assignment_id, planning_activity_id, started_at, ended_at, cancelled_at';

/**
 * Non-cancelled gh_vr_sessions for this GM that belong to the given planning
 * activities (planning_activity_id or assignment_id). Includes ended rows so
 * « Mes Activités » can show Terminée / Modifier instead of Démarrer again.
 */
export async function listLinkedSessions(
  gmId: string,
  assignments: AssignedSession[]
): Promise<LinkedSessionSummary[]> {
  if (isMockMode || !supabase) {
    ensureDemoLinkedFixtures();
    return [...demoSessions.values()]
      .filter((row) => !row.cancelledAt)
      .filter((row) => assignments.some((activity) => sessionMatchesActivity(row, activity)));
  }
  if (!assignments.length) return [];

  const ids = uniqueStrings(assignments.map((row) => row.id));
  const keys = uniqueStrings([
    ...ids,
    ...assignments.map((row) => assignmentKey(row)),
  ]);

  const [byPlanning, byAssignment] = await Promise.all([
    supabase
      .from('gh_vr_sessions')
      .select(LINKED_SESSION_COLUMNS)
      .eq('gm_id', gmId)
      .is('cancelled_at', null)
      .in('planning_activity_id', ids),
    supabase
      .from('gh_vr_sessions')
      .select(LINKED_SESSION_COLUMNS)
      .eq('gm_id', gmId)
      .is('cancelled_at', null)
      .in('assignment_id', keys),
  ]);
  throwIfError(byPlanning.error, 'Lien planning → session');
  throwIfError(byAssignment.error, 'Lien planning → session');

  const byId = new Map<string, LinkedSessionSummary>();
  for (const row of [...(byPlanning.data || []), ...(byAssignment.data || [])]) {
    const summary = rowToLinkedSummary(row as Record<string, unknown>);
    byId.set(summary.sessionId, summary);
  }
  return [...byId.values()];
}

async function loadLinkedSessionForAssignment(
  gmId: string,
  assignment: AssignedSession
): Promise<PersistedSession | null> {
  const summaries = await listLinkedSessions(gmId, [assignment]);
  const picked = pickLinkedSession(assignment, summaries);
  if (!picked || shouldCreateNewSession(picked)) return null;
  if (isMockMode || !supabase) return demoSessions.get(picked.sessionId) || null;
  return loadSession(picked.sessionId);
}

const demoSessions = new Map<string, PersistedSession>();

function emptyDemoSession(partial: Omit<PersistedSession, 'startedAt' | 'completedSteps' | 'stepTimes' | 'sales' | 'salesComment' | 'salesRecordedAt' | 'endedAt' | 'cancelledAt' | 'incidentType' | 'incidentDetails' | 'notes' | 'clientEmail' | 'videosSentAt' | 'isManual' | 'plannedEndTime' | 'planningActivityId'> & {
  notes?: string;
  clientEmail?: string;
  plannedEndTime?: string | null;
  planningActivityId?: string | null;
}): PersistedSession {
  const session: PersistedSession = {
    ...partial,
    isManual: !partial.assignmentId,
    plannedEndTime: partial.plannedEndTime || null,
    planningActivityId: partial.planningActivityId || null,
    notes: partial.notes || '',
    startedAt: new Date().toISOString(),
    incidentType: null,
    incidentDetails: '',
    completedSteps: [],
    stepTimes: {},
    sales: [],
    salesComment: '',
    salesRecordedAt: null,
    endedAt: null,
    cancelledAt: null,
    clientEmail: partial.clientEmail || '',
    videosSentAt: null,
  };
  demoSessions.set(session.sessionId, session);
  return session;
}

function localIsoDate(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

let demoFixturesReady = false;

/** Demo-only: one open + one ended planning session so the GM list can show Reprendre / Modifier. */
function ensureDemoLinkedFixtures() {
  if (demoFixturesReady) return;
  demoFixturesReady = true;
  const today = localIsoDate();

  const openKey = `asgn-today-open:${today}`;
  if (!demoSessions.has(`demo-${openKey}`)) {
    emptyDemoSession({
      sessionId: `demo-${openKey}`,
      assignmentId: openKey,
      game: 'Novasphère',
      date: today,
      time: '14:00',
      groupName: 'Anniversaire',
      playerCount: 6,
      gmName: 'GM Demo',
      parcoursId: DEFAULT_PARCOURS_ID,
      stepsSnapshot: null,
      plannedEndTime: '14:45',
      planningActivityId: 'asgn-today-open',
    });
  }

  const endedKey = `asgn-today-ended:${today}`;
  if (!demoSessions.has(`demo-${endedKey}`)) {
    const row = emptyDemoSession({
      sessionId: `demo-${endedKey}`,
      assignmentId: endedKey,
      game: 'Le Serviteur de la rédemption I ou 2',
      date: today,
      time: '12:00',
      groupName: 'Famille Demo',
      playerCount: 8,
      gmName: 'GM Demo',
      parcoursId: DEFAULT_PARCOURS_ID,
      stepsSnapshot: null,
      clientEmail: 'client.demo@vrcenter.ch',
      plannedEndTime: '13:20',
      planningActivityId: 'asgn-today-ended',
    });
    row.startedAt = new Date(`${today}T12:05:00`).toISOString();
    row.endedAt = new Date(`${today}T15:49:00`).toISOString();
    row.videosSentAt = row.endedAt;
    row.salesRecordedAt = row.endedAt;
    row.sales = [
      { id: 'demo-ended-sale', productName: 'Boisson', quantity: 2, unitPrice: 4, paymentMethod: 'twint' },
    ];
  }
}

async function hydrateResumedSession(
  session: PersistedSession,
  params: { gmId: string; assignment: AssignedSession }
): Promise<PersistedSession> {
  if (!session.endedAt && !session.cancelledAt) {
    rememberActiveSession(session.sessionId);
    await ensureCheckin(params.gmId);
  }
  const fromPlanning = (params.assignment.clientEmail || '').trim();
  if (fromPlanning && !session.clientEmail) {
    await updateSessionFields(session.sessionId, { clientEmail: fromPlanning });
    session.clientEmail = fromPlanning;
  }
  return session;
}

export async function createOrResumeFromAssignment(params: {
  assignment: AssignedSession;
  gmId: string;
  gmName: string;
  /** Official game name (games table) when the planning title was matched. */
  game?: string;
  parcoursId: string;
  stepsSnapshot: ParcoursStepDef[];
}): Promise<PersistedSession> {
  const existing = await loadLinkedSessionForAssignment(params.gmId, params.assignment);
  if (existing) return hydrateResumedSession(existing, params);

  const key = assignmentKey(params.assignment);
  if (isMockMode || !supabase) {
    return emptyDemoSession({
      sessionId: `demo-${key}`,
      assignmentId: key,
      game: params.game || params.assignment.game,
      date: params.assignment.date,
      time: params.assignment.startTime,
      groupName: params.assignment.groupName || '',
      playerCount: params.assignment.playerCount,
      gmName: params.gmName,
      parcoursId: params.parcoursId,
      stepsSnapshot: params.stepsSnapshot,
      notes: params.assignment.notes || '',
      clientEmail: params.assignment.clientEmail || '',
      plannedEndTime: params.assignment.endTime || null,
      planningActivityId: params.assignment.id,
    });
  }

  return insertSession({
    gmId: params.gmId,
    gmName: params.gmName,
    game: params.game || params.assignment.game,
    date: params.assignment.date,
    time: params.assignment.startTime,
    groupName: params.assignment.groupName || '',
    playerCount: params.assignment.playerCount,
    parcoursId: params.parcoursId,
    stepsSnapshot: params.stepsSnapshot,
    notes: params.assignment.notes || '',
    assignmentId: key,
    clientEmail: params.assignment.clientEmail || '',
    plannedEndTime: params.assignment.endTime || null,
    planningActivityId: params.assignment.id,
  });
}

export async function createManualSession(params: {
  gmId: string;
  gmName: string;
  game: string;
  date: string;
  time: string;
  groupName: string;
  playerCount: number;
  parcoursId: string;
  stepsSnapshot: ParcoursStepDef[];
}): Promise<PersistedSession> {
  if (isMockMode || !supabase) {
    return emptyDemoSession({
      sessionId: `demo-${Date.now()}`,
      assignmentId: null,
      game: params.game,
      date: params.date,
      time: params.time,
      groupName: params.groupName,
      playerCount: params.playerCount,
      gmName: params.gmName,
      parcoursId: params.parcoursId,
      stepsSnapshot: params.stepsSnapshot,
    });
  }
  return insertSession({ ...params, notes: '', assignmentId: null, clientEmail: '' });
}

async function insertSession(params: {
  gmId: string;
  gmName: string;
  game: string;
  date: string;
  time: string;
  groupName: string;
  playerCount: number;
  parcoursId: string;
  stepsSnapshot: ParcoursStepDef[];
  notes: string;
  assignmentId: string | null;
  clientEmail?: string;
  plannedEndTime?: string | null;
  planningActivityId?: string | null;
}): Promise<PersistedSession> {
  // Real clock time = GM arrival. Planned slot stays in session_time.
  const startedAt = new Date().toISOString();
  const { data, error } = await supabase!
    .from('gh_vr_sessions')
    .insert({
      // IMPORTANT: gm_id DOIT être auth.users.id (JWT user.id), PAS profiles.gm_id ou game_masters.id
      // RLS policy: auth.uid() = gm_id
      gm_id: params.gmId,
      gm_name: params.gmName,
      game: params.game,
      session_date: params.date,
      session_time: params.time,
      group_name: params.groupName || null,
      player_count: params.playerCount,
      parcours_id: params.parcoursId,
      steps_snapshot: params.stepsSnapshot,
      notes: params.notes || null,
      assignment_id: params.assignmentId,
      started_at: startedAt,
      has_incident: false,
      client_email: params.clientEmail || null,
      planned_end_time: params.plannedEndTime || null,
      planning_activity_id: params.planningActivityId || null,
    })
    .select('*')
    .single();
  throwIfError(error, 'Création de la session');
  await ensureCheckin(params.gmId);
  rememberActiveSession(data!.id);
  return rowToSession(data as Record<string, unknown>, [], [], '');
}

export async function updateSessionFields(
  sessionId: string,
  patch: {
    notes?: string;
    incidentType?: IncidentType | null;
    incidentDetails?: string;
    salesComment?: string;
    salesRecordedAt?: string | null;
    totalCollected?: number;
    totalToInvoice?: number;
    endedAt?: string | null;
    clientEmail?: string;
    videosSentAt?: string | null;
  }
) {
  if (isMockMode || !supabase) {
    const session = demoSessions.get(sessionId);
    if (!session) return;
    if (patch.notes !== undefined) session.notes = patch.notes;
    if (patch.incidentType !== undefined) session.incidentType = patch.incidentType;
    if (patch.incidentDetails !== undefined) session.incidentDetails = patch.incidentDetails;
    if (patch.salesComment !== undefined) session.salesComment = patch.salesComment;
    if (patch.salesRecordedAt !== undefined) session.salesRecordedAt = patch.salesRecordedAt;
    if (patch.endedAt !== undefined) session.endedAt = patch.endedAt;
    if (patch.clientEmail !== undefined) session.clientEmail = patch.clientEmail;
    if (patch.videosSentAt !== undefined) session.videosSentAt = patch.videosSentAt;
    return;
  }
  const body: Record<string, unknown> = {};
  if (patch.notes !== undefined) body.notes = patch.notes;
  if (patch.incidentType !== undefined) {
    body.incident_type = patch.incidentType;
    body.has_incident = Boolean(patch.incidentType);
  }
  if (patch.incidentDetails !== undefined) body.incident_details = patch.incidentDetails;
  if (patch.salesComment !== undefined) body.sales_comment = patch.salesComment;
  if (patch.salesRecordedAt !== undefined) body.sales_recorded_at = patch.salesRecordedAt;
  if (patch.totalCollected !== undefined) body.total_collected = patch.totalCollected;
  if (patch.totalToInvoice !== undefined) body.total_to_invoice = patch.totalToInvoice;
  if (patch.endedAt !== undefined) body.ended_at = patch.endedAt;
  if (patch.clientEmail !== undefined) body.client_email = patch.clientEmail;
  if (patch.videosSentAt !== undefined) body.videos_sent_at = patch.videosSentAt;
  if (Object.keys(body).length === 0) return;
  const { error } = await supabase.from('gh_vr_sessions').update(body).eq('id', sessionId);
  if (error && body.sales_recorded_at !== undefined && /sales_recorded_at/.test(error.message)) {
    delete body.sales_recorded_at;
    if (Object.keys(body).length === 0) return;
    const retry = await supabase.from('gh_vr_sessions').update(body).eq('id', sessionId);
    throwIfError(retry.error, 'Mise à jour de la session');
    return;
  }
  throwIfError(error, 'Mise à jour de la session');
}

export async function setStepCompleted(sessionId: string, step: SessionStep, completed: boolean) {
  if (isMockMode || !supabase) {
    const session = demoSessions.get(sessionId);
    if (!session) return;
    if (completed) {
      if (!session.completedSteps.includes(step)) session.completedSteps = [...session.completedSteps, step];
      session.stepTimes = { ...session.stepTimes, [step]: new Date().toISOString() };
    } else {
      session.completedSteps = session.completedSteps.filter((item) => item !== step);
      const next = { ...session.stepTimes };
      delete next[step];
      session.stepTimes = next;
    }
    return;
  }
  if (completed) {
    const { error } = await supabase.from('gh_session_steps').upsert(
      { session_id: sessionId, step, completed_at: new Date().toISOString() },
      { onConflict: 'session_id,step' }
    );
    throwIfError(error, 'Étape');
  } else {
    const { error } = await supabase
      .from('gh_session_steps')
      .delete()
      .eq('session_id', sessionId)
      .eq('step', step);
    throwIfError(error, 'Étape');
  }
}

export async function replaceSales(
  sessionId: string,
  items: SaleItem[],
  comment: string,
  products: SalesProduct[]
) {
  const recordedAt = new Date().toISOString();
  if (isMockMode || !supabase) {
    const session = demoSessions.get(sessionId);
    if (session) {
      session.sales = items;
      session.salesComment = comment;
      session.salesRecordedAt = session.salesRecordedAt || recordedAt;
    }
    return;
  }
  const { error: delErr } = await supabase.from('gh_session_sales').delete().eq('session_id', sessionId);
  throwIfError(delErr, 'Ventes');
  if (items.length) {
    const rows = items.map((item) => {
      const product = products.find((p) => p.name === item.productName);
      return {
        session_id: sessionId,
        product_id: item.productId || product?.id || null,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.isOffered ? 0 : item.unitPrice,
        payment_method: item.paymentMethod,
        is_invoiced: !item.isOffered && item.paymentMethod === 'facture',
        is_offered: Boolean(item.isOffered),
        catalog_unit_price:
          item.catalogUnitPrice ?? (product ? Number(product.unit_price) : null),
      };
    });
    const { error } = await supabase.from('gh_session_sales').insert(rows);
    throwIfError(error, 'Ventes');
  }
  const totals = computeSalesTotals(items);
  await updateSessionFields(sessionId, {
    salesComment: comment,
    salesRecordedAt: recordedAt,
    totalCollected: totals.collected,
    totalToInvoice: totals.toInvoice,
  });
}

export async function endSession(sessionId: string) {
  if (isMockMode || !supabase) {
    const session = demoSessions.get(sessionId);
    if (session) session.endedAt = new Date().toISOString();
    rememberActiveSession(null);
    return;
  }
  await updateSessionFields(sessionId, { endedAt: new Date().toISOString() });
  rememberActiveSession(null);
}

/**
 * Undo a wrong start / test: soft-cancel the still-open session so the
 * assignment can be started again and Historique does not list it as a
 * finished party.
 */
export async function cancelOpenSession(sessionId: string) {
  if (isMockMode || !supabase) {
    const session = demoSessions.get(sessionId);
    if (session) {
      if (session.cancelledAt) {
        rememberActiveSession(null);
        return;
      }
      if (session.endedAt) throw new Error('Cette session est déjà terminée');
      const now = new Date().toISOString();
      session.cancelledAt = now;
      session.endedAt = now;
    }
    rememberActiveSession(null);
    return;
  }
  const { error } = await supabase.rpc('gh_cancel_open_session', { p_session_id: sessionId });
  throwIfError(error, 'Annulation de la session');
  rememberActiveSession(null);
}

export async function ensureCheckin(gmId: string) {
  if (isMockMode || !supabase) return;
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('gh_gm_checkins')
    .select('id')
    .eq('gm_id', gmId)
    .gte('checkin_time', `${today}T00:00:00`)
    .limit(1);
  throwIfError(error, 'Check-in');
  if (data && data.length > 0) return;
  const { error: insErr } = await supabase.from('gh_gm_checkins').insert({
    gm_id: gmId,
    checkin_time: new Date().toISOString(),
  });
  throwIfError(insErr, 'Check-in');
}

export async function listCheckinsThisMonth(gmId: string): Promise<number> {
  if (isMockMode || !supabase) return 0;
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const { count, error } = await supabase
    .from('gh_gm_checkins')
    .select('id', { count: 'exact', head: true })
    .eq('gm_id', gmId)
    .gte('checkin_time', start.toISOString());
  if (error) return 0;
  return count || 0;
}

export async function listSessionsThisMonth(gmId: string): Promise<number> {
  if (isMockMode || !supabase) return 0;
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const { count, error } = await supabase
    .from('gh_vr_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('gm_id', gmId)
    .is('cancelled_at', null)
    .gte('started_at', start.toISOString());
  if (error) return 0;
  return count || 0;
}

const CRIT_ORDER: Record<string, number> = {
  critical: 0,
  critique: 0,
  high: 1,
  haute: 1,
  medium: 2,
  moyenne: 2,
  low: 3,
  basse: 3,
};

export async function listBugsForSession(sessionId: string): Promise<SessionBug[]> {
  if (isMockMode || !supabase) return [];
  const { data: byId, error: e1 } = await supabase
    .from('gh_bug_sessions')
    .select('id, ref')
    .eq('vr_session_id', sessionId);
  throwIfError(e1, 'Bugs');
  const { data: byRef, error: e2 } = await supabase
    .from('gh_bug_sessions')
    .select('id, ref')
    .eq('ref', sessionId);
  throwIfError(e2, 'Bugs');

  const sessions = [...(byId || []), ...(byRef || [])];
  const ids = Array.from(new Set(sessions.map((s) => s.id)));
  if (!ids.length) return [];

  const { data: entries, error: e3 } = await supabase
    .from('gh_bug_entries')
    .select('*')
    .in('bug_session_id', ids);
  throwIfError(e3, 'Bugs');

  const bugs: SessionBug[] = (entries || []).map((entry) => ({
    bugSessionId: entry.bug_session_id,
    ref: sessions.find((s) => s.id === entry.bug_session_id)?.ref || null,
    description: entry.description,
    criticality: entry.criticality,
    category: entry.category,
    position: entry.position ?? 0,
    status: entry.status,
  }));

  bugs.sort((a, b) => {
    const ca = CRIT_ORDER[(a.criticality || '').toLowerCase()] ?? 9;
    const cb = CRIT_ORDER[(b.criticality || '').toLowerCase()] ?? 9;
    if (ca !== cb) return ca - cb;
    return a.position - b.position;
  });
  return bugs;
}
