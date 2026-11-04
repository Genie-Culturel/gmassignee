import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { BookOpen } from 'lucide-react';
import { ProcedureFiche } from '@/lib/database.types';
import { FicheViewer } from './FicheViewer';

interface FicheButtonProps {
  fiches: ProcedureFiche[];
  label?: string;
}

export function FicheButton({ fiches, label = 'Voir la procédure' }: FicheButtonProps) {
  if (fiches.length === 0) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-44 shrink-0 justify-center gap-1.5 rounded-full border-primary/40 bg-primary/5 px-3 text-xs font-medium text-primary hover:bg-primary/10 hover:text-primary"
        >
          <BookOpen className="h-3.5 w-3.5" />
          {label}
          <span className="ml-0.5 min-w-[1.25rem] rounded-full bg-primary/15 px-1.5 text-center text-[10px] leading-4">{fiches.length}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto pb-0">
        <SheetHeader>
          <SheetTitle>Procédures associées</SheetTitle>
          <SheetDescription>
            {fiches.length} fiche{fiches.length > 1 ? 's' : ''} de référence
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          {fiches.map((fiche) => (
            <div key={fiche.id} className="border-b pb-6 last:border-0">
              <FicheViewer fiche={fiche} />
            </div>
          ))}
        </div>
        <div className="sticky bottom-0 -mx-6 mt-6 border-t bg-background/95 px-6 py-3 backdrop-blur">
          <SheetClose asChild>
            <Button variant="outline" className="w-full">
              Fermer
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
