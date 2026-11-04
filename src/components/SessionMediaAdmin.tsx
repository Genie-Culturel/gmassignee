import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronRight, Clapperboard, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ManualSessionBadge, SessionFlagBadges } from '@/components/SessionFlagBadge';
import { SessionConsultSheet } from '@/components/SessionConsultSheet';
import {
  RecordedSessionRow,
  deleteSessionAsAdmin,
  listRecordedSessions,
  setSessionFlagReviewed,
} from '@/lib/sessionView';
import { formatDate, formatTime } from '@/lib/utils';

function flagText(row: RecordedSessionRow): string {
  return row.flags
    .filter((flag) => flag.kind !== 'cash')
    .map((flag) => flag.excerpt)
    .filter(Boolean)
    .join(' · ');
}

function MediaCount({ count }: { count: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs text-muted-foreground"
      title={`${count} vidéo(s) / photo(s)`}
      aria-label={`${count} vidéo(s) ou photo(s)`}
    >
      <Clapperboard className="h-3.5 w-3.5" aria-hidden />
      {count}
    </span>
  );
}

/** Admin « Sessions enregistrées » (Dashboard): click a session to consult it read-only. */
export function SessionMediaAdmin() {
  const [rows, setRows] = useState<RecordedSessionRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { isAdmin } = useAuth();
  const [toDelete, setToDelete] = useState<RecordedSessionRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  
  const SESSIONS_PER_PAGE = 20;

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteSessionAsAdmin(toDelete.sessionId);
      const label = `${toDelete.game} du ${toDelete.date ? formatDate(toDelete.date + 'T12:00:00') : '—'}`;
      setRows((current) => current.filter((item) => item.sessionId !== toDelete.sessionId));
      if (openId === toDelete.sessionId) setOpenId(null);
      setToDelete(null);
      setToast(`Session ${label} supprimée.`);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Suppression impossible');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    listRecordedSessions()
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : 'Suivi indisponible'));
  }, []);

  const pendingCount = rows.filter((row) => row.flags.length > 0 && !row.flagReviewedAt).length;
  const filtered = useMemo(
    () => (onlyFlagged ? rows.filter((row) => row.flags.length > 0 && !row.flagReviewedAt) : rows),
    [rows, onlyFlagged]
  );
  
  const totalPages = Math.max(1, Math.ceil(filtered.length / SESSIONS_PER_PAGE));
  const startIdx = (currentPage - 1) * SESSIONS_PER_PAGE;
  const visible = filtered.slice(startIdx, startIdx + SESSIONS_PER_PAGE);
  
  const openRow = rows.find((row) => row.sessionId === openId) || null;
  
  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [onlyFlagged]);
  
  const allPageIdsSelected = visible.length > 0 && visible.every((row) => selectedIds.has(row.sessionId));
  const somePageIdsSelected = visible.some((row) => selectedIds.has(row.sessionId));
  
  const toggleSelectAll = () => {
    if (allPageIdsSelected) {
      // Deselect all on current page
      setSelectedIds((prev) => {
        const next = new Set(prev);
        visible.forEach((row) => next.delete(row.sessionId));
        return next;
      });
    } else {
      // Select all on current page
      setSelectedIds((prev) => {
        const next = new Set(prev);
        visible.forEach((row) => next.add(row.sessionId));
        return next;
      });
    }
  };
  
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  
  const confirmBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    setDeleteError(null);
    const toDeleteList = rows.filter((row) => selectedIds.has(row.sessionId));
    let successCount = 0;
    let errorCount = 0;
    
    for (const row of toDeleteList) {
      try {
        await deleteSessionAsAdmin(row.sessionId);
        successCount++;
      } catch {
        errorCount++;
      }
    }
    
    setRows((current) => current.filter((item) => !selectedIds.has(item.sessionId)));
    setSelectedIds(new Set());
    setShowBulkConfirm(false);
    setBulkDeleting(false);
    
    if (errorCount === 0) {
      setToast(`${successCount} session(s) supprimée(s).`);
    } else {
      setToast(`${successCount} session(s) supprimée(s), ${errorCount} erreur(s).`);
    }
  };

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
    row.flags.length ? (
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
        
        {isAdmin && selectedIds.size > 0 && (
          <div className="flex items-center gap-3 rounded-md border bg-muted/40 px-3 py-2">
            <span className="text-sm font-medium">{selectedIds.size} session(s) sélectionnée(s)</span>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setShowBulkConfirm(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" aria-hidden />
              Supprimer la sélection
            </Button>
          </div>
        )}
        
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
                    <SessionFlagBadges flags={row.flags} reviewed={!!row.flagReviewedAt} />
                    {!!row.mediaCount && <MediaCount count={row.mediaCount} />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {row.date ? formatDate(row.date + 'T12:00:00') : '—'} · {row.time} · {row.gmName || '—'}
                  </p>
                  {!row.flagReviewedAt && flagText(row) && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">{flagText(row)}</p>
                  )}
                  <p className="text-xs">Vidéos : {videos(row)}</p>
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              </button>
              {row.flags.length > 0 && <div className="border-t px-3 py-1">{reviewBox(row)}</div>}
            </div>
          ))}
        </div>
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                {isAdmin && (
                  <th className="w-10 px-3 py-2">
                    <Checkbox
                      checked={allPageIdsSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Tout sélectionner sur cette page"
                      className={somePageIdsSelected && !allPageIdsSelected ? 'opacity-50' : ''}
                    />
                  </th>
                )}
                <th className="px-3 py-2 font-medium">Session</th>
                <th className="px-3 py-2 font-medium">GM</th>
                <th className="px-3 py-2 font-medium">Client</th>
                <th className="px-3 py-2 font-medium">Vidéos envoyées</th>
                <th className="px-3 py-2 font-medium">À relever</th>
                {isAdmin && (
                  <th className="w-10 px-1 py-2">
                    <span className="sr-only">Supprimer</span>
                  </th>
                )}
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
                  {isAdmin && (
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(row.sessionId)}
                        onCheckedChange={() => toggleSelect(row.sessionId)}
                        aria-label={`Sélectionner ${row.game}`}
                      />
                    </td>
                  )}
                  <td className="px-3 py-2">
                    <p className="flex flex-wrap items-center gap-2 font-medium">
                      {row.game}
                      {row.isManual && <ManualSessionBadge />}
                      {!!row.mediaCount && <MediaCount count={row.mediaCount} />}
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
                    {row.flags.length ? (
                      <div className="flex flex-col items-start gap-1">
                        <SessionFlagBadges flags={row.flags} reviewed={!!row.flagReviewedAt} className="flex-col items-start" />
                        {reviewBox(row)}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-1 py-2">
                      <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                        aria-label={`Supprimer la session ${row.game} du ${row.date} ${row.time}`}
                        title="Supprimer la session"
                        onClick={(event) => {
                          event.stopPropagation();
                          setDeleteError(null);
                          setToDelete(row);
                        }}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </td>
                  )}
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
        
        {filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-sm">
            <div className="text-muted-foreground">
              Page {currentPage} / {totalPages} · {filtered.length} session(s)
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Précédent
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <SessionConsultSheet
        row={openRow}
        onClose={() => setOpenId(null)}
        onReviewedChange={toggleReviewed}
        onDeleteRequest={
          isAdmin
            ? (row) => {
                setDeleteError(null);
                setToDelete(row);
              }
            : undefined
        }
        reviewBusy={!!openRow && busyId === openRow.sessionId}
      />
      <Dialog open={!!toDelete} onOpenChange={(open) => !open && !deleting && setToDelete(null)}>
        <DialogContent role="alertdialog" className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader className="text-left">
            <DialogTitle>Supprimer définitivement cette session ?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 text-sm">
                {toDelete && (
                  <p className="rounded-md border bg-muted/40 px-3 py-2 text-foreground">
                    <span className="font-medium">{toDelete.game}</span>
                    <br />
                    {toDelete.date ? formatDate(toDelete.date + 'T12:00:00') : '—'} · {toDelete.time} · GM{' '}
                    {toDelete.gmName || '—'}
                  </p>
                )}
                <p>Seront supprimés :</p>
                <ul className="list-disc space-y-0.5 pl-5">
                  <li>les étapes cochées et leurs horaires ;</li>
                  <li>les ventes et le commentaire de vente ;</li>
                  <li>l’incident, les notes et remarques ;</li>
                  <li>les vidéos &amp; photos et le lien client (la page souvenirs ne fonctionnera plus).</li>
                </ul>
                <p className="font-medium text-red-700">Cette action est irréversible.</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <Alert variant="destructive">
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" disabled={deleting} onClick={() => setToDelete(null)}>
              Annuler
            </Button>
            <Button type="button" variant="destructive" disabled={deleting} onClick={() => void confirmDelete()}>
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <Trash2 className="mr-2 h-4 w-4" aria-hidden />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBulkConfirm} onOpenChange={(open) => !open && !bulkDeleting && setShowBulkConfirm(false)}>
        <DialogContent role="alertdialog" className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader className="text-left">
            <DialogTitle>Supprimer {selectedIds.size} session(s) ?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p>Vous allez supprimer définitivement {selectedIds.size} session(s) sélectionnée(s).</p>
                <p>Pour chaque session, seront supprimés :</p>
                <ul className="list-disc space-y-0.5 pl-5">
                  <li>les étapes cochées et leurs horaires ;</li>
                  <li>les ventes et le commentaire de vente ;</li>
                  <li>l'incident, les notes et remarques ;</li>
                  <li>les vidéos &amp; photos et le lien client (la page souvenirs ne fonctionnera plus).</li>
                </ul>
                <p className="font-medium text-red-700">Cette action est irréversible.</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <Alert variant="destructive">
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" disabled={bulkDeleting} onClick={() => setShowBulkConfirm(false)}>
              Annuler
            </Button>
            <Button type="button" variant="destructive" disabled={bulkDeleting} onClick={() => void confirmBulkDelete()}>
              {bulkDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <Trash2 className="mr-2 h-4 w-4" aria-hidden />}
              Supprimer {selectedIds.size} session(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[60] mx-auto max-w-sm rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-lg"
        >
          {toast}
        </div>
      )}
    </Card>
  );
}
