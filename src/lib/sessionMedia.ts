import * as tus from 'tus-js-client';
import { isMockMode, supabase } from './supabase';
import { DEFAULT_SUPABASE_ANON_KEY, DEFAULT_SUPABASE_URL, souvenirsPageUrl, STORAGE_BUCKET_SESSION_MEDIA, EDGE_FUNCTION_SEND_SESSION_VIDEOS } from './config';
import {
  SOUVENIRS_FILE_URL_TTL_SECONDS,
  SouvenirsMakeFile,
  buildSouvenirsMakePayload,
  isClientEmail,
  postMakeSouvenirsWebhook,
} from './souvenirsMake';

export const SESSION_MEDIA_BUCKET = STORAGE_BUCKET_SESSION_MEDIA;
export const SESSION_MEDIA_MAX_BYTES = 300 * 1024 * 1024;
export const SESSION_MEDIA_MAX_LABEL = '300 Mo';
export const SESSION_MEDIA_TTL_DAYS = 14;

export const FILMING_NOTICE =
  'La partie sera filmée (2 courtes vidéos) : vous recevrez un lien pour les télécharger, valable 14 jours, ensuite elles sont supprimées.';

const DEMO_MEDIA_KEY = 'gmassignee_session_media';

export interface SessionMediaFile {
  id: string;
  session_id: string;
  path: string;
  original_name: string;
  size: number;
  mime: string | null;
  uploaded_at: string;
  expires_at: string;
}

export type UploadStatus = 'queued' | 'uploading' | 'done' | 'error' | 'too_large';

export interface LocalUpload {
  localId: string;
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
  remote?: SessionMediaFile;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} Ko`;
  return `${(n / (1024 * 1024)).toFixed(1)} Mo`;
}

export function isAllowedMedia(file: File): boolean {
  const type = file.type || '';
  return type.startsWith('video/') || type.startsWith('image/');
}

function safeName(name: string): string {
  return (name || 'fichier').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80);
}

function objectPath(sessionId: string, file: File): string {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
  return `${sessionId}/${id}-${safeName(file.name)}`;
}

function readDemoMedia(sessionId: string): SessionMediaFile[] {
  try {
    const raw = window.localStorage.getItem(DEMO_MEDIA_KEY);
    const all = raw ? (JSON.parse(raw) as SessionMediaFile[]) : [];
    return Array.isArray(all) ? all.filter((row) => row.session_id === sessionId) : [];
  } catch {
    return [];
  }
}

function writeDemoMedia(sessionId: string, rows: SessionMediaFile[]) {
  try {
    const raw = window.localStorage.getItem(DEMO_MEDIA_KEY);
    const all = raw ? (JSON.parse(raw) as SessionMediaFile[]) : [];
    const others = Array.isArray(all) ? all.filter((row) => row.session_id !== sessionId) : [];
    window.localStorage.setItem(DEMO_MEDIA_KEY, JSON.stringify([...others, ...rows]));
  } catch {
    /* ignore */
  }
}

export async function listSessionMedia(sessionId: string): Promise<SessionMediaFile[]> {
  if (isMockMode || !supabase) return readDemoMedia(sessionId);
  const { data, error } = await supabase
    .from('gh_session_media')
    .select('id, session_id, path, original_name, size, mime, uploaded_at, expires_at')
    .eq('session_id', sessionId)
    .order('uploaded_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as SessionMediaFile[];
}

function expiresIn14Days(): string {
  return new Date(Date.now() + SESSION_MEDIA_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

export function uploadSessionFile(params: {
  sessionId: string;
  gmId: string;
  file: File;
  onProgress: (pct: number) => void;
}): Promise<SessionMediaFile> {
  const { sessionId, file } = params;
  if (file.size > SESSION_MEDIA_MAX_BYTES) {
    return Promise.reject(
      new Error(
        `Fichier trop lourd (${formatBytes(file.size)}). Limite actuelle : ${SESSION_MEDIA_MAX_LABEL} par fichier (plan Pro Supabase).`
      )
    );
  }
  if (!isAllowedMedia(file)) {
    return Promise.reject(new Error('Seules les vidéos et photos sont acceptées.'));
  }

  if (isMockMode || !supabase) {
    return new Promise((resolve) => {
      let pct = 0;
      const tick = window.setInterval(() => {
        pct = Math.min(100, pct + 18);
        params.onProgress(pct);
        if (pct >= 100) {
          window.clearInterval(tick);
          const row: SessionMediaFile = {
            id: `demo-media-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            session_id: sessionId,
            path: objectPath(sessionId, file),
            original_name: file.name,
            size: file.size,
            mime: file.type,
            uploaded_at: new Date().toISOString(),
            expires_at: expiresIn14Days(),
          };
          writeDemoMedia(sessionId, [...readDemoMedia(sessionId), row]);
          resolve(row);
        }
      }, 120);
    });
  }

  const path = objectPath(sessionId, file);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  return new Promise((resolve, reject) => {
    void (async () => {
      try {
        const { data: auth } = await supabase!.auth.getSession();
        const token = auth.session?.access_token || anonKey;
        const upload = new tus.Upload(file, {
          endpoint: `${supabaseUrl}/storage/v1/upload/resumable`,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          headers: {
            authorization: `Bearer ${token}`,
            apikey: anonKey,
            'x-upsert': 'false',
          },
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          metadata: {
            bucketName: SESSION_MEDIA_BUCKET,
            objectName: path,
            contentType: file.type || 'application/octet-stream',
            cacheControl: '3600',
          },
          chunkSize: 6 * 1024 * 1024,
          fingerprint() {
            return Promise.resolve(
              ['gmassignee', sessionId, file.name, String(file.size), String(file.lastModified)].join('-')
            );
          },
          onError(error) {
            reject(error instanceof Error ? error : new Error(String(error)));
          },
          onProgress(bytesUploaded, bytesTotal) {
            params.onProgress(bytesTotal ? Math.round((bytesUploaded / bytesTotal) * 100) : 0);
          },
          async onSuccess() {
            const expiresAt = expiresIn14Days();
            const { data, error } = await supabase!
              .from('gh_session_media')
              .upsert(
                {
                  session_id: sessionId,
                  path,
                  original_name: file.name,
                  size: file.size,
                  mime: file.type || null,
                  uploaded_by: params.gmId,
                  expires_at: expiresAt,
                },
                { onConflict: 'session_id,path' }
              )
              .select('id, session_id, path, original_name, size, mime, uploaded_at, expires_at')
              .single();
            if (error) {
              reject(new Error(error.message));
              return;
            }
            resolve(data as SessionMediaFile);
          },
        });
        upload.start();
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Upload impossible'));
      }
    })();
  });
}

