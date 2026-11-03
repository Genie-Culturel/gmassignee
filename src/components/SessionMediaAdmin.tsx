import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ManualSessionBadge, SessionFlagBadge } from '@/components/SessionFlagBadge';
import { SessionConsultSheet } from '@/components/SessionConsultSheet';
import { RecordedSessionRow, listRecordedSessions, setSessionFlagReviewed } from '@/lib/sessionView';
import { formatDate, formatTime } from '@/lib/utils';

/** Admin « Sessions enregistrées » (Dashboard): click a session to consult it read-only. */
export function SessionMediaAdmin() {
  const [rows, setRows] = useState<RecordedSessionRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    listRecordedSessions()
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : 'Suivi indisponible'));
  }, []);

  const pendingCount = rows.filter((row) => row.flag && !row.flagReviewedAt).length;
  const visible = useMemo(
    () => (onlyFlagged ? rows.filter((row) => row.flag && !row.flagReviewedAt) : rows),
    [rows, onlyFlagged]
  );
  const openRow = rows.find((row) => row.sessionId === openId) || null;

  const toggleReviewed = useCallback(async (row: RecordedSessionRow, reviewed: boolean) => {
    setBusyId(row.sessionId);
    setReviewError(null);
    try {
      const at = await setSessionFlagReviewed(row.sessionId, reviewed);
      setRows((current) =>
        current.map((item) => (item.sessionId === row.sessionId ? { ...item, flagReviewedAt: at } : item))
      );
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Mise à jour impossible');
    } finally {
      setBusyId(null);
    }
  }, []);

  const rowKeyDown = (event: React.KeyboardEvent, id: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpenId(id);
    }
  };

  const reviewBox = (row: RecordedSessionRow) =>
    row.flag ? (
      <label
        className="inline-flex min-h-[36px] cursor-pointer items-center gap-2 text-xs text-muted-foreground"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <Checkbox
          checked={!!row.flagReviewedAt}
          disabled={busyId === row.sessionId}
          onCheckedChange={(checked) => toggleReviewed(row, checked === true)}
          aria-label={`Marquer ${row.game} comme relevé`}
        />
        Relevé
      </label>
    ) : null;

  const videos = (row: RecordedSessionRow) =>
    row.videosSentAt ? (
      <span className="font-medium text-emerald-700">Oui · {formatTime(row.videosSentAt)}</span>
    ) : (
      <span className="text-muted-foreground">Non</span>
    );

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2 text-lg">
              Sessions enregistrées
              {pendingCount > 0 && (
                <Badge
                  className="border-red-200 bg-red-100 text-red-700 hover:bg-red-100"
                  title={`${pendingCount} session(s) à relever`}
                >
                  {pendingCount} à relever
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Cliquez sur une session pour la consulter (lecture seule).</CardDescription>
          </div>
          <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 text-sm">
            <Checkbox checked={onlyFlagged} onCheckedChange={(checked) => setOnlyFlagged(checked === true)} />
            À relever uniquement
          </label>
        </div>
        {reviewError && (
          <Alert variant="destructive">
            <AlertDescription>{reviewError}</AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent className="space-y-3 p-3 sm:p-6 sm:pt-0">
        <div className="space-y-3 sm:hidden">
          {visible.map((row) => (
            <div key={row.sessionId} className="rounded-lg border text-sm">
              <button
                type="button"
                className="flex w-full items-start gap-2 p-3 text-left active:bg-muted/60"
                onClick={() => setOpenId(row.sessionId)}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{row.game}</p>
                    {row.isManual && <ManualSessionBadge />}
                    <SessionFlagBadge flag={row.flag} reviewed={!!row.flagReviewedAt} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {row.date ? formatDate(row.date + 'T12:00:00') : '—'} · {row.time} · {row.gmName || '—'}
                  </p>
                  {row.flag?.excerpt && !row.flagReviewedAt && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">{row.flag.excerpt}</p>
                  )}
                  <p className="text-xs">Vidéos : {videos(row)}</p>
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              </button>
              {row.flag && <div className="border-t px-3 py-1">{reviewBox(row)}</div>}
            </div>
          ))}
        </div>
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-3 py-2 font-medium">Session</th>
                <th className="px-3 py-2 font-medium">GM</th>
                <th className="px-3 py-2 font-medium">Client</th>
                <th className="px-3 py-2 font-medium">Vidéos envoyées</th>
                <th className="px-3 py-2 font-medium">À relever</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr
                  key={row.sessionId}
                  role="button"
                  tabIndex={0}
                  aria-label={`Consulter la session ${row.game} du ${row.date} ${row.time}`}
                  className="cursor-pointer border-b align-top outline-none hover:bg-muted/50 focus-visible:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => setOpenId(row.sessionId)}
                  onKeyDown={(event) => rowKeyDown(event, row.sessionId)}
                >
                  <td className="px-3 py-2">
                    <p className="flex flex-wrap items-center gap-2 font-medium">
                      {row.game}
                      {row.isManual && <ManualSessionBadge />}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {row.date} {row.time}
                      {row.groupName ? ` · ${row.groupName}` : ''}
                    </p>
                  </td>
                  <td className="px-3 py-2">{row.gmName || '—'}</td>
                  <td className="px-3 py-2 text-xs">{row.clientEmail || '—'}</td>
                  <td className="px-3 py-2">{videos(row)}</td>
                  <td className="px-3 py-2">
                    {row.flag ? (
                      <div className="flex flex-col items-start gap-1">
                        <SessionFlagBadge flag={row.flag} reviewed={!!row.flagReviewedAt} />
                        {reviewBox(row)}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {visible.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {onlyFlagged ? 'Rien à relever.' : 'Aucune session pour l’instant.'}
          </p>
        )}
      </CardContent>
      <SessionConsultSheet
        row={openRow}
        onClose={() => setOpenId(null)}
        onReviewedChange={toggleReviewed}
        reviewBusy={!!openRow && busyId === openRow.sessionId}
      />
    </Card>
  );
}
