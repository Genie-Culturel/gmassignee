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
} from 'lucide-react';
import { SESSION_STEP_LABELS, INCIDENT_TYPE_LABELS, buildBugReporterUrl } from '@/lib/constants';
import { IncidentType, SalesProduct, SessionStep } from '@/lib/database.types';
import { FicheButton } from '@/components/FicheButton';
import { useFichesByStep, useFichesByIncidentType } from '@/hooks/useProcedureFiches';
import { formatDate, formatTime } from '@/lib/utils';
import { SessionSales } from '@/components/SessionSales';
import { AssignedActivities } from '@/components/AssignedActivities';
import {
  AssignedSession,
  DEMO_GM_ID,
  getAssignedSessions,
} from '@/lib/assignedSessions';
import {
  DEFAULT_PARCOURS_ID,
  PARCOURS,
  getParcoursOrDefault,
} from '@/lib/parcours';
import { isMockMode } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
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
  groupName: string;
  playerCount: number;
  gmName: string;
  parcoursId: string;
  notes: string;
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
    endTime,
    groupName: row.groupName,
    playerCount: row.playerCount,
    gmName: row.gmName,
    parcoursId: row.parcoursId,
    notes: row.notes,
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
  const gmId = user?.id || DEMO_GM_ID;

  const [assigned, setAssigned] = useState<AssignedSession[]>([]);
  const [openSessions, setOpenSessions] = useState<PersistedSession[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<SessionStep>>(new Set());
  const [incidentType, setIncidentType] = useState<IncidentType | null>(null);
  const [incidentDetails, setIncidentDetails] = useState('');
  const [salesItems, setSalesItems] = useState<SaleItem[]>([]);
  const [salesComment, setSalesComment] = useState('');
  const [products, setProducts] = useState<SalesProduct[]>([]);
  const [bugs, setBugs] = useState<SessionBug[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [manualGroupName, setManualGroupName] = useState('');
  const [manualGame, setManualGame] = useState('');
  const [manualPlayers, setManualPlayers] = useState('8');
  const [manualParcoursId, setManualParcoursId] = useState(DEFAULT_PARCOURS_ID);

  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyLoaded = useCallback((row: PersistedSession, endTime?: string) => {
    setActiveSession(toActive(row, endTime));
    setCompletedSteps(new Set(row.completedSteps));
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
    getAssignedSessions(gmId).then((rows) => {
      if (!cancelled) setAssigned(rows);
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
  }, [activeSession?.sessionId, refreshBugs]);

  const openByAssignment = useMemo(() => {
    const map = new Map<string, PersistedSession>();
    for (const row of openSessions) {
      if (row.assignmentId) map.set(row.assignmentId, row);
    }
    return map;
  }, [openSessions]);

  const parcours = getParcoursOrDefault(activeSession?.parcoursId);
  const sessionSteps = parcours.steps;

  const startFromAssignment = async (assignment: AssignedSession) => {
    setError(null);
    setBusy(true);
    try {
      const row = await createOrResumeFromAssignment({
        assignment,
        gmId,
        gmName: displayName,
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
        game: manualGame.trim() || 'VR Session',
        date: nowDate(),
        time: nowTime(),
        groupName: manualGroupName.trim(),
        playerCount: Number.isFinite(players) && players > 0 ? players : 8,
        parcoursId: manualParcoursId,
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
      setCompletedSteps(new Set());
      setIncidentType(null);
      setIncidentDetails('');
      setSalesItems([]);
      setSalesComment('');
      setBugs([]);
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
    const next = new Set(completedSteps);
    const completing = !next.has(step);
    if (completing) next.add(step);
    else next.delete(step);
    setCompletedSteps(next);
    try {
      await setStepCompleted(activeSession.sessionId, step, completing);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Étape non enregistrée');
    }
  };

  const reportIncident = async (type: IncidentType) => {
    setIncidentType(type);
    if (type === 'bug' && activeSession) {
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
                  <p className="font-medium">{row.game}</p>
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
              Tes parties assignées. Clique une ligne pour démarrer, déjà pré-remplie.
            </p>
          </div>
          <AssignedActivities
            sessions={assigned}
            openByAssignment={openByAssignment}
            busy={busy}
            onStart={startFromAssignment}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Démarrer une nouvelle session</CardTitle>
            <CardDescription>
              Fallback si la session n&apos;est pas dans le planning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="parcours">Parcours</Label>
                <select
                  id="parcours"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={manualParcoursId}
                  onChange={(e) => setManualParcoursId(e.target.value)}
                >
                  {PARCOURS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  {getParcoursOrDefault(manualParcoursId).description}
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
                <Label htmlFor="game-name">Jeu (optionnel)</Label>
                <Input
                  id="game-name"
                  type="text"
                  placeholder="ex: Le Serviteur I, La Planta..."
                  value={manualGame}
                  onChange={(e) => setManualGame(e.target.value)}
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
              <Button onClick={startManualSession} className="w-full" size="lg" disabled={busy}>
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
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary animate-pulse" />
                  Session en cours
                </CardTitle>
                <CardDescription className="mt-1 space-y-0.5">
                  <span className="block font-medium text-foreground">{activeSession.game}</span>
                  <span className="block">
                    {formatDate(activeSession.date + 'T12:00:00')} · {activeSession.time}
                    {activeSession.endTime ? ` - ${activeSession.endTime}` : ''}
                    {activeSession.groupName ? ` · ${activeSession.groupName}` : ''}
                    {` · ${activeSession.playerCount} joueur${activeSession.playerCount > 1 ? 's' : ''}`}
                  </span>
                  <span className="block">{parcours.name}</span>
                </CardDescription>
              </div>
              <Badge variant="success" className="text-sm shrink-0">
                {completedSteps.size} / {sessionSteps.length} étapes
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {incidentType && (
          <IncidentAlert
            incidentType={incidentType}
            details={incidentDetails}
            onDetailsChange={onIncidentDetailsChange}
            onClear={clearIncident}
            session={activeSession}
          />
        )}

        <Card>
          <CardHeader>
            <CardTitle>Parcours client</CardTitle>
            <CardDescription>
              Coche chaque étape au fur et à mesure. Clique sur &quot;Comment faire ?&quot; pour voir les procédures.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessionSteps.map((step) => (
              <SessionStepItem
                key={step}
                step={step}
                isCompleted={completedSteps.has(step)}
                onToggle={() => toggleStep(step)}
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

            <Button
              variant="outline"
              size="sm"
              onClick={() => openBugReporter(activeSession, incidentDetails)}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Ouvrir le Bug reporter
            </Button>

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
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => openBugReporter(activeSession, incidentDetails)}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Rouvrir le Bug reporter
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

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
  onToggle,
}: {
  step: SessionStep;
  isCompleted: boolean;
  onToggle: () => void;
}) {
  const { fiches, isLoading } = useFichesByStep(step);

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
        isCompleted ? 'bg-muted/50 border-primary' : 'bg-background'
      }`}
    >
      <Checkbox
        id={`step-${step}`}
        checked={isCompleted}
        onCheckedChange={onToggle}
        className="mt-1"
      />
      <div className="flex-1 min-w-0">
        <Label
          htmlFor={`step-${step}`}
          className={`cursor-pointer ${isCompleted ? 'line-through text-muted-foreground' : ''}`}
        >
          {SESSION_STEP_LABELS[step]}
        </Label>
        {isCompleted && (
          <p className="text-xs text-muted-foreground mt-1">
            Complété à {formatTime(new Date())}
          </p>
        )}
      </div>
      {!isLoading && fiches.length > 0 && (
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
  session,
}: {
  incidentType: IncidentType;
  details: string;
  onDetailsChange: (details: string) => void;
  onClear: () => void;
  session: ActiveSession;
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
        <Textarea
          placeholder="Décris l'incident..."
          value={details}
          onChange={(e) => onDetailsChange(e.target.value)}
          rows={2}
        />
        <div className="flex flex-wrap gap-2">
          {relevantFiches.length > 0 && (
            <FicheButton fiches={relevantFiches} label="Voir la procédure de dépannage" />
          )}
          {(incidentType === 'bug' || incidentType === 'autre') && (
            <Button variant="outline" size="sm" onClick={() => openBugReporter(session, details)}>
              <ExternalLink className="h-4 w-4 mr-1" />
              Bug reporter
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
