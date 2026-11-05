import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  PlayCircle,
  ExternalLink,
  Users,
} from 'lucide-react';
import { INCIDENT_TYPE_LABELS, buildBugReporterUrl } from '@/lib/constants';
import { IncidentType, ProcedureFiche, SalesProduct, SessionStep } from '@/lib/database.types';
import { FicheButton } from '@/components/FicheButton';
import { useFichesByIncidentType } from '@/hooks/useProcedureFiches';
import { useStepFiches } from '@/hooks/useStepFiches';
import { formatDate, formatTime } from '@/lib/utils';
import { SessionSales } from '@/components/SessionSales';
import { AssignedActivities } from '@/components/AssignedActivities';
import { SessionStartNotice } from '@/components/SessionStartNotice';
import { ManualSessionBadge } from '@/components/SessionFlagBadge';
import { SessionVideos } from '@/components/SessionVideos';
import {
  AssignedSession,
  DEMO_GM_ID,
  getAssignedSessions,
} from '@/lib/assignedSessions';
import {
  ParcoursStepDef,
  activeSteps,
  getParcoursById,
  getParcoursOrDefault,
  hasVideoStep,
  parcoursForGame,
  resolveGameByName,
} from '@/lib/parcours';
import { findGame, gamesGroupedByLocation } from '@/lib/venues';
import { useVenueCatalog } from '@/hooks/useVenueCatalog';
import { useParcoursList } from '@/hooks/useParcoursList';
import { isMockMode } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useGmOptions } from '@/hooks/useGmOptions';
import { buildSessionSteps } from '@/lib/sessionView';
import {
  PersistedSession,
  SaleItem,
  SessionBug,
  assignmentKey,
  createManualSession,
  createOrResumeFromAssignment,
  endSession as persistEndSession,
  fetchSalesProducts,
  listBugsForSession,
  listOpenSessions,
  loadSession,
  readRememberedSessionId,
  rememberActiveSession,
  replaceSales,
  setStepCompleted,
  updateSessionFields,
} from '@/lib/sessionRepository';

interface ActiveSession {
  sessionId: string;
  assignmentId: string | null;
  game: string;
  date: string;
  time: string;
  endTime?: string;
  startedAt: string;
  groupName: string;
  playerCount: number;
  gmName: string;
  parcoursId: string;
  stepsSnapshot: ParcoursStepDef[] | null;
  notes: string;
  clientEmail: string;
  videosSentAt: string | null;
  isManual: boolean;
}

function nowDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function nowTime(): string {
  return new Date().toTimeString().slice(0, 5);
}

function toActive(row: PersistedSession, endTime?: string): ActiveSession {
  return {
    sessionId: row.sessionId,
    assignmentId: row.assignmentId,
    game: row.game,
    date: row.date,
    time: row.time,
    endTime: endTime || row.plannedEndTime || undefined,
    startedAt: row.startedAt,
    groupName: row.groupName,
    playerCount: row.playerCount,
    gmName: row.gmName,
    parcoursId: row.parcoursId,
    stepsSnapshot: row.stepsSnapshot,
    notes: row.notes,
    clientEmail: row.clientEmail || '',
    videosSentAt: row.videosSentAt,
    isManual: row.isManual,
  };
}

