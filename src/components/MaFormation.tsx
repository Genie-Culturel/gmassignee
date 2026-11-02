import { ProcedureFiche, FicheValidation } from '@/lib/database.types';
import { FORMATION_PAGE_CATEGORIES, FICHE_CATEGORY_ICONS, FICHE_CATEGORY_LABELS } from '@/lib/constants';
import { ficheStatus, progressFor, TRAINING_STATUS_LABELS, validationMap } from '@/lib/training';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GraduationCap } from 'lucide-react';

interface MaFormationProps {
  fiches: ProcedureFiche[];
  validations: FicheValidation[];
  onOpenFiche: (fiche: ProcedureFiche) => void;
}

function statusVariant(status: 'todo' | 'done' | 'revalidate') {
  if (status === 'done') return 'success' as const;
  if (status === 'revalidate') return 'warning' as const;
  return 'secondary' as const;
}

export function MaFormation({ fiches, validations, onOpenFiche }: MaFormationProps) {
  const global = progressFor(fiches, validations);
  const byFiche = validationMap(validations);

  return (
    <div className="space-y-4">
      <Card className="border-primary/40">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <GraduationCap className="h-5 w-5 text-primary" />
            Ma formation
          </CardTitle>
          <CardDescription>
            Tu dois avoir lu et validé toutes les fiches requises. Une mise à jour de procédure
            demande une revalidation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-2xl font-bold tracking-tight">
            {global.done}/{global.total} validées
          </p>
          <Progress value={global.percent} />
          <p className="text-sm text-muted-foreground">
            {global.revalidate > 0
              ? `${global.revalidate} à revalider · ${global.todo} à faire`
              : `${global.todo} à faire`}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        {FORMATION_PAGE_CATEGORIES.map((category) => {
          const stats = progressFor(fiches, validations, category);
          return (
            <Card key={category}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium leading-snug">
                  <span className="mr-1">{FICHE_CATEGORY_ICONS[category]}</span>
                  {FICHE_CATEGORY_LABELS[category]}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-lg font-semibold">
                  {stats.done}/{stats.total} validées
                </p>
                <Progress value={stats.percent} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-3">
        {FORMATION_PAGE_CATEGORIES.map((category) => {
          const rows = fiches.filter(
            (fiche) => fiche.is_active && fiche.is_required !== false && fiche.category === category
          );
          if (!rows.length) return null;
          return (
            <div key={category} className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">
                {FICHE_CATEGORY_ICONS[category]} {FICHE_CATEGORY_LABELS[category]}
              </h3>
              <ul className="divide-y rounded-lg border bg-card">
                {rows.map((fiche) => {
                  const status = ficheStatus(fiche, byFiche.get(fiche.id));
                  return (
                    <li key={fiche.id}>
                      <button
                        type="button"
                        onClick={() => onOpenFiche(fiche)}
                        className="flex w-full items-start justify-between gap-3 px-3 py-3 text-left hover:bg-muted/50"
                      >
                        <span className="min-w-0">
                          <span className="block font-medium leading-snug">{fiche.title}</span>
                          {status === 'revalidate' && (
                            <span className="mt-0.5 block text-xs text-amber-700">
                              Procédure mise à jour — à relire
                            </span>
                          )}
                        </span>
                        <Badge variant={statusVariant(status)} className="shrink-0">
                          {TRAINING_STATUS_LABELS[status]}
                        </Badge>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
