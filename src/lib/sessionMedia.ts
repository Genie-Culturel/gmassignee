import * as tus from 'tus-js-client';
import { isMockMode, supabase } from './supabase';
import { DEFAULT_SUPABASE_ANON_KEY, DEFAULT_SUPABASE_URL, souvenirsPageUrl } from './config';

export const SESSION_MEDIA_BUCKET = 'session-media';
export const SESSION_MEDIA_MAX_BYTES = 50 * 1024 * 1024;
export const SESSION_MEDIA_MAX_LABEL = '50 Mo';
export const SESSION_MEDIA_TTL_DAYS = 14;

export const FILMING_NOTICE =
  'La partie sera filmée (2 courtes vidéos) et les vidéos vous seront envoyées par e-mail, puis supprimées après 14 jours.';

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
    .from('session_media')
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
        `Fichier trop lourd (${formatBytes(file.size)}). Limite actuelle : ${SESSION_MEDIA_MAX_LABEL} par fichier (plan gratuit Supabase). Passe le projet en Pro pour les gros fichiers.`
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
              .from('session_media')
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
  emailed: boolean;
  downloadUrl: string;
  videosSentAt: string;
  message?: string;
}

function downloadPageUrl(token: string): string {
  return souvenirsPageUrl(token);
}

export function mailtoVideosDraft(clientEmail: string, downloadUrl: string): string {
  const subject = encodeURIComponent('Tes souvenirs VR Center Valais');
  const body = encodeURIComponent(
    `Salut !\n\nMerci d'avoir joué au VR Center Valais — voici tes vidéos souvenirs (lien valable 14 jours) :\n${downloadUrl}\n\nÀ très vite,\nL'équipe VR Center Valais`
  );
  return `mailto:${encodeURIComponent(clientEmail)}?subject=${subject}&body=${body}`;
}

export async function sendSessionVideos(params: {
  sessionId: string;
  clientEmail: string;
}): Promise<SendVideosResult> {
  const sentAt = new Date().toISOString();
  if (isMockMode || !supabase) {
    const token = `demo-${params.sessionId}`;
    const downloadUrl = downloadPageUrl(token);
    return {
      ok: true,
      emailed: false,
      downloadUrl,
      videosSentAt: sentAt,
      message:
        'Mode démo : e-mail non envoyé. Copie le lien ou utilise « Ouvrir un e-mail prérempli ».',
    };
  }

  await supabase
    .from('vr_sessions')
    .update({ client_email: params.clientEmail })
    .eq('id', params.sessionId);

  const { data, error } = await supabase.functions.invoke('send-session-videos', {
    body: { session_id: params.sessionId, client_email: params.clientEmail },
  });
  if (error) {
    const fallback = await fallbackSignedSend(params.sessionId, params.clientEmail, sentAt);
    fallback.message = `Envoi e-mail indisponible (${error.message}). Lien à copier ci-dessous.`;
    return fallback;
  }
  const payload = (data || {}) as Partial<SendVideosResult> & { error?: string };
  if (payload.ok === false && payload.error) {
    const fallback = await fallbackSignedSend(params.sessionId, params.clientEmail, sentAt);
    fallback.message = payload.error;
    return fallback;
  }
  return {
    ok: true,
    emailed: Boolean(payload.emailed),
    downloadUrl: String(payload.downloadUrl || ''),
    videosSentAt: String(payload.videosSentAt || sentAt),
    message: payload.message,
  };
}

async function fallbackSignedSend(
  sessionId: string,
  _clientEmail: string,
  sentAt: string
): Promise<SendVideosResult> {
  if (!supabase) {
    return { ok: true, emailed: false, downloadUrl: '', videosSentAt: sentAt };
  }
  const { data: sessionRow } = await supabase
    .from('vr_sessions')
    .select('videos_download_token')
    .eq('id', sessionId)
    .maybeSingle();
  const token = (sessionRow as { videos_download_token?: string } | null)?.videos_download_token;
  await supabase.from('vr_sessions').update({ videos_sent_at: sentAt }).eq('id', sessionId);
  return {
    ok: true,
    emailed: false,
    downloadUrl: token ? downloadPageUrl(token) : '',
    videosSentAt: sentAt,
  };
}
