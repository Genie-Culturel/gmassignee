import { useEffect, useState } from 'react';
import { Download, Film, Loader2, AlertTriangle } from 'lucide-react';
import { DEFAULT_SUPABASE_URL } from '@/lib/config';

/**
 * Public client page: /souvenirs/?token=… (no PIN, no login).
 * Data comes from the session-media-download edge function (format=json).
 */

interface SouvenirFile {
  name: string;
  size: number | null;
  url: string;
}

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; game: string | null; expiresAt: string; files: SouvenirFile[] }
  | { kind: 'error'; title: string; message: string };

function readToken(): string {
  const params = new URLSearchParams(window.location.search);
  let token = params.get('token') || '';
  if (!token) {
    const hash = window.location.hash;
    const q = hash.indexOf('?');
    if (q >= 0) token = new URLSearchParams(hash.slice(q)).get('token') || '';
  }
  return token.trim();
}

function formatSize(bytes: number | null): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 ** 3).toFixed(1).replace('.', ',')} Go`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 ** 2).toFixed(1).replace('.', ',')} Mo`;
  return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fr-CH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Zurich',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

const ERROR_TITLES: Record<string, string> = {
  invalid: 'Lien invalide',
  not_found: 'Lien introuvable',
  expired: 'Souvenirs expirés',
};

export function SouvenirsPage() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    const token = readToken();
    if (!token) {
      setState({ kind: 'error', title: 'Lien incomplet', message: 'Ce lien ne contient pas de code de téléchargement. Utilise le lien reçu par e-mail.' });
      return;
    }
    const base = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    fetch(`${base}/functions/v1/session-media-download?format=json&token=${encodeURIComponent(token)}`, {
      headers: { Accept: 'application/json' },
    })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as
          | { ok?: boolean; error?: string; message?: string; game?: string | null; expires_at?: string; files?: SouvenirFile[] }
          | null;
        if (!body || !body.ok || !body.files?.length) {
          setState({
            kind: 'error',
            title: ERROR_TITLES[body?.error || ''] || 'Souvenirs indisponibles',
            message: body?.message || 'Impossible de charger tes souvenirs pour le moment. Réessaie plus tard.',
          });
          return;
        }
        setState({ kind: 'ready', game: body.game || null, expiresAt: body.expires_at || '', files: body.files });
      })
      .catch(() =>
        setState({
          kind: 'error',
          title: 'Connexion impossible',
          message: 'Vérifie ta connexion Internet puis recharge la page.',
        })
      );
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto flex min-h-screen max-w-xl flex-col px-5 py-10 sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-sky-400">VR Center Valais</p>
        <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">Tes souvenirs VR Center Valais</h1>

        {state.kind === 'loading' && (
          <div className="mt-10 flex items-center gap-3 text-slate-300">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            Chargement de tes vidéos…
          </div>
        )}

        {state.kind === 'error' && (
          <div className="mt-8 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-5">
            <div className="flex items-center gap-2 text-lg font-semibold text-amber-300">
              <AlertTriangle className="h-5 w-5" aria-hidden />
              {state.title}
            </div>
            <p className="mt-2 leading-relaxed text-slate-200">{state.message}</p>
            <p className="mt-3 text-sm text-slate-400">
              Les vidéos sont conservées 14 jours après la partie, puis supprimées.
            </p>
          </div>
        )}

        {state.kind === 'ready' && (
          <>
            <p className="mt-4 leading-relaxed text-slate-300">
              Merci d’avoir joué{state.game ? ` à ${state.game}` : ''} ! Télécharge tes vidéos ci-dessous.
            </p>
            {state.expiresAt && (
              <p className="mt-2 text-sm text-slate-400">
                Disponibles jusqu’au <span className="font-semibold text-slate-200">{formatDate(state.expiresAt)}</span>,
                ensuite elles sont supprimées.
              </p>
            )}
            <ul className="mt-8 space-y-3">
              {state.files.map((file) => (
                <li key={file.url}>
                  <a
                    href={file.url}
                    download={file.name}
                    className="flex items-center gap-3 rounded-2xl bg-sky-400 px-4 py-4 font-semibold text-slate-950 shadow-lg shadow-sky-500/20 transition hover:bg-sky-300 active:scale-[0.99]"
                  >
                    <Film className="h-6 w-6 shrink-0" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{file.name}</span>
                      {formatSize(file.size) && (
                        <span className="block text-sm font-normal text-slate-800">{formatSize(file.size)}</span>
                      )}
                    </span>
                    <Download className="h-5 w-5 shrink-0" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-slate-400">
              Sur iPhone : appuie sur le bouton, puis « Enregistrer la vidéo » ou « Télécharger ». Le lien de chaque
              bouton reste actif 1 heure : recharge la page si besoin.
            </p>
          </>
        )}

        <footer className="mt-auto pt-12 text-xs text-slate-500">
          VR Center Valais · Génie Culturel · Partage tes vidéos en nous taguant !
        </footer>
      </main>
    </div>
  );
}
