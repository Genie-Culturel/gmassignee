/**
 * Make.com webhook for « Envoyer au client » (souvenirs e-mail + Dropbox archive).
 * Does not go through Resend / send-session-videos.
 */

export const MAKE_SOUVENIRS_WEBHOOK_URL =
  'https://hook.eu2.make.com/i56ons76xq6y3gcmdp4tgfraw5cdur8k';

/** Signed file URLs for Make/Dropbox — 48 h, above the required 24 h. */
export const SOUVENIRS_FILE_URL_TTL_SECONDS = 48 * 60 * 60;

export interface SouvenirsMakeFile {
  url: string;
  name: string;
}

export interface SouvenirsMakePayload {
  clientEmail: string;
  souvenirLink: string;
  sessionId: string;
  sessionLabel: string;
  gmName: string;
  expiresAt: string;
  files: SouvenirsMakeFile[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Dropbox folder names cannot contain \ / : * ? " < > | ; also strip #. */
const DROPBOX_UNSAFE = /[\\/:*?"<>|#]/g;

export function isClientEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

const EMAIL_IN_TEXT_RE = /(?:mailto:)?([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi;

/** First valid e-mail in free text (reservation details, HTML, mailto:). */
export function firstEmailInText(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const decoded = value.replace(/&#64;/gi, '@').replace(/&amp;/g, '&');
  EMAIL_IN_TEXT_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = EMAIL_IN_TEXT_RE.exec(decoded))) {
    const candidate = match[1].replace(/[.,;:]+$/g, '').trim();
    if (isClientEmail(candidate)) return candidate;
  }
  return undefined;
}

/**
 * Same split as Lovable `EventDescriptionFormatter`: header (« Informations générales »)
 * then 5+ dashes, then « Détails de la réservation » (booking number, name, e-mail…).
 */
export function reservationDetailsText(description: string | null | undefined): string {
  if (!description) return '';
  const parts = description.split(/\n?[-–—]{5,}\n?/);
  if (parts.length >= 2) return parts.slice(1).join('\n').trim();
  return description;
}

export function sanitizeDropboxLabel(value: string): string {
  return value.replace(DROPBOX_UNSAFE, ' ').replace(/\s+/g, ' ').trim();
}

function formatDotDate(d: Date, timeZone = 'Europe/Zurich'): string {
  const parts = new Intl.DateTimeFormat('fr-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone,
  }).formatToParts(d);
  const day = parts.find((p) => p.type === 'day')?.value || '';
  const month = parts.find((p) => p.type === 'month')?.value || '';
  const year = parts.find((p) => p.type === 'year')?.value || '';
  return `${day}.${month}.${year}`;
}

/** Session date YYYY-MM-DD → dd.mm.yyyy (no slashes). */
export function formatSouvenirsSessionDate(isoDate: string): string {
  const m = String(isoDate || '')
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}.${m[2]}.${m[1]}`;
  const d = new Date(isoDate);
  if (!Number.isNaN(d.getTime())) return formatDotDate(d);
  return sanitizeDropboxLabel(String(isoDate).replace(/[/-]/g, '.'));
}

/** 14:30 / 14.30 → 14h30. */
export function formatSouvenirsSessionTime(time: string): string {
  const m = String(time || '')
    .trim()
    .match(/^(\d{1,2})[:hH.](\d{2})/);
  if (m) return `${m[1].padStart(2, '0')}h${m[2]}`;
  return sanitizeDropboxLabel(String(time || '').replace(/:/g, 'h'));
}

/** e.g. « La Bataille de la Planta 09.11.2026 14h30 » — safe as a Dropbox folder name. */
export function formatSouvenirsSessionLabel(game: string, date: string, time: string): string {
  return sanitizeDropboxLabel(
    [sanitizeDropboxLabel(game || 'Session'), formatSouvenirsSessionDate(date), formatSouvenirsSessionTime(time)]
      .filter(Boolean)
      .join(' ')
  );
}

/** Souvenirs link expiry as dd.mm.yyyy (Europe/Zurich). */
export function formatSouvenirsExpiry(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return formatSouvenirsSessionDate(iso);
  return formatDotDate(d);
}

export function buildSouvenirsMakePayload(input: {
  clientEmail: string;
  souvenirLink: string;
  sessionId: string;
  game: string;
  date: string;
  time: string;
  gmName: string;
  expiresAtIso: string;
  files: SouvenirsMakeFile[];
}): SouvenirsMakePayload {
  return {
    clientEmail: input.clientEmail,
    souvenirLink: input.souvenirLink,
    sessionId: input.sessionId,
    sessionLabel: formatSouvenirsSessionLabel(input.game, input.date, input.time),
    gmName: input.gmName || 'GM',
    expiresAt: formatSouvenirsExpiry(input.expiresAtIso),
    files: input.files,
  };
}

/**
 * Client e-mail for a planning `activities` row.
 * Dedicated columns first (if present), else first valid e-mail in
 * `description` « Détails de la réservation » (Make free text), then notes.
 */
export function clientEmailFromActivity(activity: Record<string, unknown> | null | undefined): string | undefined {
  if (!activity || typeof activity !== 'object') return undefined;
  const nested =
    activity.client && typeof activity.client === 'object'
      ? (activity.client as Record<string, unknown>)
      : null;
  const dedicated: unknown[] = [
    activity.client_email,
    activity.clientEmail,
    activity.customer_email,
    activity.guest_email,
    activity.contact_email,
    activity.email,
    nested?.email,
    nested?.client_email,
  ];
  for (const value of dedicated) {
    if (typeof value === 'string' && isClientEmail(value)) return value.trim();
  }
  const description = typeof activity.description === 'string' ? activity.description : '';
  const fromDetails = firstEmailInText(reservationDetailsText(description));
  if (fromDetails) return fromDetails;
  const fromWholeDescription = firstEmailInText(description);
  if (fromWholeDescription) return fromWholeDescription;
  for (const key of ['admin_notes', 'notes', 'note'] as const) {
    const value = activity[key];
    if (typeof value === 'string') {
      const found = firstEmailInText(value);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * POST JSON to the Make webhook. Verified: hook.eu2.make.com answers OPTIONS/POST
 * with Access-Control-Allow-Origin: * and Allow-Headers: content-type, so
 * application/json works from the GitHub Pages origin. text/plain then no-cors
 * are fallbacks if a preflight were to fail.
 */
export async function postMakeSouvenirsWebhook(payload: SouvenirsMakePayload): Promise<void> {
  const body = JSON.stringify(payload);
  const post = async (contentType: string, mode: RequestMode = 'cors') => {
    const res = await fetch(MAKE_SOUVENIRS_WEBHOOK_URL, {
      method: 'POST',
      mode,
      headers: { 'Content-Type': contentType },
      body,
    });
    if (mode === 'no-cors') return;
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text ? `Webhook Make (${res.status}): ${text}` : `Webhook Make: HTTP ${res.status}`);
    }
  };

  try {
    await post('application/json');
    return;
  } catch (err) {
    if (!(err instanceof TypeError)) throw err;
  }
  try {
    await post('text/plain');
    return;
  } catch (err) {
    if (!(err instanceof TypeError)) throw err;
  }
  await post('text/plain', 'no-cors');
}
