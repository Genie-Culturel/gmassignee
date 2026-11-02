import { supabase, isMockMode } from './supabase';
import {
  IncidentType,
  PaymentMethod,
  SalesProduct,
  SessionStep,
} from './database.types';
import { AssignedSession } from './assignedSessions';
import { DEFAULT_PARCOURS_ID } from './parcours';
import { mockSalesProducts } from './mockData';
import { ACTIVE_SESSION_STORAGE_KEY } from './config';

export interface SaleItem {
  id: string;
  productId?: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  paymentMethod: PaymentMethod;
}

export interface PersistedSession {
  sessionId: string;
  assignmentId: string | null;
  game: string;
  date: string;
  time: string;
  groupName: string;
  playerCount: number;
  gmName: string;
  parcoursId: string;
  notes: string;
  incidentType: IncidentType | null;
  incidentDetails: string;
  completedSteps: SessionStep[];
  sales: SaleItem[];
  salesComment: string;
  endedAt: string | null;
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

function rowToSession(
  row: Record<string, unknown>,
  steps: SessionStep[],
  sales: SaleItem[],
  salesComment: string
): PersistedSession {
  const time = String(row.session_time || '00:00').slice(0, 5);
  return {
    sessionId: String(row.id),
    assignmentId: (row.assignment_id as string) || null,
    game: (row.game as string) || 'VR Session',
    date: String(row.session_date || '').slice(0, 10),
    time,
    groupName: (row.group_name as string) || '',
    playerCount: Number(row.player_count || 0) || 8,
    gmName: (row.gm_name as string) || 'GM',
    parcoursId: (row.parcours_id as string) || DEFAULT_PARCOURS_ID,
    notes: (row.notes as string) || '',
    incidentType: (row.incident_type as IncidentType) || null,
    incidentDetails: (row.incident_details as string) || '',
    completedSteps: steps,
    sales,
    salesComment,
    endedAt: (row.ended_at as string) || null,
  };
}

async function loadParts(sessionId: string): Promise<{
  steps: SessionStep[];
  sales: SaleItem[];
  salesComment: string;
}> {
  const [stepsRes, salesRes, sessionRes] = await Promise.all([
    supabase!.from('session_steps').select('step').eq('session_id', sessionId),
    supabase!.from('session_sales').select('*').eq('session_id', sessionId),
    supabase!.from('vr_sessions').select('sales_comment').eq('id', sessionId).maybeSingle(),
  ]);
  throwIfError(stepsRes.error, 'Chargement des étapes');
  throwIfError(salesRes.error, 'Chargement des ventes');

  return {
    steps: (stepsRes.data || []).map((s) => s.step as SessionStep),
    sales: (salesRes.data || []).map((s) => ({
      id: s.id,
      productId: s.product_id,
      productName: s.product_name,
      quantity: s.quantity,
      unitPrice: Number(s.unit_price),
      paymentMethod: s.payment_method,
    })),
    salesComment: sessionRes.data?.sales_comment || '',
  };
}

export async function fetchSalesProducts(): Promise<SalesProduct[]> {
  if (isMockMode || !supabase) return mockSalesProducts;
  const { data, error } = await supabase
    .from('sales_products')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true });
  if (error || !data?.length) return mockSalesProducts;
  return data;
}

