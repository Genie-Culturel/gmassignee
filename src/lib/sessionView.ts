import { isMockMode, supabase } from './supabase';
import { SESSION_MEDIA_BUCKET, listSessionMedia } from './sessionMedia';
import { souvenirsPageUrl } from './config';
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

export type SessionFlagKind = 'incident' | 'remark' | 'cash';

export interface SessionFlag {
  kind: SessionFlagKind;
  /** Badge text, e.g. « Incident », « Remarque », « Encaissé CHF 120.– ». */
  label: string;
  /** Short excerpt for the tooltip / consultation view. */
  excerpt: string;
}

/** Swiss style: CHF 120.– / CHF 1’250.– / CHF 79.50 */
export function formatChf(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  if (Number.isInteger(rounded)) return `CHF ${rounded.toLocaleString('de-CH')}.–`;
  return `CHF ${rounded.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const PAY_LABELS: Record<string, string> = { twint: 'Twint', especes: 'Espèces', carte: 'Carte', facture: 'Facture' };

interface SaleLike {
  quantity: number;
  unitPrice: number;
  paymentMethod: string;
}

/** Collected from the client on site (everything except « facture »). */
export function collectedFromSales(sales: SaleLike[]): { amount: number; methods: string[] } {
  let amount = 0;
  const methods = new Set<string>();
  for (const sale of sales) {
    if (sale.paymentMethod === 'facture') continue;
    const line = Number(sale.quantity || 0) * Number(sale.unitPrice || 0);
    if (line > 0) {
      amount += line;
      methods.add(PAY_LABELS[sale.paymentMethod] || sale.paymentMethod);
    }
  }
  return { amount, methods: [...methods] };
}

function shorten(text: string, max = 160): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function computeSessionFlags(input: {
  hasIncident: boolean;
  incidentType: IncidentType | null;
  incidentDetails: string;
  notes: string;
  salesComment: string;
  collected: number;
  collectedMethods?: string[];
}): SessionFlag[] {
  const flags: SessionFlag[] = [];
  const details = (input.incidentDetails || '').trim();
  if (input.hasIncident || input.incidentType || details) {
    flags.push({ kind: 'incident', label: 'Incident', excerpt: shorten(details) });
  }
  const remark = [input.notes, input.salesComment]
    .map((text) => (text || '').trim())
    .filter(Boolean)
    .join(' · ');
  if (remark) flags.push({ kind: 'remark', label: 'Remarque', excerpt: shorten(remark) });
  if (input.collected > 0) {
    const methods = input.collectedMethods?.length ? ` (${input.collectedMethods.join(', ')})` : '';
    flags.push({
      kind: 'cash',
      label: `Encaissé ${formatChf(input.collected)}`,
      excerpt: `Montant encaissé auprès du client : ${formatChf(input.collected)}${methods}`,
    });
  }
  return flags;
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
  flags: SessionFlag[];
  flagReviewedAt: string | null;
  /** session_media rows still listed (null = unknown). */
  mediaCount: number | null;
}

const DEMO_REVIEW_KEY = 'gmassignee_demo_flag_reviews';

function readDemoReviews(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(DEMO_REVIEW_KEY) || '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

const DEMO_DELETED_KEY = 'gmassignee_demo_deleted_sessions';

function readDemoDeleted(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(DEMO_DELETED_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function demoSessions(): PersistedSession[] {
  const deleted = new Set(readDemoDeleted());
  return allDemoSessions().filter((s) => !deleted.has(s.sessionId));
}

function allDemoSessions(): PersistedSession[] {
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
    flags: computeSessionFlags({
      hasIncident,
      incidentType: session.incidentType,
      incidentDetails: session.incidentDetails,
      notes: session.notes,
      salesComment: session.salesComment,
      collected: collectedFromSales(session.sales).amount,
      collectedMethods: collectedFromSales(session.sales).methods,
    }),
    flagReviewedAt: reviewedAt,
    mediaCount: session.sessionId === 'demo-sent' ? 2 : 0,
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
      'id, game, session_date, session_time, group_name, gm_name, client_email, videos_sent_at, has_incident, incident_type, incident_details, notes, sales_comment, flag_reviewed_at, is_manual, assignment_id, total_collected, session_sales(quantity, unit_price, payment_method), session_media(count)'
    )
    .order('started_at', { ascending: false })
    .limit(60);
  if (error) throw new Error(error.message);
  return (data || []).map((row) => {
    const sales = ((row.session_sales || []) as { quantity: number; unit_price: number; payment_method: string }[]).map(
      (sale) => ({ quantity: sale.quantity, unitPrice: Number(sale.unit_price), paymentMethod: sale.payment_method })
    );
    const fromSales = collectedFromSales(sales);
    const collected = Math.max(fromSales.amount, Number(row.total_collected || 0));
    const mediaAgg = row.session_media as { count: number }[] | null | undefined;
    return {
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
    flags: computeSessionFlags({
      hasIncident: Boolean(row.has_incident),
      incidentType: row.incident_type,
      incidentDetails: row.incident_details || '',
      notes: row.notes || '',
      salesComment: row.sales_comment || '',
      collected,
      collectedMethods: fromSales.methods,
    }),
    flagReviewedAt: row.flag_reviewed_at || null,
    mediaCount: Array.isArray(mediaAgg) ? Number(mediaAgg[0]?.count || 0) : null,
    };
  });
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

export type MediaKind = 'video' | 'photo' | 'file';

export interface AdminMediaItem {
  id: string;
  name: string;
  size: number;
  kind: MediaKind;
  expiresAt: string;
  expired: boolean;
  /** Signed URL (1 h) to view the file, null if expired / unavailable. */
  url: string | null;
}

export interface AdminSessionMedia {
  items: AdminMediaItem[];
  /** Public client page (/souvenirs/?token=…) when the session has a token. */
  souvenirsUrl: string | null;
  /** Earliest expiry of the still-listed files. */
  expiresAt: string | null;
}

export function mediaKindOf(mime: string | null | undefined, name: string): MediaKind {
  const m = (mime || '').toLowerCase();
  if (m.startsWith('video/')) return 'video';
  if (m.startsWith('image/')) return 'photo';
  const ext = name.toLowerCase().split('.').pop() || '';
  if (['mp4', 'mov', 'm4v', 'webm', 'avi', 'mkv', '3gp'].includes(ext)) return 'video';
  if (['jpg', 'jpeg', 'png', 'heic', 'heif', 'webp', 'gif'].includes(ext)) return 'photo';
  return 'file';
}

/** Admin consultation: session_media rows + 1 h signed view URLs (RLS: admins read all, storage select is_admin()). */
export async function loadSessionMediaForAdmin(sessionId: string): Promise<AdminSessionMedia> {
  const now = Date.now();
  if ((isMockMode || !supabase) && sessionId === 'demo-sent') {
    const expiresAt = new Date(now + 13 * 86400000).toISOString();
    return {
      items: [
        { id: 'dm1', name: 'IMG_0001.mov', size: 17_300_000, kind: 'video', expiresAt, expired: false, url: null },
        {
          id: 'dm2',
          name: 'Photo_groupe.webp',
          size: 40_000,
          kind: 'photo',
          expiresAt,
          expired: false,
          url: `${import.meta.env.BASE_URL}brand/souvenirs-bg-800.webp`,
        },
      ],
      souvenirsUrl: souvenirsPageUrl('demo-demo-sent'),
      expiresAt,
    };
  }
  const rows = await listSessionMedia(sessionId);
  let urls: Record<string, string> = {};
  let souvenirsUrl: string | null = null;
  if (!isMockMode && supabase) {
    const live = rows.filter((row) => new Date(row.expires_at).getTime() > now).map((row) => row.path);
    if (live.length) {
      const { data } = await supabase.storage.from(SESSION_MEDIA_BUCKET).createSignedUrls(live, 3600);
      urls = Object.fromEntries(
        (data || [])
          .filter((item) => item.path && item.signedUrl)
          .map((item) => [item.path as string, item.signedUrl as string])
      );
    }
    const { data: tokenRow } = await supabase
      .from('vr_sessions')
      .select('videos_download_token')
      .eq('id', sessionId)
      .maybeSingle();
    const token = (tokenRow as { videos_download_token?: string } | null)?.videos_download_token;
    if (token && rows.length) souvenirsUrl = souvenirsPageUrl(token);
  } else if (rows.length) {
    souvenirsUrl = souvenirsPageUrl(`demo-${sessionId}`);
  }
  const items = rows.map((row) => {
    const expired = new Date(row.expires_at).getTime() <= now;
    return {
      id: row.id,
      name: row.original_name,
      size: row.size,
      kind: mediaKindOf(row.mime, row.original_name),
      expiresAt: row.expires_at,
      expired,
      url: expired ? null : urls[row.path] || null,
    };
  });
  const liveExpiries = items.filter((item) => !item.expired).map((item) => item.expiresAt).sort();
  return { items, souvenirsUrl, expiresAt: liveExpiries[0] || null };
}

/**
 * Admin only: delete a session for good.
 * 1. Storage files of the session (API Storage, policy delete is_admin()) — SQL cannot delete them.
 * 2. RPC admin_delete_session (migration 024): checks is_admin(), deletes steps, sales, media rows,
 *    unlinks bug reports and deletes vr_sessions (the client souvenirs token dies with it).
 */
export async function deleteSessionAsAdmin(sessionId: string): Promise<{ filesRemoved: number }> {
  if (isMockMode || !supabase) {
    const deleted = new Set(readDemoDeleted());
    deleted.add(sessionId);
    try {
      localStorage.setItem(DEMO_DELETED_KEY, JSON.stringify([...deleted]));
    } catch {
      /* ignore */
    }
    return { filesRemoved: 0 };
  }
  const paths = new Set<string>();
  const { data: mediaRows, error: mediaErr } = await supabase
    .from('session_media')
    .select('path')
    .eq('session_id', sessionId);
  if (mediaErr) throw new Error(mediaErr.message);
  for (const row of mediaRows || []) if (row.path) paths.add(row.path as string);
  const { data: listed } = await supabase.storage.from(SESSION_MEDIA_BUCKET).list(sessionId, { limit: 1000 });
  for (const obj of listed || []) if (obj.name) paths.add(`${sessionId}/${obj.name}`);

  if (paths.size) {
    const { error: removeErr } = await supabase.storage.from(SESSION_MEDIA_BUCKET).remove([...paths]);
    if (removeErr) throw new Error(`Suppression des fichiers impossible : ${removeErr.message}`);
  }
  const { error } = await supabase.rpc('admin_delete_session', { p_session_id: sessionId });
  if (error) throw new Error(error.message);
  return { filesRemoved: paths.size };
}
