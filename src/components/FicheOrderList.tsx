import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, ChevronsUp, GripVertical } from 'lucide-react';
import { FicheCategory, ProcedureFiche } from '@/lib/database.types';
import { FICHE_CATEGORY_LABELS, FORMATION_PAGE_CATEGORIES } from '@/lib/constants';
import { sortFichesByOrder, sortOrderUpdatesForVisibleReorder } from '@/lib/training';
import { reorderFiches } from '@/lib/trainingRepository';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export function FicheOrderList({
  fiches,
  selectedId,
  onSelect,
  onReordered,
}: {
  fiches: ProcedureFiche[];
  selectedId: string;
  onSelect: (id: string) => void;
  onReordered: () => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [desktopDrag, setDesktopDrag] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(pointer: fine)');
    const sync = () => setDesktopDrag(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const applyOrder = async (category: FicheCategory, orderedIds: string[]) => {
    const visible = sortFichesByOrder(fiches.filter((fiche) => fiche.category === category));
    const current = visible.map((fiche) => fiche.id).join('\0');
    if (orderedIds.join('\0') === current) return;
    const updates = sortOrderUpdatesForVisibleReorder(visible, orderedIds);
    const changed = updates.filter((update) => {
      const prev = visible.find((fiche) => fiche.id === update.id);
      return prev && prev.sort_order !== update.sort_order;
    });
    if (!changed.length) return;
    setError(null);
    await reorderFiches(changed);
    onReordered();
  };

  const move = async (fiche: ProcedureFiche, action: 'up' | 'down' | 'first') => {
    const visible = sortFichesByOrder(fiches.filter((row) => row.category === fiche.category));
    const ids = visible.map((row) => row.id);
    const index = ids.indexOf(fiche.id);
    if (index < 0) return;
    if (action === 'up') {
      if (index === 0) return;
      [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
    } else if (action === 'down') {
      if (index >= ids.length - 1) return;
      [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
    } else {
      if (index === 0) return;
      ids.splice(index, 1);
      ids.unshift(fiche.id);
    }
    setBusyId(fiche.id);
    try {
      await applyOrder(fiche.category, ids);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ordre non enregistré');
    } finally {
      setBusyId(null);
    }
  };

  const dropOn = async (target: ProcedureFiche) => {
    if (!draggingId || draggingId === target.id) return;
    const dragged = fiches.find((fiche) => fiche.id === draggingId);
    if (!dragged || dragged.category !== target.category) return;
    const visible = sortFichesByOrder(fiches.filter((fiche) => fiche.category === target.category));
    const from = visible.findIndex((fiche) => fiche.id === draggingId);
    const to = visible.findIndex((fiche) => fiche.id === target.id);
    if (from < 0 || to < 0) return;
    const ids = visible.map((fiche) => fiche.id).filter((id) => id !== draggingId);
    const insertAt = ids.indexOf(target.id) + (from < to ? 1 : 0);
    ids.splice(Math.max(0, insertAt), 0, draggingId);
    setBusyId(draggingId);
    try {
      await applyOrder(target.category, ids);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ordre non enregistré');
    } finally {
      setBusyId(null);
      setDraggingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium">Ordre d’affichage</p>
        <p className="text-xs text-muted-foreground">
          Enregistré tout de suite. Sur ordinateur, glisser la poignée ; sur mobile, utiliser les
          flèches.
        </p>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {FORMATION_PAGE_CATEGORIES.map((category) => {
        const rows = sortFichesByOrder(fiches.filter((fiche) => fiche.category === category));
        if (!rows.length) return null;
        return (
          <div key={category} className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{FICHE_CATEGORY_LABELS[category]}</p>
            <ul className="divide-y rounded-lg border bg-card">
              {rows.map((fiche, index) => {
                const busy = busyId === fiche.id;
                return (
                  <li
                    key={fiche.id}
                    draggable={desktopDrag}
                    onDragStart={(event) => {
                      const target = event.target as HTMLElement;
                      if (target.closest('button')) {
                        event.preventDefault();
                        return;
                      }
                      setDraggingId(fiche.id);
                      event.dataTransfer.setData('text/plain', fiche.id);
                      event.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => setDraggingId(null)}
                    onDragOver={(event) => {
                      if (draggingId && draggingId !== fiche.id) event.preventDefault();
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      void dropOn(fiche);
                    }}
                    className={cn(
                      'flex flex-col gap-2 px-2 py-2 sm:flex-row sm:items-center',
                      selectedId === fiche.id && 'bg-muted/60',
                      draggingId === fiche.id && 'opacity-50'
                    )}
                  >
                    <div className="flex min-w-0 items-start gap-1">
                      <span
                        className="mt-1 hidden shrink-0 cursor-grab text-muted-foreground sm:inline-flex"
                        aria-hidden
                      >
                        <GripVertical className="h-4 w-4" />
                      </span>
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left text-sm font-medium leading-snug"
                        onClick={() => onSelect(fiche.id)}
                      >
                        {fiche.title}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1 sm:shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="min-h-11 min-w-11"
                        disabled={busy || index === 0}
                        aria-label="Monter"
                        onClick={() => void move(fiche, 'up')}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="min-h-11 min-w-11"
                        disabled={busy || index === rows.length - 1}
                        aria-label="Descendre"
                        onClick={() => void move(fiche, 'down')}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-11"
                        disabled={busy || index === 0}
                        aria-label="Mettre en premier"
                        onClick={() => void move(fiche, 'first')}
                      >
                        <ChevronsUp className="mr-1 h-4 w-4" />
                        <span className="sm:hidden">Premier</span>
                        <span className="hidden sm:inline">Mettre en premier</span>
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