export interface SendVideosResult {
  ok: boolean;
  /** True only when the automatic e-mail (Resend) really went out. */
  emailed: boolean;
  downloadUrl: string;
  /** Set only when emailed; otherwise the app sets it when the GM copies/shares the link. */
  videosSentAt: string | null;
  message?: string;
}

function downloadPageUrl(token: string): string {
  return souvenirsPageUrl(token);
}

/**
 * Upload is done; create (or reuse) the client download link.
 * Sends the automatic e-mail only if Resend is configured server-side and an e-mail is given.
 */
export async function sendSessionVideos(params: {
  sessionId: string;
  clientEmail: string;
}): Promise<SendVideosResult> {
  const email = params.clientEmail.trim();
  if (isMockMode || !supabase) {
    return { ok: true, emailed: false, downloadUrl: downloadPageUrl(`demo-${params.sessionId}`), videosSentAt: null };
  }

  if (email) {
    await supabase.from('gh_vr_sessions').update({ client_email: email }).eq('id', params.sessionId);
  }

  const { data, error } = await supabase.functions.invoke(EDGE_FUNCTION_SEND_SESSION_VIDEOS, {
    body: { session_id: params.sessionId, client_email: email },
  });
  if (error) return fallbackLink(params.sessionId);
  const payload = (data || {}) as Partial<SendVideosResult> & { error?: string };
  if (payload.ok === false) {
    if (payload.error && /e-mail client invalide/i.test(payload.error)) throw new Error(payload.error);
    if (payload.error && /aucun fichier/i.test(payload.error)) throw new Error(payload.error);
    return fallbackLink(params.sessionId);
  }
  return {
    ok: true,
    emailed: Boolean(payload.emailed),
    downloadUrl: String(payload.downloadUrl || ''),
    videosSentAt: payload.videosSentAt ? String(payload.videosSentAt) : null,
    message: payload.message,
  };
}

