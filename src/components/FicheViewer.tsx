import { ProcedureFiche } from '@/lib/database.types';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { FICHE_CATEGORY_LABELS } from '@/lib/constants';

interface FicheViewerProps {
  fiche: ProcedureFiche;
  compact?: boolean;
}

export function FicheViewer({ fiche, compact = false }: FicheViewerProps) {
  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{fiche.title}</h3>
            {fiche.summary && (
              <p className="text-sm text-muted-foreground mt-1">{fiche.summary}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline">
                {FICHE_CATEGORY_LABELS[fiche.category]}
              </Badge>
              {fiche.tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {fiche.is_placeholder && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Cette procédure est incomplète et doit être complétée par un administrateur.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        {fiche.content_steps.map((step, index) => (
          <div
            key={index}
            className="flex gap-3 p-3 rounded-lg bg-muted/50 border border-border"
          >
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              {step.order}
            </div>
            <div className="flex-1 text-sm">{step.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