export async function loadSession(sessionId: string): Promise<PersistedSession | null> {
  if (isMockMode || !supabase) return null;
  const { data, error } = await supabase
    .from('vr_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle();
  throwIfError(error, 'Chargement de la session');
  if (!data) return null;
  const parts = await loadParts(sessionId);
  return rowToSession(data as Record<string, unknown>, parts.steps, parts.sales, parts.salesComment);
}

export async function listOpenSessions(gmId: string): Promise<PersistedSession[]> {
  if (isMockMode || !supabase) return [];
  const { data, error } = await supabase
    .from('vr_sessions')
    .select('*')
    .eq('gm_id', gmId)
    .is('ended_at', null)
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

export async function createOrResumeFromAssignment(params: {
  assignment: AssignedSession;
  gmId: string;
  gmName: string;
}): Promise<PersistedSession> {
  const key = assignmentKey(params.assignment);
  if (isMockMode || !supabase) {
    return {
      sessionId: `demo-${key}`,
      assignmentId: key,
      game: params.assignment.game,
      date: params.assignment.date,
      time: params.assignment.time,
      groupName: params.assignment.groupName,
      playerCount: params.assignment.playerCount,
      gmName: params.gmName,
      parcoursId: params.assignment.parcoursId || DEFAULT_PARCOURS_ID,
      notes: params.assignment.notes || '',
      incidentType: null,
      incidentDetails: '',
      completedSteps: [],
      sales: [],
      salesComment: '',
      endedAt: null,
    };
  }

  const existing = await supabase
    .from('vr_sessions')
    .select('*')
    .eq('gm_id', params.gmId)
    .eq('assignment_id', key)
    .is('ended_at', null)
    .maybeSingle();
  throwIfError(existing.error, 'Recherche de session');
  if (existing.data) {
    const parts = await loadParts(existing.data.id);
    const session = rowToSession(
      existing.data as Record<string, unknown>,
      parts.steps,
      parts.sales,
      parts.salesComment
    );
    rememberActiveSession(session.sessionId);
    await ensureCheckin(params.gmId);
    return session;
  }

  return insertSession({
    gmId: params.gmId,
    gmName: params.gmName,
    game: params.assignment.game,
    date: params.assignment.date,
    time: params.assignment.time,
    groupName: params.assignment.groupName,
    playerCount: params.assignment.playerCount,
    parcoursId: params.assignment.parcoursId || DEFAULT_PARCOURS_ID,
    notes: params.assignment.notes || '',
    assignmentId: key,
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
}): Promise<PersistedSession> {
  if (isMockMode || !supabase) {
    return {
      sessionId: `demo-${Date.now()}`,
      assignmentId: null,
      game: params.game,
      date: params.date,
      time: params.time,
      groupName: params.groupName,
      playerCount: params.playerCount,
      gmName: params.gmName,
      parcoursId: params.parcoursId,
      notes: '',
      incidentType: null,
      incidentDetails: '',
      completedSteps: [],
      sales: [],
      salesComment: '',
      endedAt: null,
    };
  }
  return insertSession({ ...params, notes: '', assignmentId: null });
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
  notes: string;
  assignmentId: string | null;
}): Promise<PersistedSession> {
  const startedAt = new Date(`${params.date}T${params.time}:00`).toISOString();
  const { data, error } = await supabase!
    .from('vr_sessions')
    .insert({
      gm_id: params.gmId,
      gm_name: params.gmName,
      game: params.game,
      session_date: params.date,
      session_time: params.time,
      group_name: params.groupName || null,
      player_count: params.playerCount,
      parcours_id: params.parcoursId,
      notes: params.notes || null,
      assignment_id: params.assignmentId,
      started_at: startedAt,
      has_incident: false,
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
    totalCollected?: number;
    totalToInvoice?: number;
    endedAt?: string | null;
  }
) {
  if (isMockMode || !supabase) return;
  const body: Record<string, unknown> = {};
  if (patch.notes !== undefined) body.notes = patch.notes;
  if (patch.incidentType !== undefined) {
    body.incident_type = patch.incidentType;
    body.has_incident = Boolean(patch.incidentType);
  }
  if (patch.incidentDetails !== undefined) body.incident_details = patch.incidentDetails;
  if (patch.salesComment !== undefined) body.sales_comment = patch.salesComment;
  if (patch.totalCollected !== undefined) body.total_collected = patch.totalCollected;
  if (patch.totalToInvoice !== undefined) body.total_to_invoice = patch.totalToInvoice;
  if (patch.endedAt !== undefined) body.ended_at = patch.endedAt;
  if (Object.keys(body).length === 0) return;
  const { error } = await supabase.from('vr_sessions').update(body).eq('id', sessionId);
  throwIfError(error, 'Mise à jour de la session');
}

export async function setStepCompleted(sessionId: string, step: SessionStep, completed: boolean) {
  if (isMockMode || !supabase) return;
  if (completed) {
    const { error } = await supabase.from('session_steps').upsert(
      { session_id: sessionId, step, completed_at: new Date().toISOString() },
      { onConflict: 'session_id,step' }
    );
    throwIfError(error, 'Étape');
  } else {
    const { error } = await supabase
      .from('session_steps')
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
  if (isMockMode || !supabase) return;
  const { error: delErr } = await supabase.from('session_sales').delete().eq('session_id', sessionId);
  throwIfError(delErr, 'Ventes');
  if (items.length) {
    const rows = items.map((item) => {
      const product = products.find((p) => p.name === item.productName);
      return {
        session_id: sessionId,
        product_id: item.productId || product?.id || null,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        payment_method: item.paymentMethod,
        is_invoiced: item.paymentMethod === 'facture',
      };
    });
    const { error } = await supabase.from('session_sales').insert(rows);
    throwIfError(error, 'Ventes');
  }
  const totals = items.reduce(
    (acc, item) => {
      const line = item.quantity * item.unitPrice;
      if (item.paymentMethod === 'facture') acc.toInvoice += line;
      else acc.collected += line;
      return acc;
    },
    { collected: 0, toInvoice: 0 }
  );
  await updateSessionFields(sessionId, {
    salesComment: comment,
    totalCollected: totals.collected,
    totalToInvoice: totals.toInvoice,
  });
}

export async function endSession(sessionId: string) {
  await updateSessionFields(sessionId, { endedAt: new Date().toISOString() });
  rememberActiveSession(null);
}

export async function ensureCheckin(gmId: string) {
  if (isMockMode || !supabase) return;
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('gm_checkins')
    .select('id')
    .eq('gm_id', gmId)
    .gte('checkin_time', `${today}T00:00:00`)
    .limit(1);
  throwIfError(error, 'Check-in');
  if (data && data.length > 0) return;
  const { error: insErr } = await supabase.from('gm_checkins').insert({
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
    .from('gm_checkins')
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
    .from('vr_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('gm_id', gmId)
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
    .from('bug_sessions')
    .select('id, ref')
    .eq('vr_session_id', sessionId);
  throwIfError(e1, 'Bugs');
  const { data: byRef, error: e2 } = await supabase
    .from('bug_sessions')
    .select('id, ref')
    .eq('ref', sessionId);
  throwIfError(e2, 'Bugs');

  const sessions = [...(byId || []), ...(byRef || [])];
  const ids = Array.from(new Set(sessions.map((s) => s.id)));
  if (!ids.length) return [];

  const { data: entries, error: e3 } = await supabase
    .from('bug_entries')
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
