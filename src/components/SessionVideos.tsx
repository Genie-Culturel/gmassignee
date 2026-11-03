import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  FILMING_NOTICE,
  SESSION_MEDIA_MAX_LABEL,
  formatBytes,
  isAllowedMedia,
  listSessionMedia,
  sendSessionVideos,
  uploadSessionFile,
  LocalUpload,
  SessionMediaFile,
  SESSION_MEDIA_MAX_BYTES,
} from '@/lib/sessionMedia';
import { formatDate, formatTime } from '@/lib/utils';
import { Copy, Share2, Upload } from 'lucide-react';

interface SessionVideosProps {
  sessionId: string;
  gmId: string;
  clientEmail: string;
  videosSentAt: string | null;
  onClientEmailChange: (email: string) => void;
  /** Link actually handed over (auto e-mail, copied or shared) → videos_sent_at + step « Prise et envoi vidéos ». */
  onSent: (sentAt: string) => void;
}

const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

export function SessionVideos({
  sessionId,
  gmId,
  clientEmail,
  videosSentAt,
  onClientEmailChange,
  onSent,
}: SessionVideosProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<LocalUpload[]>([]);
  const [remote, setRemote] = useState<SessionMediaFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    emailed: boolean;
    downloadUrl: string;
    message?: string;
  } | null>(null);
  const [handedOver, setHandedOver] = useState<'copied' | 'shared' | null>(null);

  useEffect(() => {
    listSessionMedia(sessionId)
      .then(setRemote)
      .catch(() => setRemote([]));
    setUploads([]);
    setResult(null);
    setHandedOver(null);
    setError(null);
  }, [sessionId]);

  const patchUpload = (localId: string, next: Partial<LocalUpload>) => {
    setUploads((rows) => rows.map((row) => (row.localId === localId ? { ...row, ...next } : row)));
  };

  const runUpload = async (localId: string, file: File) => {
    patchUpload(localId, { status: 'uploading', progress: 0, error: undefined });
    try {
      const remoteRow = await uploadSessionFile({
        sessionId,
        gmId,
        file,
        onProgress: (pct) => patchUpload(localId, { progress: pct, status: 'uploading' }),
      });
      patchUpload(localId, { status: 'done', progress: 100, remote: remoteRow, error: undefined });
      setRemote((rows) => (rows.some((r) => r.path === remoteRow.path) ? rows : [...rows, remoteRow]));
    } catch (err) {
      patchUpload(localId, {
        status: 'error',
        error: err instanceof Error ? err.message : 'Échec de l’upload — réessaie.',
      });
    }
  };

  const onPick = async (list: FileList | null) => {
    if (!list?.length) return;
    setError(null);
    const incoming = Array.from(list);
    for (const file of incoming) {
      const localId = `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 6)}`;
      if (!isAllowedMedia(file)) {
        setUploads((rows) => [
          ...rows,
          { localId, file, status: 'error', progress: 0, error: 'Format non accepté (vidéo ou photo).' },
        ]);
        continue;
      }
      if (file.size > SESSION_MEDIA_MAX_BYTES) {
        setUploads((rows) => [
          ...rows,
          {
            localId,
            file,
            status: 'too_large',
            progress: 0,
            error: `Trop lourd (${formatBytes(file.size)}). Limite actuelle : ${SESSION_MEDIA_MAX_LABEL} / fichier (plan gratuit).`,
          },
        ]);
        continue;
      }
      setUploads((rows) => [...rows, { localId, file, status: 'uploading', progress: 0 }]);
      await runUpload(localId, file);
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  const send = async () => {
    const email = clientEmail.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('E-mail du client invalide (ou laisse le champ vide).');
      return;
    }
    if (!remote.length) {
      setError('Ajoute au moins une vidéo ou une photo.');
      return;
    }
    if (uploads.some((u) => u.status === 'uploading')) {
      setError('Attends la fin des uploads.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await sendSessionVideos({ sessionId, clientEmail: email });
      setResult({ emailed: res.emailed, downloadUrl: res.downloadUrl, message: res.message });
      setHandedOver(null);
      if (res.emailed && res.videosSentAt) onSent(res.videosSentAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Création du lien impossible');
    } finally {
      setBusy(false);
    }
  };

  const markHandedOver = (how: 'copied' | 'shared') => {
    setHandedOver(how);
    onSent(new Date().toISOString());
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      markHandedOver('copied');
    } catch {
      setError('Copie impossible : appuie longuement sur le lien pour le copier.');
    }
  };

  const shareLink = async (url: string) => {
    if (!canShare) {
      await copyLink(url);
      return;
    }
    try {
      await navigator.share({
        title: 'Tes souvenirs VR Center Valais',
        text: `Voici tes vidéos souvenirs du VR Center Valais${expiryLabel ? ` (disponibles jusqu’au ${expiryLabel})` : ''} :`,
        url,
      });
      markHandedOver('shared');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      await copyLink(url);
    }
  };

  const earliestExpiry = remote.reduce<string | null>(
    (min, row) => (!min || row.expires_at < min ? row.expires_at : min),
    null
  );
  const expiryLabel = earliestExpiry ? formatDate(earliestExpiry) : null;

  const doneUploads = uploads.filter((u) => u.status === 'done').length;
  const failed = uploads.filter((u) => u.status === 'error' || u.status === 'too_large');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vidéos souvenirs</CardTitle>
        <CardDescription>
          Filme avec ton téléphone, téléverse les vidéos ici, puis transmets le lien au client. Limite
          actuelle : {SESSION_MEDIA_MAX_LABEL} par fichier (plan gratuit). Photos acceptées pour les tests.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{FILMING_NOTICE}</p>

        <div className="space-y-2">
          <Label htmlFor="client-email">E-mail du client (optionnel)</Label>
          <Input
            id="client-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="client@email.ch"
            value={clientEmail}
            onChange={(e) => onClientEmailChange(e.target.value)}
          />
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="video/*,image/*"
          multiple
          className="sr-only"
          onChange={(e) => void onPick(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          className="w-full min-h-11"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          Choisir des vidéos ou photos
        </Button>

        {uploads.length > 0 && (
          <ul className="space-y-3">
            {uploads.map((row) => (
              <li key={row.localId} className="space-y-1 rounded-md border p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-medium">{row.file.name}</p>
                  <Badge
                    variant={
                      row.status === 'done'
                        ? 'success'
                        : row.status === 'too_large' || row.status === 'error'
                          ? 'destructive'
                          : 'secondary'
                    }
                    className="shrink-0 text-[10px]"
                  >
                    {row.status === 'done'
                      ? 'OK'
                      : row.status === 'uploading'
                        ? `${row.progress}%`
                        : row.status === 'too_large'
                          ? 'Trop lourd'
                          : 'Erreur'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{formatBytes(row.file.size)}</p>
                {row.status === 'uploading' && <Progress value={row.progress} />}
                {row.error && <p className="text-xs text-destructive">{row.error}</p>}
                {row.status === 'error' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-1 min-h-11"
                    onClick={() => void runUpload(row.localId, row.file)}
                  >
                    Réessayer
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}

        {remote.length > 0 && uploads.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {remote.length} fichier{remote.length > 1 ? 's' : ''} déjà déposé
            {remote.length > 1 ? 's' : ''} pour cette session.
          </p>
        )}

        <Button className="w-full min-h-11" size="lg" disabled={busy} onClick={() => void send()}>
          {busy ? 'Création du lien…' : 'Créer le lien client'}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {videosSentAt && !result && (
          <Alert>
            <AlertDescription>
              Lien déjà transmis au client à {formatTime(videosSentAt)}. Tu peux recréer le lien si besoin.
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert className="border-emerald-200 bg-emerald-50">
            <AlertDescription className="space-y-3 text-emerald-950">
              <p className="font-semibold">Vidéos téléversées, lien client prêt.</p>
              <p className="text-sm">Tu peux supprimer les vidéos de ton téléphone.</p>
              {result.emailed ? (
                <p className="text-sm">Le lien a été envoyé automatiquement par e-mail à {clientEmail}.</p>
              ) : (
                <div className="space-y-1 text-sm">
                  {result.message && <p className="font-medium">{result.message}</p>}
                  <p className="font-medium">À faire :</p>
                  <ol className="list-decimal space-y-1 pl-5">
                    <li>Copie le lien{canShare ? ' (ou appuie sur « Partager le lien »)' : ''}.</li>
                    <li>
                      Transmets-le au client par SMS, WhatsApp ou e-mail (depuis l’adresse du centre, pas ta
                      propre adresse).
                    </li>
                    <li>L’étape « Prise et envoi vidéos » se coche automatiquement quand tu copies ou partages le lien.</li>
                  </ol>
                  {expiryLabel && <p className="text-xs">Lien valable jusqu’au {expiryLabel}, ensuite les vidéos sont supprimées.</p>}
                </div>
              )}
              {result.downloadUrl ? (
                <div className="space-y-2">
                  <p className="break-all rounded border border-emerald-200 bg-white px-2 py-1.5 text-xs select-all">
                    {result.downloadUrl}
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-h-11"
                      onClick={() => void copyLink(result.downloadUrl)}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      {handedOver === 'copied' ? 'Lien copié ✓' : 'Copier le lien'}
                    </Button>
                    {canShare && (
                      <Button
                        type="button"
                        size="sm"
                        className="min-h-11"
                        onClick={() => void shareLink(result.downloadUrl)}
                      >
                        <Share2 className="mr-2 h-4 w-4" />
                        {handedOver === 'shared' ? 'Lien partagé ✓' : 'Partager le lien'}
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-destructive">Lien indisponible pour le moment : réessaie « Créer le lien client ».</p>
              )}
            </AlertDescription>
          </Alert>
        )}

        {(doneUploads > 0 || failed.length > 0) && !result && (
          <p className="text-xs text-muted-foreground">
            {doneUploads} fichier{doneUploads > 1 ? 's' : ''} prêt
            {doneUploads > 1 ? 's' : ''}
            {failed.length ? ` · ${failed.length} en erreur` : ''}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
