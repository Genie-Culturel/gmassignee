import { useEffect, useState } from 'react';
import { AlertTriangle, Download, FileIcon, Image as ImageIcon, Loader2, Star, Video } from 'lucide-react';
import { DEFAULT_SUPABASE_URL } from '@/lib/config';
import './souvenirs.css';

/**
 * Public client page: /souvenirs/?token=… (no PIN, no login).
 * Data comes from the session-media-download edge function (format=json).
 * Look & feel follows virtualrealitycenter.ch (blue #1a3fff, near-black #03090d, Mina + Roboto).
 */

type Brand = 'vr_center' | 'escape_life';
type FileKind = 'video' | 'photo' | 'file';

interface SouvenirFile {
  name: string;
  size: number | null;
  url: string;
  kind?: FileKind;
}

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; game: string | null; brand: Brand; expiresAt: string; files: SouvenirFile[] }
  | { kind: 'error'; title: string; message: string };

const ASSETS = `${import.meta.env.BASE_URL}brand/`;
const GOOGLE_REVIEW_URL = 'https://maps.app.goo.gl/kf48CnktMxuHGz2N6';

const SOCIALS: Record<Brand, { name: string; logo: string; logoClass: string; instagram: string; facebook: string }> = {
  vr_center: {
    name: 'Virtual Reality Center',
    logo: 'vrc-logo-white.png',
    logoClass: 'h-7',
    instagram: 'https://www.instagram.com/virtual_reality_center/',
    facebook: 'https://www.facebook.com/profile.php?id=61553978001452',
  },
  escape_life: {
    name: 'Escape Life',
    logo: 'escape-life-logo-white.png',
    logoClass: 'h-10',
    instagram: 'https://www.instagram.com/escapelife.ch/',
    facebook: 'https://www.facebook.com/escapelife.ch',
  },
};

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

function guessKind(file: SouvenirFile): FileKind {
  if (file.kind) return file.kind;
  const ext = file.name.toLowerCase().split('.').pop() || '';
  if (['mp4', 'mov', 'm4v', 'webm', 'avi', 'mkv', '3gp'].includes(ext)) return 'video';
  if (['jpg', 'jpeg', 'png', 'heic', 'heif', 'webp', 'gif'].includes(ext)) return 'photo';
  return 'file';
}

const KIND_LABEL: Record<FileKind, string> = { video: 'Vidéo', photo: 'Photo', file: 'Fichier' };

const ERROR_TITLES: Record<string, string> = {
  invalid: 'Lien invalide',
  not_found: 'Lien introuvable',
  expired: 'Souvenirs expirés',
};

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2.2c3.2 0 3.6 0 4.8.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s0 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.8.07s-3.58 0-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.2 15.58 2.2 15.2 2.2 12s0-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.15 0-3.5 0-4.74.07-.98.04-1.5.2-1.86.34-.47.18-.8.4-1.15.75-.35.35-.57.68-.75 1.15-.14.35-.3.88-.34 1.86C3.1 8.5 3.1 8.85 3.1 12s0 3.5.07 4.74c.04.98.2 1.5.34 1.86.18.47.4.8.75 1.15.35.35.68.57 1.15.75.35.14.88.3 1.86.34 1.24.06 1.6.07 4.74.07s3.5 0 4.74-.07c.98-.04 1.5-.2 1.86-.34.47-.18.8-.4 1.15-.75.35-.35.57-.68.75-1.15.14-.35.3-.88.34-1.86.06-1.24.07-1.6.07-4.74s0-3.5-.07-4.74c-.04-.98-.2-1.5-.34-1.86a3.1 3.1 0 0 0-.75-1.15 3.1 3.1 0 0 0-1.15-.75c-.35-.14-.88-.3-1.86-.34C15.5 4 15.15 4 12 4Zm0 3.07a4.93 4.93 0 1 1 0 9.86 4.93 4.93 0 0 1 0-9.86Zm0 8.13a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Zm6.28-8.33a1.15 1.15 0 1 1-2.3 0 1.15 1.15 0 0 1 2.3 0Z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.88v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z" />
    </svg>
  );
}

