import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { isMockMode } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { SessionMediaAdmin } from '@/components/SessionMediaAdmin';

export function Dashboard() {
  const { user, displayName, isFormateur } = useAuth();

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Historique des sessions</h1>
        <p className="text-muted-foreground mt-2">
          Vue d'ensemble de tes activités
          {!isMockMode ? ` · ${user?.email || displayName}` : ''}
          {isFormateur && !isMockMode ? ' · Toutes les sessions' : ''}
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

      {isFormateur && <SessionMediaAdmin />}
    </div>
  );
}
