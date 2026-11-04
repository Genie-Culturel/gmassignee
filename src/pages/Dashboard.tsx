import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Clock, FileText } from 'lucide-react';
import { isMockMode } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useProcedureFiches } from '@/hooks/useProcedureFiches';
import { ensureCheckin, listCheckinsThisMonth, listSessionsThisMonth } from '@/lib/sessionRepository';
import { SessionMediaAdmin } from '@/components/SessionMediaAdmin';

export function Dashboard() {
  const { user, displayName, isAdmin } = useAuth();
  const { fiches } = useProcedureFiches();
  const [sessions, setSessions] = useState(0);
  const [checkins, setCheckins] = useState(0);
  const [checkinBusy, setCheckinBusy] = useState(false);
  const [checkinMsg, setCheckinMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isMockMode || !user) return;
    listSessionsThisMonth(user.id).then(setSessions);
    listCheckinsThisMonth(user.id).then(setCheckins);
  }, [user]);

  const pointerArrivee = async () => {
    if (!user) return;
    setCheckinBusy(true);
    setCheckinMsg(null);
    try {
      await ensureCheckin(user.id);
      setCheckins(await listCheckinsThisMonth(user.id));
      setCheckinMsg('Arrivée enregistrée');
    } catch (err) {
      setCheckinMsg(err instanceof Error ? err.message : 'Check-in impossible');
    } finally {
      setCheckinBusy(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Historique des sessions</h1>
        <p className="text-muted-foreground mt-2">
          Vue d'ensemble de tes activités{!isMockMode ? ` · ${displayName}` : ''}
          {isAdmin && !isMockMode ? ' · Toutes les sessions' : ''}
        </p>
      </div>

      {isMockMode && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Mode démo actif — les données ne sont pas enregistrées.
            Désactive le mode démo (pied de page) pour te connecter à gm-vrcenter.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions ce mois</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isMockMode ? 0 : sessions}</div>
            <p className="text-xs text-muted-foreground">
              {sessions === 0 ? 'Aucune session enregistrée' : 'Enregistrées dans Supabase'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-ins</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isMockMode ? 0 : checkins}</div>
            <p className="text-xs text-muted-foreground">Arrivées ce mois</p>
            {!isMockMode && (
              <Button
                className="mt-3 w-full"
                size="sm"
                variant="outline"
                disabled={checkinBusy}
                onClick={pointerArrivee}
              >
                Pointer mon arrivée
              </Button>
            )}
            {checkinMsg && (
              <p className="text-xs text-muted-foreground mt-2">{checkinMsg}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checklists</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 / 8</div>
            <p className="text-xs text-muted-foreground">
              Ouverture du jour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fiches techniques</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fiches.length || 8}</div>
            <p className="text-xs text-muted-foreground">
              Disponibles en formation
            </p>
          </CardContent>
        </Card>
      </div>

      {isAdmin && <SessionMediaAdmin />}
    </div>
  );
}
