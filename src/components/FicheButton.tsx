import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Info } from 'lucide-react';
import { ProcedureFiche } from '@/lib/database.types';
import { FicheViewer } from './FicheViewer';

interface FicheButtonProps {
  fiches: ProcedureFiche[];
  label?: string;
}

export function FicheButton({ fiches, label = 'Comment faire ?' }: FicheButtonProps) {
  if (fiches.length === 0) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="h-auto py-1 px-2 text-xs">
          <Info className="h-3 w-3 mr-1" />
          {label}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
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
      </SheetContent>
    </Sheet>
  );
}
