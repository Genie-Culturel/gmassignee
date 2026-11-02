import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Clock, FileText } from 'lucide-react';
import { isMockMode } from '@/lib/supabase';

export function Dashboard() {
  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Vue d'ensemble de tes activités
        </p>
      </div>

      {isMockMode && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Mode démo actif - Les données affichées sont des exemples.
            Configure Supabase pour utiliser une vraie base de données.
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
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Aucune session enregistrée
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-ins</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Arrivées enregistrées
            </p>
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
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              Disponibles en formation
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bienvenue dans le module Procédures VR</CardTitle>
          <CardDescription>
            Ce nouveau module remplace les PDF et te permet de suivre les procédures en temps réel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">🎯 Suivi des parties</h3>
            <p className="text-sm text-muted-foreground">
              Mode Session pour accompagner les clients étape par étape, avec pointage d'arrivée et checklists d'ouverture/fermeture.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">📚 Formation technique</h3>
            <p className="text-sm text-muted-foreground">
              Bibliothèque de fiches procédurales (Quest 3, lancement des jeux, dépannage, nettoyage, sécurité).
              Les fiches marquées 🚧 sont à compléter par Julien.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">🔗 Lien entre les deux</h3>
            <p className="text-sm text-muted-foreground">
              Clique sur « Comment faire ? » dans chaque étape pour voir les procédures associées.
              En cas d'incident, la fiche de dépannage s'ouvre automatiquement.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