/** Edge function unreachable: build the link from the session token (no e-mail, nothing marked as sent). */
async function fallbackLink(sessionId: string): Promise<SendVideosResult> {
  if (!supabase) return { ok: true, emailed: false, downloadUrl: '', videosSentAt: null };
  const { data: sessionRow } = await supabase
    .from('gh_vr_sessions')
    .select('videos_download_token')
    .eq('id', sessionId)
    .maybeSingle();
  const token = (sessionRow as { videos_download_token?: string } | null)?.videos_download_token;
  return { ok: true, emailed: false, downloadUrl: token ? downloadPageUrl(token) : '', videosSentAt: null };
}

/** Public souvenirs page URL; creates `videos_download_token` only if missing (column default usually covers this). */
export async function ensureSouvenirsLink(sessionId: string): Promise<string> {
  if (isMockMode || !supabase) return downloadPageUrl(`demo-${sessionId}`);
  const { data, error } = await supabase
    .from('gh_vr_sessions')
    .select('videos_download_token')
    .eq('id', sessionId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  let token = (data as { videos_download_token?: string } | null)?.videos_download_token;
  if (!token) {
    token = crypto.randomUUID();
    const { error: updErr } = await supabase
      .from('gh_vr_sessions')
      .update({ videos_download_token: token })
      .eq('id', sessionId);
    if (updErr) throw new Error(updErr.message);
  }
  return downloadPageUrl(token);
}

/**
 * Directly downloadable signed URLs (private `session-media` bucket).
 * TTL 48 h so Make can fetch each file into Dropbox.
 */
export async function createSessionMediaDownloadUrls(
  files: SessionMediaFile[],
  expiresIn = SOUVENIRS_FILE_URL_TTL_SECONDS
): Promise<SouvenirsMakeFile[]> {
  const live = files.filter((row) => new Date(row.expires_at).getTime() > Date.now());
  if (isMockMode || !supabase) {
    return live.map((row) => ({
      url: `https://example.invalid/demo/${encodeURIComponent(row.original_name || row.path)}`,
      name: row.original_name || row.path.split('/').pop() || 'fichier',
    }));
  }
  if (!live.length) return [];
  const { data, error } = await supabase.storage
    .from(SESSION_MEDIA_BUCKET)
    .createSignedUrls(
      live.map((row) => row.path),
      expiresIn
    );
  if (error) throw new Error(error.message);
  const byPath = new Map(
    (data || [])
      .filter((item) => item.path && item.signedUrl)
      .map((item) => [item.path as string, item.signedUrl as string])
  );
  const out: SouvenirsMakeFile[] = [];
  for (const row of live) {
    const url = byPath.get(row.path);
    if (!url) throw new Error(`URL signée indisponible pour ${row.original_name || row.path}`);
    out.push({
      url,
      name: row.original_name || row.path.split('/').pop() || 'fichier',
    });
  }
  return out;
}

export interface SendSouvenirsToMakeResult {
  souvenirLink: string;
  videosSentAt: string;
}

/**
 * One-click send: souvenirs link + file URLs → Make (e-mail client + Dropbox).
 * Does not call send-session-videos / Resend.
 */
export async function sendSouvenirsToMake(params: {
  sessionId: string;
  clientEmail: string;
  gmName: string;
  game: string;
  date: string;
  time: string;
}): Promise<SendSouvenirsToMakeResult> {
  const email = params.clientEmail.trim();
  if (!isClientEmail(email)) throw new Error('E-mail du client invalide.');

  const media = await listSessionMedia(params.sessionId);
  const live = media.filter((row) => new Date(row.expires_at).getTime() > Date.now());
  if (!live.length) throw new Error('Ajoute au moins une vidéo ou une photo.');

  const files = await createSessionMediaDownloadUrls(live);
  if (!files.length) throw new Error('Impossible de préparer les fichiers à envoyer.');

  if (!isMockMode && supabase) {
    await supabase.from('gh_vr_sessions').update({ client_email: email }).eq('id', params.sessionId);
  }

  const souvenirLink = await ensureSouvenirsLink(params.sessionId);
  const earliest = live.reduce(
    (min, row) => (!min || row.expires_at < min ? row.expires_at : min),
    live[0].expires_at
  );
  const payload = buildSouvenirsMakePayload({
    clientEmail: email,
    souvenirLink,
    sessionId: params.sessionId,
    game: params.game,
    date: params.date,
    time: params.time,
    gmName: params.gmName,
    expiresAtIso: earliest,
    files,
  });

  if (!isMockMode) await postMakeSouvenirsWebhook(payload);

  return { souvenirLink, videosSentAt: new Date().toISOString() };
}
