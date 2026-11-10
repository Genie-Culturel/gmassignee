import { ProcedureFiche } from '@/lib/database.types';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { FICHE_CATEGORY_LABELS } from '@/lib/constants';
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useFicheImageUrls } from '@/hooks/useFicheImageUrls';
import { displayFicheImageSrc } from '@/lib/ficheImages';

interface FicheViewerProps {
  fiche: ProcedureFiche;
  compact?: boolean;
}

export function FicheViewer({ fiche, compact = false }: FicheViewerProps) {
  const [zoom, setZoom] = useState<string | null>(null);
  const allPaths = useMemo(
    () => fiche.content_steps.flatMap((s) => s.images || []),
    [fiche.content_steps]
  );
  const imageUrls = useFicheImageUrls(allPaths);
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
            <div className="flex-1 min-w-0">
              <div className="text-sm whitespace-pre-line">{step.text}</div>
              {step.images && step.images.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {step.images.map((path, i) => {
                    const url = displayFicheImageSrc(path, imageUrls);
                    if (!url) return null;
                    return (
                      <button
                        key={path + i}
                        type="button"
                        onClick={() => setZoom(url)}
                        className="block overflow-hidden rounded-md border border-border"
                      >
                        <img
                          src={url}
                          alt={`Point ${step.order} – image ${i + 1}`}
                          loading="lazy"
                          draggable={false}
                          className="h-28 max-w-[220px] w-auto object-cover"
                          onError={(e) => {
                            e.currentTarget.style.visibility = 'hidden';
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={zoom !== null} onOpenChange={(open) => !open && setZoom(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl p-2">
          <DialogTitle className="sr-only">Image</DialogTitle>
          {zoom && <img src={zoom} alt="" className="max-h-[85vh] w-full object-contain rounded" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
