import { useEffect, useMemo, useState } from 'react';
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
  Calendar,
  CheckCircle2,
  Clock,
  PlayCircle,
  ExternalLink,
  Users,
} from 'lucide-react';
import { SESSION_STEP_LABELS, INCIDENT_TYPE_LABELS, buildBugReporterUrl } from '@/lib/constants';
import { SessionStep, IncidentType } from '@/lib/database.types';
import { FicheButton } from '@/components/FicheButton';
import { useFichesByStep, useFichesByIncidentType } from '@/hooks/useProcedureFiches';
import { formatDate, formatTime } from '@/lib/utils';
import { SessionSales } from '@/components/SessionSales';
import { mockSalesProducts } from '@/lib/mockData';
import {
  AssignedSession,
  DEMO_GM_ID,
  DEMO_GM_NAME,
  getAssignedSessions,
} from '@/lib/assignedSessions';
import {
  DEFAULT_PARCOURS_ID,
  PARCOURS,
  getParcoursOrDefault,
} from '@/lib/parcours';

interface ActiveSession {
  sessionId: string;
  game: string;
  date: string;
  time: string;
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

function isToday(date: string): boolean {
  return date === nowDate();
}

function isTomorrow(date: string): boolean {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return date === `${y}-${m}-${day}`;
}

function dayLabel(date: string): string {
  if (isToday(date)) return "Aujourd'hui";
  if (isTomorrow(date)) return 'Demain';
  return formatDate(date + 'T12:00:00');
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
  });
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function SuiviParties() {
  const [assigned, setAssigned] = useState<AssignedSession[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<SessionStep>>(new Set());
  const [incidentType, setIncidentType] = useState<IncidentType | null>(null);
  const [incidentDetails, setIncidentDetails] = useState('');

  const [manualGroupName, setManualGroupName] = useState('');
  const [manualGame, setManualGame] = useState('');
  const [manualPlayers, setManualPlayers] = useState('8');
  const [manualParcoursId, setManualParcoursId] = useState(DEFAULT_PARCOURS_ID);

  useEffect(() => {
    let cancelled = false;
    getAssignedSessions(DEMO_GM_ID).then((rows) => {
      if (!cancelled) setAssigned(rows);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const groupedAssignments = useMemo(() => {
    const groups: { label: string; date: string; sessions: AssignedSession[] }[] = [];
    for (const session of assigned) {
      const last = groups[groups.length - 1];
      if (last && last.date === session.date) {
        last.sessions.push(session);
      } else {
        groups.push({
          label: dayLabel(session.date),
          date: session.date,
          sessions: [session],
        });
      }
    }
    return groups;
  }, [assigned]);

  const parcours = getParcoursOrDefault(activeSession?.parcoursId);
  const sessionSteps = parcours.steps;

  const startFromAssignment = (assignment: AssignedSession) => {
    setActiveSession({
      sessionId: assignment.id,
      game: assignment.game,
      date: assignment.date,
      time: assignment.time,
      groupName: assignment.groupName,
      playerCount: assignment.playerCount,
      gmName: assignment.gmName,
      parcoursId: assignment.parcoursId || DEFAULT_PARCOURS_ID,
      notes: assignment.notes || '',
    });
    setCompletedSteps(new Set());
    setIncidentType(null);
    setIncidentDetails('');
  };

  const startManualSession = () => {
    const players = parseInt(manualPlayers, 10);
    setActiveSession({
      sessionId: `session-${Date.now()}`,
      game: manualGame.trim() || 'VR Session',
      date: nowDate(),
      time: nowTime(),
      groupName: manualGroupName.trim(),
      playerCount: Number.isFinite(players) && players > 0 ? players : 8,
      gmName: DEMO_GM_NAME,
      parcoursId: manualParcoursId,
      notes: '',
    });
    setCompletedSteps(new Set());
    setIncidentType(null);
    setIncidentDetails('');
  };

  const endSession = () => {
    setActiveSession(null);
    alert('Session terminée et enregistrée (mode démo)');
  };

  const toggleStep = (step: SessionStep) => {
    const next = new Set(completedSteps);
    if (next.has(step)) next.delete(step);
    else next.add(step);
    setCompletedSteps(next);
  };

  const reportIncident = (type: IncidentType) => {
    setIncidentType(type);
    if (type === 'bug' && activeSession) {
      openBugReporter(activeSession, incidentDetails);
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

        <Card>
          <CardHeader>
            <CardTitle>Mes sessions</CardTitle>
            <CardDescription>
              Tes parties du jour, puis les prochaines. Clique pour démarrer sans retaper les infos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {assigned.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune session assignée pour le moment.
              </p>
            ) : (
              groupedAssignments.map((group) => (
                <div key={group.date} className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </p>
                  {group.sessions.map((session) => (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => startFromAssignment(session)}
                      className="w-full text-left rounded-lg border bg-background p-3 hover:border-primary transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium leading-snug">{session.game}</p>
                          <p className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {session.time}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(session.date + 'T12:00:00')}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {session.playerCount} joueur{session.playerCount > 1 ? 's' : ''}
                            </span>
                          </p>
                          {session.groupName && (
                            <p className="text-sm mt-1">{session.groupName}</p>
                          )}
                        </div>
                        <Badge variant={isToday(session.date) ? 'success' : 'secondary'}>
                          {isToday(session.date) ? 'Aujourd\'hui' : group.label}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              ))
            )}
          </CardContent>
        </Card>

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
              <Button onClick={startManualSession} className="w-full" size="lg">
                <PlayCircle className="mr-2 h-5 w-5" />
                Démarrer la session
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
            onDetailsChange={setIncidentDetails}
            onClear={() => {
              setIncidentType(null);
              setIncidentDetails('');
            }}
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
            <CardTitle>Incident ?</CardTitle>
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
          </CardContent>
        </Card>

        <SessionSales
          products={mockSalesProducts}
          groupName={activeSession.groupName}
          playerCount={activeSession.playerCount}
          game={activeSession.game}
          onSalesChange={(items, comment) => {
            console.log('Sales updated:', items, comment);
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
              onChange={(e) =>
                setActiveSession({ ...activeSession, notes: e.target.value })
              }
              rows={3}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button onClick={endSession} size="lg" className="flex-1">
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
