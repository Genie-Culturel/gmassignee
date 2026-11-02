import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Clock, PlayCircle, ExternalLink } from 'lucide-react';
import { SESSION_STEP_LABELS, INCIDENT_TYPE_LABELS, buildBugReporterUrl } from '@/lib/constants';
import { SessionStep, IncidentType } from '@/lib/database.types';
import { FicheButton } from '@/components/FicheButton';
import { useFichesByStep, useFichesByIncidentType } from '@/hooks/useProcedureFiches';
import { formatTime } from '@/lib/utils';
import { SessionSales } from '@/components/SessionSales';
import { mockSalesProducts } from '@/lib/mockData';

const SESSION_STEPS: SessionStep[] = [
  'reception_seating',
  'reception_drinks',
  'reception_popcorn',
  'reception_checkin',
  'salon_briefing',
  'salon_lockers',
  'game_playing',
  'game_filming',
  'salon_return',
  'reception_debrief',
  'videos_sent',
  'google_review',
  'socials_shared',
  'cleaning',
];

export function SuiviParties() {
  const [activeSession, setActiveSession] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<SessionStep>>(new Set());
  const [incidentType, setIncidentType] = useState<IncidentType | null>(null);
  const [incidentDetails, setIncidentDetails] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [groupName, setGroupName] = useState('');
  const [sessionId] = useState(`session-${Date.now()}`);
  const [sessionStartTime] = useState(new Date());

  const startSession = () => {
    setActiveSession(true);
    setCompletedSteps(new Set());
    setIncidentType(null);
    setIncidentDetails('');
    setSessionNotes('');
  };

  const endSession = () => {
    setActiveSession(false);
    // In real app: save to database
    alert('Session terminée et enregistrée (mode démo)');
  };

  const toggleStep = (step: SessionStep) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(step)) {
      newCompleted.delete(step);
    } else {
      newCompleted.add(step);
    }
    setCompletedSteps(newCompleted);
  };

  const reportIncident = (type: IncidentType) => {
    setIncidentType(type);
    
    // For bug/freeze, also open the bug reporter
    if (type === 'bug') {
      openBugReporter();
    }
  };

  const openBugReporter = () => {
    const bugReporterUrl = buildBugReporterUrl({
      game: 'VR Session', // In real app: get from event/session data
      date: sessionStartTime.toISOString().split('T')[0], // YYYY-MM-DD
      time: sessionStartTime.toTimeString().slice(0, 5), // HH:MM
      panel: 8, // In real app: actual number of players
      gm: 'GM Demo', // In real app: current GM name
      remarks: incidentDetails || undefined,
      ref: sessionId,
    });
    
    window.open(bugReporterUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Suivi des parties</h1>
        <p className="text-muted-foreground mt-2">
          Mode Session : accompagner les clients étape par étape
        </p>
      </div>

      {!activeSession ? (
        <Card>
          <CardHeader>
            <CardTitle>Démarrer une nouvelle session</CardTitle>
            <CardDescription>
              Lance une session pour accompagner un groupe de clients du début à la fin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="group-name">Nom du groupe (optionnel)</Label>
                <input
                  id="group-name"
                  type="text"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="ex: Entreprise ABC, Anniversaire Sophie..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>
              <Button onClick={startSession} className="w-full" size="lg">
                <PlayCircle className="mr-2 h-5 w-5" />
                Démarrer la session
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary animate-pulse" />
                    Session en cours
                  </CardTitle>
                  {groupName && (
                    <CardDescription className="mt-1">Groupe : {groupName}</CardDescription>
                  )}
                </div>
                <Badge variant="success" className="text-sm">
                  {completedSteps.size} / {SESSION_STEPS.length} étapes
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
              sessionId={sessionId}
              sessionStartTime={sessionStartTime}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle>Parcours client</CardTitle>
              <CardDescription>
                Coche chaque étape au fur et à mesure. Clique sur "Comment faire ?" pour voir les procédures.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {SESSION_STEPS.map((step) => (
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
                onClick={openBugReporter}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ouvrir le Bug reporter
              </Button>
            </CardContent>
          </Card>

          <SessionSales
            products={mockSalesProducts}
            onSalesChange={(items, comment) => {
              // In real app: update session state
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
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
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
      )}
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
  sessionId,
  sessionStartTime,
}: {
  incidentType: IncidentType;
  details: string;
  onDetailsChange: (details: string) => void;
  onClear: () => void;
  sessionId: string;
  sessionStartTime: Date;
}) {
  const relevantFiches = useFichesByIncidentType(incidentType);

  const openBugReporter = () => {
    const bugReporterUrl = buildBugReporterUrl({
      game: 'VR Session',
      date: sessionStartTime.toISOString().split('T')[0],
      time: sessionStartTime.toTimeString().slice(0, 5),
      panel: 8,
      gm: 'GM Demo',
      remarks: details || undefined,
      ref: sessionId,
    });
    window.open(bugReporterUrl, '_blank', 'noopener,noreferrer');
  };

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
            <Button variant="outline" size="sm" onClick={openBugReporter}>
              <ExternalLink className="h-4 w-4 mr-1" />
              Bug reporter
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
