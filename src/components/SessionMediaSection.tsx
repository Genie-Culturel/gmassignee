import { useEffect, useState } from 'react';
import { ExternalLink, FileIcon, Image as ImageIcon, Loader2, Video } from 'lucide-react';
import { formatBytes } from '@/lib/sessionMedia';
import { AdminSessionMedia, loadSessionMediaForAdmin } from '@/lib/sessionView';
import { formatDate } from '@/lib/utils';

const THUMB_MAX_BYTES = 3 * 1024 * 1024;

/** Admin consultation: the session's videos/photos with 1 h view links + client souvenirs page. */
export function SessionMediaSection({ sessionId, videosSentAt }: { sessionId: string; videosSentAt: string | null }) {
  const [media, setMedia] = useState<AdminSessionMedia | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setMedia(null);
    setError(null);
    loadSessionMediaForAdmin(sessionId)
      .then((res) => !cancelled && setMedia(res))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Fichiers indisponibles'));
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!media) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Chargement des fichiers…
      </p>
    );
  }
  if (!media.items.length) {
    return (
      <p className="text-sm text-muted-foreground">
        {videosSentAt
          ? 'Fichiers supprimés (conservés 14 jours après le téléversement).'
          : 'Aucune vidéo ni photo pour cette session.'}
      </p>
    );
  }

  const live = media.items.filter((item) => !item.expired);
  const expired = media.items.filter((item) => item.expired);
  const lastExpired = expired.map((item) => item.expiresAt).sort().pop();

  return (
    <div className="space-y-2">
      {live.length > 0 && (
        <ul className="divide-y rounded-md border text-sm">
          {live.map((item) => {
            const Icon = item.kind === 'video' ? Video : item.kind === 'photo' ? ImageIcon : FileIcon;
            const thumb = item.kind === 'photo' && item.url && item.size <= THUMB_MAX_BYTES;
            return (
              <li key={item.id} className="flex items-center gap-3 px-3 py-2">
                {thumb ? (
                  <img
                    src={item.url!}
                    alt=""
                    loading="lazy"
                    className="h-10 w-10 shrink-0 rounded object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted">
                    <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{item.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {item.kind === 'video' ? 'Vidéo' : item.kind === 'photo' ? 'Photo' : 'Fichier'} ·{' '}
                    {formatBytes(item.size)}
                  </span>
                </span>
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[40px] shrink-0 items-center gap-1 rounded-md border px-2.5 text-xs font-medium hover:bg-muted"
                    aria-label={`Voir ${item.name}`}
                  >
                    Voir <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                ) : (
                  <span className="shrink-0 text-xs text-muted-foreground">Aperçu indisponible</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {expired.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {expired.length} fichier{expired.length > 1 ? 's' : ''} supprimé{expired.length > 1 ? 's' : ''}
          {lastExpired ? ` (expiré${expired.length > 1 ? 's' : ''} le ${formatDate(lastExpired)})` : ''}.
        </p>
      )}
      {media.souvenirsUrl && live.length > 0 && (
        <a
          href={media.souvenirsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          Page souvenirs du client <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      )}
      {media.expiresAt && live.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Disponibles jusqu’au {formatDate(media.expiresAt)}. Liens « Voir » valables 1 heure.
        </p>
      )}
    </div>
  );
}
