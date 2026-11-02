import { Clock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export const SESSION_START_NOTICE =
  "Démarre la session dès ton arrivée au centre (ou au lieu de rendez-vous prédéfini pour Escape Life). L'heure de démarrage sert d'heure d'arrivée du GM et horodate toutes les étapes de la procédure.";

export function SessionStartNotice({ compact = false }: { compact?: boolean }) {
  return (
    <Alert
      className={cn(
        'border-2 border-amber-400 bg-amber-50 text-amber-950 shadow-sm [&>svg]:text-amber-700',
        compact ? 'p-3' : 'p-4 sm:p-5'
      )}
    >
      <Clock className={compact ? 'h-5 w-5' : 'h-6 w-6'} />
      <AlertTitle className={cn('font-bold', compact ? 'text-sm' : 'text-base sm:text-lg')}>
        Démarre à ton arrivée
      </AlertTitle>
      <AlertDescription
        className={cn(
          'text-amber-950/90 leading-snug',
          compact ? 'text-sm font-medium' : 'text-sm sm:text-base font-medium'
        )}
      >
        {SESSION_START_NOTICE}
      </AlertDescription>
    </Alert>
  );
}
