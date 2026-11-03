import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ManualSessionBadge, SessionFlagBadge } from '@/components/SessionFlagBadge';
import { useParcoursList } from '@/hooks/useParcoursList';
import { INCIDENT_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '@/lib/constants';
import { getParcoursById, getParcoursOrDefault } from '@/lib/parcours';
import { PersistedSession } from '@/lib/sessionRepository';
import { RecordedSessionRow, buildSessionSteps, loadSessionForConsultation } from '@/lib/sessionView';
import { formatDate, formatDateTime, formatTime } from '@/lib/utils';

interface SessionConsultSheetProps {
  row: RecordedSessionRow | null;
  onClose: () => void;
  onReviewedChange: (row: RecordedSessionRow, reviewed: boolean) => void;
  reviewBusy: boolean;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm">{value || '—'}</dd>
    </div>
  );
}

const chf = (value: number) => `CHF ${value.toFixed(2)}`;

export function SessionConsultSheet({ row, onClose, onReviewedChange, reviewBusy }: SessionConsultSheetProps) {
  const [session, setSession] = useState<PersistedSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { parcoursList } = useParcoursList();
  const sessionId = row?.sessionId ?? null;

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSession(null);
    loadSessionForConsultation(sessionId)
      .then((loaded) => {
        if (cancelled) return;
        if (!loaded) setError('Session introuvable.');
        setSession(loaded);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Chargement impossible');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const steps = useMemo(() => {
    if (!session) return [];
    const parcours = getParcoursOrDefault(parcoursList, session.parcoursId);
    return buildSessionSteps(session.stepsSnapshot, parcours, session.stepTimes);
  }, [session, parcoursList]);

  const parcoursName = session
    ? getParcoursById(parcoursList, session.parcoursId)?.name || session.parcoursId || '—'
    : '—';

  const totals = useMemo(() => {
    const result = { collected: 0, toInvoice: 0 };
    for (const item of session?.sales || []) {
      const line = item.quantity * item.unitPrice;
      if (item.paymentMethod === 'facture') result.toInvoice += line;
      else result.collected += line;
    }
    return result;
  }, [session]);

  const doneCount = steps.filter((step) => session?.stepTimes[step.key]).length;

  return (
    <Sheet open={!!row} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full max-w-full bg-background sm:max-w-lg overflow-y-auto pb-0">
        {row && (
          <>
            <SheetHeader className="pr-8 text-left">
              <SheetTitle className="flex flex-wrap items-center gap-2">
                {row.game}
                {row.isManual && <ManualSessionBadge />}
              </SheetTitle>
              <SheetDescription>
                Consultation (lecture seule) · {row.date ? formatDate(`${row.date}T12:00:00`) : '—'} {row.time}
              </SheetDescription>
            </SheetHeader>

            {row.flag && (
              <div
                className={`mt-4 rounded-lg border p-3 text-sm ${
                  row.flagReviewedAt
                    ? 'border-slate-200 bg-slate-50'
                    : row.flag.kind === 'incident'
                      ? 'border-red-200 bg-red-50'
                      : 'border-amber-200 bg-amber-50'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <SessionFlagBadge flag={row.flag} reviewed={!!row.flagReviewedAt} />
                  <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={!!row.flagReviewedAt}
                      disabled={reviewBusy}
                      onCheckedChange={(checked) => onReviewedChange(row, checked === true)}
                    />
                    Relevé
                  </label>
                </div>
                {row.flag.excerpt && <p className="mt-2 text-muted-foreground">{row.flag.excerpt}</p>}
                {row.flagReviewedAt && (
                  <p className="mt-1 text-xs text-muted-foreground">Relevé le {formatDateTime(row.flagReviewedAt)}</p>
                )}
              </div>
            )}

            <div className="mt-6 space-y-6 pb-4">
              {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {session && (
                <>
                  <Section title="Session">
                    <dl className="grid grid-cols-2 gap-3">
                      <Field label="Jeu" value={session.game} />
                      <Field label="Lieu / parcours" value={parcoursName} />
                      <Field label="GM" value={session.gmName} />
                      <Field label="Date" value={session.date ? formatDate(`${session.date}T12:00:00`) : '—'} />
                      <Field
                        label="Heure prévue"
                        value={`${session.time}${session.plannedEndTime ? ` - ${session.plannedEndTime}` : ''}`}
                      />
                      <Field label="Joueurs" value={String(session.playerCount)} />
                      <Field label="Début réel" value={formatTime(session.startedAt)} />
                      <Field label="Fin" value={session.endedAt ? formatTime(session.endedAt) : 'En cours / non clôturée'} />
                      <Field label="Groupe" value={session.groupName} />
                      <Field label="E-mail client" value={session.clientEmail} />
                      <Field
                        label="Origine"
                        value={
                          session.isManual
                            ? 'Session manuelle (hors planning)'
                            : `Planning GMassignee${session.planningActivityId ? ` · réf. ${session.planningActivityId}` : ''}`
                        }
                      />
                      <Field
                        label="Vidéos envoyées"
                        value={session.videosSentAt ? `Oui · ${formatDateTime(session.videosSentAt)}` : 'Non'}
                      />
                    </dl>
                  </Section>

                  <Section title={`Étapes (${doneCount}/${steps.length})`}>
                    <ol className="space-y-1.5">
                      {steps.map((step) => {
                        const at = session.stepTimes[step.key];
                        return (
                          <li key={step.key} className="flex items-start gap-2 rounded-md border px-3 py-2 text-sm">
                            {at ? (
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-label="Faite" />
                            ) : (
                              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-label="Non faite" />
                            )}
                            <span className={`min-w-0 flex-1 ${at ? '' : 'text-muted-foreground'}`}>
                              {step.label}
                              {step.note && <span className="ml-1 text-xs text-amber-700">({step.note})</span>}
                            </span>
                            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                              {at ? formatTime(at) : '—'}
                            </span>
                          </li>
                        );
                      })}
                      {steps.length === 0 && <p className="text-sm text-muted-foreground">Aucune étape.</p>}
                    </ol>
                  </Section>

                  <Section title="Incident">
                    {session.incidentType || session.incidentDetails ? (
                      <div className="space-y-1 text-sm">
                        <p className="font-medium">
                          {session.incidentType ? INCIDENT_TYPE_LABELS[session.incidentType] : 'Incident'}
                        </p>
                        <p className="whitespace-pre-wrap text-muted-foreground">
                          {session.incidentDetails || 'Pas de détail.'}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Aucun incident.</p>
                    )}
                  </Section>

                  <Section title="Notes de session">
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{session.notes || 'Aucune note.'}</p>
                  </Section>

                  <Section title="Ventes">
                    {session.sales.length ? (
                      <ul className="divide-y rounded-md border text-sm">
                        {session.sales.map((item) => (
                          <li key={item.id} className="flex items-center justify-between gap-2 px-3 py-2">
                            <span className="min-w-0">
                              {item.quantity} × {item.productName}
                              <span className="block text-xs text-muted-foreground">
                                {PAYMENT_METHOD_LABELS[item.paymentMethod] || item.paymentMethod} · {chf(item.unitPrice)} / u.
                              </span>
                            </span>
                            <span className="shrink-0 tabular-nums">{chf(item.quantity * item.unitPrice)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">Aucune vente.</p>
                    )}
                    {session.salesComment && (
                      <p className="whitespace-pre-wrap text-sm">
                        <span className="text-muted-foreground">Commentaire : </span>
                        {session.salesComment}
                      </p>
                    )}
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <dt>Encaissé</dt>
                        <dd className="tabular-nums">{chf(totals.collected)}</dd>
                      </div>
                      {totals.toInvoice > 0 && (
                        <div className="flex justify-between">
                          <dt>À facturer</dt>
                          <dd className="tabular-nums">{chf(totals.toInvoice)}</dd>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold">
                        <dt>Total</dt>
                        <dd className="tabular-nums">{chf(totals.collected + totals.toInvoice)}</dd>
                      </div>
                    </dl>
                  </Section>
                </>
              )}
            </div>
            <div className="sticky bottom-0 -mx-6 mt-2 border-t bg-background/95 px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
              <SheetClose asChild>
                <Button variant="outline" className="w-full">
                  Fermer
                </Button>
              </SheetClose>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