function openBugReporter(session: ActiveSession, remarks?: string) {
  const url = buildBugReporterUrl({
    game: session.game,
    date: session.date,
    time: session.time,
    panel: session.playerCount,
    gm: session.gmName,
    remarks: remarks || undefined,
    ref: session.sessionId,
    sessionId: session.sessionId,
  });
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function SuiviParties() {
  const { user, displayName } = useAuth();
  const { options } = useGmOptions();
  const gmId = user?.id || DEMO_GM_ID;

  const [assigned, setAssigned] = useState<AssignedSession[]>([]);
  const [openSessions, setOpenSessions] = useState<PersistedSession[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [stepTimes, setStepTimes] = useState<Partial<Record<SessionStep, string>>>({});
  const [incidentType, setIncidentType] = useState<IncidentType | null>(null);
  const [incidentDetails, setIncidentDetails] = useState('');
  const [salesItems, setSalesItems] = useState<SaleItem[]>([]);
  const [salesComment, setSalesComment] = useState('');
  const [products, setProducts] = useState<SalesProduct[]>([]);
  const [bugs, setBugs] = useState<SessionBug[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  const [manualGroupName, setManualGroupName] = useState('');
  const [manualGameId, setManualGameId] = useState('');
  const [manualPlayers, setManualPlayers] = useState('8');

  const { catalog, isLoading: catalogLoading } = useVenueCatalog();
  const { parcoursList, isLoading: parcoursLoading } = useParcoursList();
  const setupLoading = catalogLoading || parcoursLoading;
  const gameGroups = useMemo(() => gamesGroupedByLocation(catalog), [catalog]);
  const effectiveManualGameId = manualGameId || catalog.games[0]?.id || '';
  const manualGame = findGame(catalog, effectiveManualGameId);
  const manualParcours = parcoursForGame(parcoursList, catalog, manualGame) || getParcoursOrDefault(parcoursList);

  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emailTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyLoaded = useCallback((row: PersistedSession, endTime?: string) => {
    setActiveSession(toActive(row, endTime));
    setStepTimes(row.stepTimes || {});
    setIncidentType(row.incidentType);
    setIncidentDetails(row.incidentDetails);
    setSalesItems(row.sales);
    setSalesComment(row.salesComment);
    rememberActiveSession(row.sessionId);
  }, []);

  const refreshBugs = useCallback(async (sessionId: string) => {
    try {
      setBugs(await listBugsForSession(sessionId));
    } catch {
      /* listing bugs is best-effort */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    
    // Load assigned sessions - handle errors properly
    getAssignedSessions(gmId)
      .then((rows) => {
        if (!cancelled) {
          console.log('[SuiviParties] Loaded', rows.length, 'assigned sessions');
          setAssigned(rows);
          setAssignmentError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
          console.error('[SuiviParties] Failed to load assignments:', errorMsg);
          setAssignmentError(errorMsg);
          setAssigned([]);
        }
      });
    
    fetchSalesProducts().then((rows) => {
      if (!cancelled) setProducts(rows);
    });
    
    if (!isMockMode && user) {
      listOpenSessions(user.id).then((rows) => {
        if (!cancelled) setOpenSessions(rows);
      });
      const remembered = readRememberedSessionId();
      if (remembered) {
        loadSession(remembered)
          .then((row) => {
            if (!cancelled && row && !row.endedAt) applyLoaded(row);
          })
          .catch(() => rememberActiveSession(null));
      }
    }
    return () => {
      cancelled = true;
    };
  }, [gmId, user, applyLoaded]);

  useEffect(() => {
    if (!activeSession) return;
    refreshBugs(activeSession.sessionId);
    const onFocus = () => refreshBugs(activeSession.sessionId);
    window.addEventListener('focus', onFocus);
    const tick = window.setInterval(() => refreshBugs(activeSession.sessionId), 15000);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.clearInterval(tick);
    };
    // Refresh on this session id only; the whole activeSession object changes often.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession?.sessionId, refreshBugs]);

  const openByAssignment = useMemo(() => {
    const map = new Map<string, PersistedSession>();
    for (const row of openSessions) {
      if (row.assignmentId) map.set(row.assignmentId, row);
    }
    return map;
  }, [openSessions]);

  const parcours = getParcoursOrDefault(parcoursList, activeSession?.parcoursId);
  const sessionSteps = useMemo(
    () => buildSessionSteps(activeSession?.stepsSnapshot ?? null, parcours, stepTimes),
    [activeSession?.stepsSnapshot, parcours, stepTimes]
  );
  const { byStep: stepFiches } = useStepFiches(activeSession ? parcours.id : undefined);
  const completedCount = sessionSteps.filter((step) => stepTimes[step.key]).length;
  const showVideos = hasVideoStep(sessionSteps);

  const startFromAssignment = async (assignment: AssignedSession) => {
    setError(null);
    setBusy(true);
    try {
      const game = resolveGameByName(catalog, assignment.game);
      const resolved =
        getParcoursById(parcoursList, assignment.parcoursId) ||
        parcoursForGame(parcoursList, catalog, game) ||
        getParcoursOrDefault(parcoursList);
      const row = await createOrResumeFromAssignment({
        assignment,
        gmId,
        gmName: displayName,
        game: game?.name,
        parcoursId: resolved.id,
        stepsSnapshot: activeSteps(resolved),
      });
      applyLoaded(row, assignment.endTime);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de démarrer la session');
    } finally {
      setBusy(false);
    }
  };

  const resumeOpen = (row: PersistedSession) => {
    const match = assigned.find((session) => assignmentKey(session) === row.assignmentId);
    applyLoaded(row, match?.endTime);
  };

  const startManualSession = async () => {
    const players = parseInt(manualPlayers, 10);
    setError(null);
    setBusy(true);
    try {
      const row = await createManualSession({
        gmId,
        gmName: displayName,
        game: manualGame?.name || 'Session',
        date: nowDate(),
        time: nowTime(),
        groupName: manualGroupName.trim(),
        playerCount: Number.isFinite(players) && players > 0 ? players : 8,
        parcoursId: manualParcours.id,
        stepsSnapshot: activeSteps(manualParcours),
      });
      applyLoaded(row);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de démarrer la session');
    } finally {
      setBusy(false);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    setBusy(true);
    try {
      await persistEndSession(activeSession.sessionId);
      setActiveSession(null);
      setStepTimes({});
      setIncidentType(null);
      setIncidentDetails('');
      setSalesItems([]);
      setSalesComment('');
      setBugs([]);
      if (emailTimer.current) clearTimeout(emailTimer.current);
      if (user && !isMockMode) {
        setOpenSessions(await listOpenSessions(user.id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de terminer la session');
    } finally {
      setBusy(false);
    }
  };

  const toggleStep = async (step: SessionStep) => {
    if (!activeSession) return;
    const completing = !stepTimes[step];
    const next = { ...stepTimes };
    if (completing) next[step] = new Date().toISOString();
    else delete next[step];
    setStepTimes(next);
    try {
      await setStepCompleted(activeSession.sessionId, step, completing);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Étape non enregistrée');
    }
  };

  const reportIncident = async (type: IncidentType) => {
    setIncidentType(type);
    if (type === 'bug' && options.bugReporter && activeSession) {
      openBugReporter(activeSession, incidentDetails);
    }
    if (activeSession) {
      try {
        await updateSessionFields(activeSession.sessionId, {
          incidentType: type,
          incidentDetails,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Incident non enregistré');
      }
    }
  };

  const handleOpenBugReporter = async () => {
    if (!activeSession) return;
    openBugReporter(activeSession, incidentDetails);
    // Persist incidentType: 'bug' when opening Bug reporter
    try {
      await updateSessionFields(activeSession.sessionId, {
        incidentType: 'bug',
        incidentDetails: incidentDetails || '',
      });
      setIncidentType('bug');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incident non enregistré');
    }
  };

  const onNotesChange = (notes: string) => {
    if (!activeSession) return;
    setActiveSession({ ...activeSession, notes });
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => {
      updateSessionFields(activeSession.sessionId, { notes }).catch((err) =>
        setError(err instanceof Error ? err.message : 'Notes non enregistrées')
      );
    }, 600);
  };

  const onIncidentDetailsChange = (details: string) => {
    setIncidentDetails(details);
    if (!activeSession) return;
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => {
      updateSessionFields(activeSession.sessionId, { incidentDetails: details }).catch((err) =>
        setError(err instanceof Error ? err.message : 'Incident non enregistré')
      );
    }, 600);
  };

  const clearIncident = async () => {
    setIncidentType(null);
    setIncidentDetails('');
    if (activeSession) {
      try {
        await updateSessionFields(activeSession.sessionId, {
          incidentType: null,
          incidentDetails: '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Incident non enregistré');
      }
    }
  };

  if (!activeSession) {
    return (
      <div className="space-y-6 pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suivi des parties</h1>
          <p className="text-muted-foreground mt-2">
            Mode Session : accompagner les clients étape par étape
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {assignmentError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur de chargement du planning</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="font-medium">Impossible de charger vos activités assignées :</p>
              <p className="text-sm mt-1 font-mono">{assignmentError}</p>
              <p className="text-sm mt-2">Vérifiez la console du navigateur pour plus de détails.</p>
            </AlertDescription>
          </Alert>
        )}

        {!isMockMode && openSessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Sessions en cours</CardTitle>
              <CardDescription>Reprendre exactement là où tu t&apos;étais arrêté</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {openSessions.map((row) => (
                <button
                  key={row.sessionId}
                  type="button"
                  onClick={() => resumeOpen(row)}
                  className="w-full text-left rounded-lg border bg-background p-3 hover:border-primary transition-colors"
                >
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    {row.game}
                    {row.isManual && <ManualSessionBadge />}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {row.date} · {row.time}
                    {row.groupName ? ` · ${row.groupName}` : ''}
                    {` · ${row.completedSteps.length} étape${row.completedSteps.length > 1 ? 's' : ''}`}
                  </p>
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Mes sessions</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Tes parties assignées : « Démarrer la session » reprend toutes les infos du planning.
            </p>
          </div>
          <SessionStartNotice />
          <AssignedActivities
            sessions={assigned}
            openByAssignment={openByAssignment}
            busy={busy || setupLoading}
            onStart={startFromAssignment}
          />
        </div>

        <Card className="border-2 border-dashed border-violet-300 bg-violet-50/30">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              Démarrer une session manuelle
              <ManualSessionBadge />
            </CardTitle>
            <CardDescription>
              Uniquement si la partie n&apos;est pas dans le planning. Elle sera marquée « Session manuelle » partout.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="flex items-start gap-2 text-xs text-amber-900">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                Démarre à ton arrivée : l&apos;heure de démarrage = heure d&apos;arrivée du GM.
              </p>
              <div>
                <Label htmlFor="manual-game">Jeu</Label>
                <select
                  id="manual-game"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={effectiveManualGameId}
                  onChange={(e) => setManualGameId(e.target.value)}
                  disabled={setupLoading}
                >
                  {gameGroups.map((group) => (
                    <optgroup key={group.location.id} label={group.location.name}>
                      {group.games.map((game) => (
                        <option key={game.id} value={game.id}>
                          {game.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  {manualParcours.name} · {activeSteps(manualParcours).length} étapes
                  {manualParcours.isProvisional ? ' · provisoire' : ''}
                </p>
              </div>
              <div>
                <Label htmlFor="group-name">Nom du groupe (optionnel)</Label>
                <Input
                  id="group-name"
                  type="text"
                  placeholder="ex: Entreprise ABC, Anniversaire Sophie..."
                  value={manualGroupName}
                  onChange={(e) => setManualGroupName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="player-count">Nombre de joueurs</Label>
                <Input
                  id="player-count"
                  type="number"
                  min={1}
                  max={16}
                  value={manualPlayers}
                  onChange={(e) => setManualPlayers(e.target.value)}
                />
              </div>
              <Button
                onClick={startManualSession}
                className="w-full bg-violet-600 hover:bg-violet-700"
                size="lg"
                disabled={busy || setupLoading}
              >
                <PlayCircle className="mr-2 h-5 w-5" />
                Démarrer une session manuelle
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Suivi des parties</h1>
        <p className="text-muted-foreground mt-2">
          Mode Session : accompagner les clients étape par étape
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        <Card className={activeSession.isManual ? 'border-2 border-dashed border-violet-400' : 'border-primary'}>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="flex flex-wrap items-center gap-2">
                  <Clock className="h-5 w-5 text-primary animate-pulse" />
                  Session en cours
                  {activeSession.isManual && <ManualSessionBadge />}
                </CardTitle>
                <CardDescription className="mt-1 space-y-0.5">
                  <span className="block font-medium text-foreground">{activeSession.game}</span>
                  {activeSession.groupName && (
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {activeSession.groupName}
                    </span>
                  )}
                  <span className="block">
                    {formatDate(activeSession.date + 'T12:00:00')} · {activeSession.time}
                    {activeSession.endTime ? ` - ${activeSession.endTime}` : ''}
                    {` · ${activeSession.playerCount} joueur${activeSession.playerCount > 1 ? 's' : ''}`}
                  </span>
                  <span className="block">
                    {parcours.name}
                    {parcours.isProvisional ? ' (provisoire)' : ''}
                  </span>
                  <span className="mt-2 inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-sm font-semibold text-foreground">
                    Arrivée GM : {formatTime(activeSession.startedAt)}
                  </span>
                </CardDescription>
              </div>
              <Badge variant="success" className="text-sm shrink-0">
                {completedCount} / {sessionSteps.length} étapes
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Parcours client –{' '}
              {catalog.locations.find((l) => l.slug === parcours.locationSlug)?.name ||
                parcours.name.replace(/^Parcours (client )?/, '')}
              {parcours.isProvisional ? ' (provisoire)' : ''}
            </CardTitle>
            <CardDescription>
              Coche chaque étape au fur et à mesure. Clique sur &quot;Voir la procédure&quot; pour voir les procédures.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessionSteps.map((step) => (
              <SessionStepItem
                key={step.key}
                step={step}
                isCompleted={Boolean(stepTimes[step.key])}
                completedAt={stepTimes[step.key]}
                fiches={stepFiches[step.key] || []}
                onToggle={() => toggleStep(step.key)}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span>Incident ?</span>
              {bugs.length > 0 && (
                <Badge variant="destructive">{bugs.length} bug{bugs.length > 1 ? 's' : ''}</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Signale un incident si quelque chose ne va pas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {(['bug', 'malaise', 'casse', 'autre'] as IncidentType[]).map((type) => (
                <Button
                  key={type}
                  variant={incidentType === type ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => reportIncident(type)}
                >
                  {INCIDENT_TYPE_LABELS[type]}
                </Button>
              ))}
            </div>

            {incidentType && (
              <IncidentAlert
                incidentType={incidentType}
                details={incidentDetails}
                onDetailsChange={onIncidentDetailsChange}
                onClear={clearIncident}
              />
            )}

            {options.bugReporter && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleOpenBugReporter()}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ouvrir le Bug reporter
              </Button>
            )}

            {bugs.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-sm font-medium">Bugs de cette session</p>
                <ul className="space-y-2">
                  {bugs.map((bug) => (
                    <li
                      key={`${bug.bugSessionId}-${bug.position}-${bug.description}`}
                      className="text-sm rounded-md border p-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium leading-snug">{bug.description}</span>
                        {bug.criticality && (
                          <Badge variant="secondary" className="shrink-0 text-xs">
                            {bug.criticality}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {[bug.category, bug.status].filter(Boolean).join(' · ')}
                      </p>
                    </li>
                  ))}
                </ul>
                {options.bugReporter && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => void handleOpenBugReporter()}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Rouvrir le Bug reporter
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {showVideos && options.uploadVideosClients && (
          <SessionVideos
            key={`${activeSession.sessionId}-videos`}
            sessionId={activeSession.sessionId}
            gmId={gmId}
            clientEmail={activeSession.clientEmail}
            videosSentAt={activeSession.videosSentAt}
            onClientEmailChange={(email) => {
              setActiveSession({ ...activeSession, clientEmail: email });
              if (emailTimer.current) clearTimeout(emailTimer.current);
              emailTimer.current = setTimeout(() => {
                updateSessionFields(activeSession.sessionId, { clientEmail: email }).catch((err) =>
                  setError(err instanceof Error ? err.message : 'E-mail non enregistré')
                );
              }, 600);
            }}
            onSent={(sentAt) => {
              setActiveSession({ ...activeSession, videosSentAt: sentAt });
              setStepTimes((prev) => ({ ...prev, videos_sent: sentAt }));
              void setStepCompleted(activeSession.sessionId, 'videos_sent', true);
              void updateSessionFields(activeSession.sessionId, { videosSentAt: sentAt });
            }}
          />
        )}

        {options.encaissement && (
          <SessionSales
            key={activeSession.sessionId}
            products={products}
            groupName={activeSession.groupName}
            playerCount={activeSession.playerCount}
            game={activeSession.game}
            initialItems={salesItems}
            initialComment={salesComment}
            onSalesChange={(items, comment) => {
              setSalesItems(items);
              setSalesComment(comment);
              replaceSales(activeSession.sessionId, items, comment, products).catch((err) =>
                setError(err instanceof Error ? err.message : 'Ventes non enregistrées')
              );
            }}
          />
        )}

        <Card>
          <CardHeader>
            <CardTitle>Notes de session</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Notes libres sur cette session..."
              value={activeSession.notes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button onClick={handleEndSession} size="lg" className="flex-1" disabled={busy}>
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Terminer la session
          </Button>
        </div>
      </div>
    </div>
  );
}

function SessionStepItem({
  step,
  isCompleted,
  completedAt,
  fiches,
  onToggle,
}: {
  step: ParcoursStepDef;
  isCompleted: boolean;
  completedAt?: string;
  fiches: ProcedureFiche[];
  onToggle: () => void;
}) {

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
        isCompleted ? 'bg-muted/50 border-primary' : 'bg-background'
      }`}
    >
      <Checkbox
        id={`step-${step.key}`}
        checked={isCompleted}
        onCheckedChange={onToggle}
        className="mt-1"
      />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <Label
            htmlFor={`step-${step.key}`}
            className={`cursor-pointer ${isCompleted ? 'line-through text-muted-foreground' : ''}`}
          >
            {step.label}
          </Label>
          {step.note && (
            <Badge variant="secondary" className="text-[10px] font-normal">
              {step.note}
            </Badge>
          )}
          {isCompleted && completedAt && (
            <span className="text-xs tabular-nums text-muted-foreground">
              {formatTime(completedAt)}
            </span>
          )}
        </div>
        {step.hint && (
          <p className="mt-1 text-xs leading-snug text-muted-foreground">{step.hint}</p>
        )}
      </div>
      {fiches.length > 0 && (
        <FicheButton fiches={fiches} />
      )}
    </div>
  );
}

function IncidentAlert({
  incidentType,
  details,
  onDetailsChange,
  onClear,
}: {
  incidentType: IncidentType;
  details: string;
  onDetailsChange: (details: string) => void;
  onClear: () => void;
}) {
  const relevantFiches = useFichesByIncidentType(incidentType);

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>Incident signalé : {INCIDENT_TYPE_LABELS[incidentType]}</span>
        <Button variant="ghost" size="sm" onClick={onClear}>
          Annuler
        </Button>
      </AlertTitle>
      <AlertDescription className="space-y-3 mt-2">
        <label className="block text-sm font-medium text-foreground">
          Veuillez préciser le problème
        </label>
        <Textarea
          key={incidentType}
          autoFocus
          placeholder="Que s'est-il passé ? Quel matériel, quel client, quelle salle…"
          value={details}
          onChange={(e) => onDetailsChange(e.target.value)}
          rows={3}
          className={details.trim() ? '' : 'border-destructive'}
        />
        {!details.trim() && (
          <p className="text-xs text-destructive">Note à remplir par le GM.</p>
        )}
        <div className="flex flex-wrap gap-2">
          {relevantFiches.length > 0 && (
            <FicheButton fiches={relevantFiches} label={relevantFiches.length === 1 ? relevantFiches[0].title.replace('🚧 ', '') : 'Voir la procédure'} />
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