function SocialGroup({ brand }: { brand: Brand }) {
  const social = SOCIALS[brand];
  const linkClass =
    'flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:border-white/40 hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <img src={`${ASSETS}${social.logo}`} alt={social.name} className={`${social.logoClass} w-auto max-w-[60%] object-contain`} />
      <div className="flex shrink-0 gap-2">
        <a
          href={social.instagram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${social.name} sur Instagram`}
          className={linkClass}
        >
          <InstagramIcon className="h-5 w-5" />
        </a>
        <a
          href={social.facebook}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${social.name} sur Facebook`}
          className={linkClass}
        >
          <FacebookIcon className="h-5 w-5" />
        </a>
      </div>
    </div>
  );
}

export function SouvenirsPage() {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const brand: Brand = state.kind === 'ready' ? state.brand : 'vr_center';
  const brandTitle = brand === 'escape_life' ? 'Escape Life' : 'VR Center Valais';

  useEffect(() => {
    document.title = `Vos souvenirs ${brandTitle}`;
  }, [brandTitle]);

  useEffect(() => {
    const token = readToken();
    if (!token) {
      setState({
        kind: 'error',
        title: 'Lien incomplet',
        message: 'Ce lien ne contient pas de code de téléchargement. Utilisez le lien complet que nous vous avons transmis.',
      });
      return;
    }
    const base = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    fetch(`${base}/functions/v1/session-media-download?format=json&token=${encodeURIComponent(token)}`, {
      headers: { Accept: 'application/json' },
    })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as {
          ok?: boolean;
          error?: string;
          message?: string;
          game?: string | null;
          brand?: Brand;
          expires_at?: string;
          files?: SouvenirFile[];
        } | null;
        if (!body || !body.ok || !body.files?.length) {
          setState({
            kind: 'error',
            title: ERROR_TITLES[body?.error || ''] || 'Souvenirs indisponibles',
            message: body?.message || 'Impossible de charger vos souvenirs pour le moment. Réessayez plus tard.',
          });
          return;
        }
        setState({
          kind: 'ready',
          game: body.game || null,
          brand: body.brand === 'escape_life' ? 'escape_life' : 'vr_center',
          expiresAt: body.expires_at || '',
          files: body.files,
        });
      })
      .catch(() =>
        setState({
          kind: 'error',
          title: 'Connexion impossible',
          message: 'Vérifiez votre connexion Internet puis rechargez la page.',
        })
      );
  }, []);

  const socialOrder: Brand[] = brand === 'escape_life' ? ['escape_life', 'vr_center'] : ['vr_center', 'escape_life'];
  const files = state.kind === 'ready' ? state.files : [];
  const hasVideo = files.some((f) => guessKind(f) === 'video');
  const hasPhoto = files.some((f) => guessKind(f) === 'photo');
  const what = hasVideo && hasPhoto ? 'vos vidéos et photos' : hasPhoto ? 'vos photos' : 'vos vidéos';

  return (
    <div className="souvenirs-page relative min-h-[100dvh] overflow-x-hidden text-white">
      {/* Hero photo (virtualrealitycenter.ch page banner) fading into the brand near-black */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] sm:h-[560px]" aria-hidden="true">
        <img
          src={`${ASSETS}souvenirs-bg-800.webp`}
          srcSet={`${ASSETS}souvenirs-bg-800.webp 900w, ${ASSETS}souvenirs-bg.webp 1400w`}
          sizes="100vw"
          alt=""
          className="h-full w-full object-cover object-[68%_center]"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#03090d]/85 via-[#03090d]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#03090d]/30 via-transparent via-40% to-[#03090d]" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-[100dvh] max-w-xl flex-col px-5 pb-10 pt-[max(2rem,env(safe-area-inset-top))] sm:pt-14">
        <header className="flex items-center justify-between gap-4">
          <img
            src={`${ASSETS}${SOCIALS[brand].logo}`}
            alt={SOCIALS[brand].name}
            className={brand === 'escape_life' ? 'h-14 w-auto' : 'h-8 w-auto sm:h-9'}
          />
        </header>

        <section className="mt-10">
          <p className="font-brand text-xs font-bold uppercase tracking-[0.3em] text-[#7f93ff]">Merci pour votre visite</p>
          <h1 className="font-brand mt-3 drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] text-[2rem] font-bold leading-[1.1] sm:text-5xl">
            Vos souvenirs <span className="text-[#5b78ff]">{brandTitle}</span>
          </h1>

          {state.kind === 'loading' && (
            <div className="mt-8 flex items-center gap-3 text-white/80">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              Chargement de vos souvenirs…
            </div>
          )}

          {state.kind === 'ready' && (
            <>
              <p className="mt-4 text-lg leading-relaxed text-white/85">
                Merci d’avoir joué{state.game ? <> à <strong className="text-white">{state.game}</strong></> : ''} !
                Téléchargez {what} ci-dessous.
              </p>
              {state.expiresAt && (
                <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/85 backdrop-blur">
                  <span className="h-2 w-2 rounded-full bg-[#1a3fff]" aria-hidden />
                  Disponibles jusqu’au <strong className="text-white">{formatDate(state.expiresAt)}</strong>
                </p>
              )}
            </>
          )}
        </section>

        {state.kind === 'error' && (
          <div className="mt-8 rounded-2xl border border-amber-400/40 bg-[#03090d]/70 p-5 backdrop-blur">
            <div className="flex items-center gap-2 text-lg font-semibold text-amber-300">
              <AlertTriangle className="h-5 w-5" aria-hidden />
              {state.title}
            </div>
            <p className="mt-2 leading-relaxed text-white/85">{state.message}</p>
            <p className="mt-3 text-sm text-white/60">
              Les vidéos et photos sont conservées 14 jours, puis supprimées.
            </p>
          </div>
        )}

        {state.kind === 'ready' && (
          <>
            <ul className="mt-8 space-y-3">
              {state.files.map((file) => {
                const kind = guessKind(file);
                const Icon = kind === 'video' ? Video : kind === 'photo' ? ImageIcon : FileIcon;
                const size = formatSize(file.size);
                return (
                  <li key={file.url}>
                    <a
                      href={file.url}
                      download={file.name}
                      className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-3 pr-4 backdrop-blur-md transition hover:border-[#1a3fff]/70 hover:bg-white/[0.12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b78ff] active:scale-[0.99]"
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1a3fff] text-white shadow-lg shadow-[#1a3fff]/30">
                        <Icon className="h-6 w-6" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{file.name}</span>
                        <span className="block text-sm text-white/60">
                          {KIND_LABEL[kind]}
                          {size ? ` · ${size}` : ''}
                        </span>
                      </span>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#03090d] transition group-hover:bg-[#1a3fff] group-hover:text-white">
                        <Download className="h-5 w-5" aria-hidden />
                        <span className="sr-only">Télécharger</span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Sur iPhone : touchez un fichier, puis « Enregistrer la vidéo », « Enregistrer l’image » ou « Télécharger ».
              Chaque lien reste actif 1 heure : rechargez la page si besoin.
            </p>

            <section className="mt-10 rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a3fff]/30 to-white/[0.04] p-5 backdrop-blur-md">
              <div className="flex gap-0.5 text-[#fcb900]" aria-hidden>
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <p className="mt-3 leading-relaxed text-white/90">
                Si l’expérience vous a plu, n’hésitez pas à nous laisser un petit commentaire ou une bonne note. Cela
                nous aide énormément !
              </p>
              <a
                href={GOOGLE_REVIEW_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1a3fff] px-5 py-3 font-semibold text-white shadow-lg shadow-[#1a3fff]/40 transition hover:bg-[#3a5bff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <Star className="h-5 w-5 fill-[#fcb900] text-[#fcb900]" aria-hidden />
                Laisser un avis Google
              </a>
            </section>
          </>
        )}

        <section className="mt-8">
          <p className="leading-relaxed text-white/85">
            Et suivez-nous pour rester informés de nos prochaines nouveautés !
          </p>
          <div className="mt-4 space-y-3">
            {socialOrder.map((b) => (
              <SocialGroup key={b} brand={b} />
            ))}
          </div>
        </section>

        <footer className="mt-auto pt-12 text-center text-xs text-white/40">
          Virtual Reality Center · Escape Life · Valais
        </footer>
      </main>
    </div>
  );
}
