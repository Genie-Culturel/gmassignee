import { useEffect, useRef, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { ProcedureFiche } from '@/lib/database.types';
import { FICHE_CATEGORY_LABELS, FORMATION_PAGE_CATEGORIES } from '@/lib/constants';
import { sortFichesByOrder, sortOrderUpdatesForVisibleReorder } from '@/lib/training';
import { reorderFiches } from '@/lib/trainingRepository';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { groupFichesBySubGroup } from '@/lib/ficheSubGroups';
import { FinePointerSensor } from '@/lib/dndSensors';

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
  const [error, setError] = useState<string | null>(null);

  // Réordonne au sein d'une sous-catégorie : on réutilise les sort_order existants du groupe.
  const applyOrder = async (groupIds: string[], orderedIds: string[]) => {
    const visible = sortFichesByOrder(fiches.filter((fiche) => groupIds.includes(fiche.id)));
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

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium">Ordre d’affichage</p>
        <p className="text-xs text-muted-foreground">
          Glisser une fiche pour la déplacer. Sur mobile, rester appuyé un instant puis glisser.
          Enregistré tout de suite.
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
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {FICHE_CATEGORY_LABELS[category]}
            </p>
            {groupFichesBySubGroup(rows).map((group) => (
              <CategoryOrderList
                key={`${category}-${group.value ?? 'general'}`}
                title={group.label}
                rows={group.fiches}
                selectedId={selectedId}
                onSelect={onSelect}
                onApply={async (ids) => {
                  try {
                    await applyOrder(
                      group.fiches.map((fiche) => fiche.id),
                      ids
                    );
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Ordre non enregistré');
                  }
                }}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

function CategoryOrderList({
  title,
  rows,
  selectedId,
  onSelect,
  onApply,
}: {
  title: string;
  rows: ProcedureFiche[];
  selectedId: string;
  onSelect: (id: string) => void;
  onApply: (orderedIds: string[]) => Promise<void>;
}) {
  const [ids, setIds] = useState(rows.map((fiche) => fiche.id));
  const [activeId, setActiveId] = useState<string | null>(null);
  const skipClickRef = useRef(false);
  const rowSignature = rows.map((fiche) => fiche.id).join('\0');

  useEffect(() => {
    setIds(rowSignature.split('\0').filter(Boolean));
  }, [rowSignature]);

  // PointerSensor ignores touch so TouchSensor can keep a 200 ms press delay (scroll stays usable).
  const sensors = useSensors(
    useSensor(FinePointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const byId = new Map(rows.map((fiche) => [fiche.id, fiche]));
  const activeFiche = activeId ? byId.get(activeId) : undefined;

  const onDragStart = (event: DragStartEvent) => {
    skipClickRef.current = true;
    setActiveId(String(event.active.id));
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const overId = event.over?.id;
    if (!overId) return;
    const from = ids.indexOf(String(event.active.id));
    const to = ids.indexOf(String(overId));
    if (from < 0 || to < 0 || from === to) return;
    const next = arrayMove(ids, from, to);
    setIds(next);
    void onApply(next);
  };

  const onDragCancel = () => setActiveId(null);

  return (
    <div className="space-y-1.5 pl-2">
      <p className="pl-1 text-xs font-medium text-muted-foreground">{title}</p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ul className="divide-y rounded-lg border bg-card touch-pan-y">
            {ids.map((id) => {
              const fiche = byId.get(id);
              if (!fiche) return null;
              return (
                <SortableFicheRow
                  key={id}
                  fiche={fiche}
                  selected={selectedId === id}
                  onSelect={() => {
                    if (skipClickRef.current) {
                      skipClickRef.current = false;
                      return;
                    }
                    onSelect(id);
                  }}
                />
              );
            })}
          </ul>
        </SortableContext>
        <DragOverlay>
          {activeFiche ? <FicheRowPreview fiche={activeFiche} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function SortableFicheRow({
  fiche,
  selected,
  onSelect,
}: {
  fiche: ProcedureFiche;
  selected: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: fiche.id });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        'flex items-start gap-2 px-2 py-2.5 cursor-grab active:cursor-grabbing',
        selected && 'bg-muted/60',
        isDragging && 'opacity-40'
      )}
      {...listeners}
      onClick={onSelect}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        data-order-handle
        className="mt-0.5 shrink-0 rounded p-0.5 text-muted-foreground/60 hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Réordonner ${fiche.title}`}
        {...attributes}
        onClick={(event) => event.stopPropagation()}
      >
        <GripVertical className="h-3.5 w-3.5" aria-hidden />
      </button>
      <span className="min-w-0 flex-1 text-left text-sm font-medium leading-snug">{fiche.title}</span>
    </li>
  );
}

function FicheRowPreview({ fiche }: { fiche: ProcedureFiche }) {
  return (
    <div className="flex items-start gap-2 rounded-md border bg-card px-2 py-2.5 shadow-md">
      <GripVertical className="mt-0.5 h-3.5 w-3.5 text-muted-foreground/60" aria-hidden />
      <span className="text-sm font-medium leading-snug">{fiche.title}</span>
    </div>
  );
}
