import { ReactNode, useEffect, useRef, useState } from 'react';
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
import { FileText, GripVertical, Plus, Trash2, X } from 'lucide-react';
import { ProcedureFiche } from '@/lib/database.types';
import { isFicheDeleted } from '@/lib/training';
import { useStepFiches } from '@/hooks/useStepFiches';
import { FinePointerSensor } from '@/lib/dndSensors';
import { ParcoursStep, parcoursForLocationSlug } from '@/lib/parcours';
import {
  addParcoursStep,
  deleteParcoursStep,
  linkStepFiche,
  reorderParcoursSteps,
  unlinkStepFiche,
  updateParcoursStep,
} from '@/lib/parcoursRepository';
import { DEMO_LOCATIONS, VenueCatalog, findGame } from '@/lib/venues';
import { useParcoursList } from '@/hooks/useParcoursList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/** Fiches that make sense for a location: global, scoped to the location, or to one of its games. */
function candidateFiches(fiches: ProcedureFiche[], catalog: VenueCatalog, locationSlug: string): ProcedureFiche[] {
  const location = catalog.locations.find((item) => item.slug === locationSlug);
  const gameIds = new Set(catalog.games.filter((game) => game.location_id === location?.id).map((game) => game.id));
  return fiches
    .filter((fiche) => fiche.is_active && !isFicheDeleted(fiche))
    .filter((fiche) => {
      const kind = fiche.scope_kind || 'all';
      if (kind === 'all' || !location) return true;
      if (kind === 'locations') return (fiche.scope_location_ids || []).includes(location.id);
      return (fiche.scope_game_ids || []).some((id) => gameIds.has(id));
    })
    .sort((a, b) => a.title.localeCompare(b.title, 'fr'));
}

export function ParcoursAdmin({
  catalog,
  fiches,
  filterGameId,
}: {
  catalog: VenueCatalog;
  fiches: ProcedureFiche[];
  filterGameId: string;
}) {
  const { parcoursList, isLoading, error: loadError, reload } = useParcoursList();
  const locations = catalog.locations.length ? catalog.locations : DEMO_LOCATIONS;
  const filterGame = findGame(catalog, filterGameId);
  const filterLocationSlug = catalog.locations.find((location) => location.id === filterGame?.location_id)?.slug;
  const [locationSlug, setLocationSlug] = useState(filterLocationSlug || 'vr_center');
  const [newLabel, setNewLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<ParcoursStep | null>(null);

  useEffect(() => {
    if (filterLocationSlug) setLocationSlug(filterLocationSlug);
  }, [filterLocationSlug]);

  const parcours = parcoursForLocationSlug(parcoursList, locationSlug);
  const steps = parcours?.steps || [];
  const { links, reload: reloadLinks } = useStepFiches(parcours?.id);
  const candidates = candidateFiches(fiches, catalog, locationSlug);
  const ficheById = new Map(fiches.map((fiche) => [fiche.id, fiche]));
  const missingFiche = steps.filter((step) => step.is_active && !(links[step.key] || []).length).length;

  const runLink = async (action: () => Promise<void>) => {
    setError(null);
    try {
      await action();
      reloadLinks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lien non enregistré');
    }
  };
  const activeCount = steps.filter((step) => step.is_active).length;

  const run = async (action: () => Promise<void>) => {
    setError(null);
    setBusy(true);
    try {
      await action();
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Modification non enregistrée');
    } finally {
      setBusy(false);
    }
  };

  const addStep = () => {
    const label = newLabel.trim();
    if (!parcours || !label) return;
    const maxOrder = steps.reduce((max, step) => Math.max(max, step.sort_order), 0);
    void run(async () => {
      await addParcoursStep(parcours.id, label, maxOrder + 10);
      setNewLabel('');
    });
  };

  return (
    <div className="space-y-4">
      {loadError && (
        <Alert variant="destructive">
          <AlertDescription>
            Erreur de chargement des parcours : {loadError.message}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="parcours-location">Lieu</Label>
        <select
          id="parcours-location"
          className="flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={locationSlug}
          onChange={(e) => setLocationSlug(e.target.value)}
        >
          {locations.map((location) => (
            <option key={location.id} value={location.slug}>
              {location.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : !parcours ? (
        <Alert>
          <AlertDescription>Aucun parcours pour ce lieu.</AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
              {parcours.name}
              {parcours.isProvisional && <Badge variant="secondary">Provisoire</Badge>}
            </CardTitle>
            <CardDescription>
              {activeCount} étape{activeCount > 1 ? 's' : ''} active{activeCount > 1 ? 's' : ''}. Glisser ⋮⋮ pour
              déplacer une étape (sur mobile, rester appuyé puis glisser). Les modifications
              s’enregistrent tout de suite et valent pour les prochaines parties ; les parties déjà
              commencées gardent leurs étapes. « + Lier une fiche » ajoute le bouton « Voir la procédure » à
              l’étape.
              {missingFiche > 0 && (
                <span className="mt-1 block font-medium text-amber-700">
                  {missingFiche} étape{missingFiche > 1 ? 's' : ''} sans fiche.
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-3 sm:p-6 sm:pt-0">
            <StepOrderList
              key={parcours.id}
              steps={steps}
              disabled={busy}
              onReorder={(updates) => void run(() => reorderParcoursSteps(updates))}
              onUpdate={(id, patch) => void run(() => updateParcoursStep(id, patch))}
              onDelete={setToDelete}
              renderFiches={(step) => (
                <StepFichePicker
                  linkedIds={links[step.key] || []}
                  ficheById={ficheById}
                  candidates={candidates}
                  onLink={(ficheId) => void runLink(() => linkStepFiche(parcours.id, step.key, ficheId))}
                  onUnlink={(ficheId) => void runLink(() => unlinkStepFiche(parcours.id, step.key, ficheId))}
                />
              )}
            />
            <div className="flex gap-2">
              <Input
                placeholder="Nouvelle étape (ex. Briefing équipes)"
                value={newLabel}
                maxLength={60}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addStep();
                }}
              />
              <Button type="button" disabled={busy || !newLabel.trim()} onClick={addStep} className="shrink-0">
                <Plus className="mr-1 h-4 w-4" />
                Ajouter
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={Boolean(toDelete)} onOpenChange={(open) => !open && setToDelete(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] bg-background sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer l’étape</DialogTitle>
            <DialogDescription>
              Supprimer « {toDelete?.label} » de ce parcours ? Elle n’apparaîtra plus dans les
              prochaines parties. Les parties déjà enregistrées la gardent.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={() => setToDelete(null)}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={() => {
                const step = toDelete;
                setToDelete(null);
                if (step) void run(() => deleteParcoursStep(step.id));
              }}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type StepPatch = Partial<Pick<ParcoursStep, 'label' | 'hint' | 'note' | 'is_active'>>;

function StepOrderList({
  steps,
  disabled,
  onReorder,
  onUpdate,
  onDelete,
  renderFiches,
}: {
  steps: ParcoursStep[];
  disabled: boolean;
  onReorder: (updates: { id: string; sort_order: number }[]) => void;
  onUpdate: (id: string, patch: StepPatch) => void;
  onDelete: (step: ParcoursStep) => void;
  renderFiches: (step: ParcoursStep) => ReactNode;
}) {
  const signature = steps.map((step) => step.id).join('\0');
  const [ids, setIds] = useState(steps.map((step) => step.id));
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setIds(signature.split('\0').filter(Boolean));
  }, [signature]);

  const sensors = useSensors(
    useSensor(FinePointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const byId = new Map(steps.map((step) => [step.id, step]));
  const activeStep = activeId ? byId.get(activeId) : undefined;

  const onDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));

  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const overId = event.over?.id;
    if (!overId) return;
    const from = ids.indexOf(String(event.active.id));
    const to = ids.indexOf(String(overId));
    if (from < 0 || to < 0 || from === to) return;
    const next = arrayMove(ids, from, to);
    setIds(next);
    const updates = next
      .map((id, index) => ({ id, sort_order: (index + 1) * 10 }))
      .filter((update) => byId.get(update.id)?.sort_order !== update.sort_order);
    onReorder(updates);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ol className="divide-y rounded-lg border bg-card touch-pan-y">
          {ids.map((id, index) => {
            const step = byId.get(id);
            if (!step) return null;
            return (
              <SortableStepRow
                key={id}
                index={index}
                step={step}
                disabled={disabled}
                onUpdate={(patch) => onUpdate(id, patch)}
                onDelete={() => onDelete(step)}
                fichesSlot={renderFiches(step)}
              />
            );
          })}
        </ol>
      </SortableContext>
      <DragOverlay>
        {activeStep ? (
          <div className="flex items-center gap-2 rounded-md border bg-card px-2 py-2.5 shadow-md">
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/60" aria-hidden />
            <span className="text-sm font-medium">{activeStep.label}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function SortableStepRow({
  index,
  step,
  disabled,
  onUpdate,
  onDelete,
  fichesSlot,
}: {
  index: number;
  step: ParcoursStep;
  disabled: boolean;
  onUpdate: (patch: StepPatch) => void;
  onDelete: () => void;
  fichesSlot: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: step.id });
  const [label, setLabel] = useState(step.label);
  const [hint, setHint] = useState(step.hint || '');
  const [note, setNote] = useState(step.note || '');
  const labelRef = useRef(step.label);

  useEffect(() => {
    setLabel(step.label);
    labelRef.current = step.label;
  }, [step.label]);
  useEffect(() => setHint(step.hint || ''), [step.hint]);
  useEffect(() => setNote(step.note || ''), [step.note]);

  const saveLabel = () => {
    const value = label.trim();
    if (!value) {
      setLabel(labelRef.current);
      return;
    }
    if (value !== step.label) onUpdate({ label: value });
  };
  const saveHint = () => {
    const value = hint.trim();
    if (value !== (step.hint || '')) onUpdate({ hint: value || null });
  };
  const saveNote = () => {
    const value = note.trim();
    if (value !== (step.note || '')) onUpdate({ note: value || null });
  };

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('flex items-start gap-2 px-2 py-3', isDragging && 'opacity-40', !step.is_active && 'bg-muted/40')}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        className="mt-2 shrink-0 cursor-grab touch-none rounded p-0.5 text-muted-foreground/60 hover:text-muted-foreground active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Déplacer ${step.label}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" aria-hidden />
      </button>
      <span className="mt-2 w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{index + 1}.</span>
      <div className="min-w-0 flex-1 space-y-1.5">
        <Input
          aria-label="Nom de l’étape"
          value={label}
          maxLength={60}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={saveLabel}
          className={cn('h-9 font-medium', !step.is_active && 'text-muted-foreground line-through')}
        />
        <Textarea
          aria-label="Rappel"
          placeholder="Rappel affiché sous l’étape (optionnel)"
          value={hint}
          rows={2}
          onChange={(e) => setHint(e.target.value)}
          onBlur={saveHint}
          className="min-h-0 text-xs"
        />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Input
            aria-label="Condition"
            placeholder="Condition (ex. Option Vinum)"
            value={note}
            maxLength={40}
            onChange={(e) => setNote(e.target.value)}
            onBlur={saveNote}
            className="h-8 max-w-[14rem] text-xs"
          />
          <label className="flex items-center gap-2 text-xs">
            <Checkbox
              checked={step.is_active}
              disabled={disabled}
              onCheckedChange={(checked) => onUpdate({ is_active: checked === true })}
            />
            Active
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={onDelete}
            className="ml-auto h-8 px-2 text-destructive hover:text-destructive"
            aria-label={`Supprimer ${step.label}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        {fichesSlot}
      </div>
    </li>
  );
}

function StepFichePicker({
  linkedIds,
  ficheById,
  candidates,
  onLink,
  onUnlink,
}: {
  linkedIds: string[];
  ficheById: Map<string, ProcedureFiche>;
  candidates: ProcedureFiche[];
  onLink: (ficheId: string) => void;
  onUnlink: (ficheId: string) => void;
}) {
  const available = candidates.filter((fiche) => !linkedIds.includes(fiche.id));
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {linkedIds.length === 0 && (
          <span className="text-xs text-amber-700">Aucune fiche : pas de bouton « Voir la procédure ».</span>
        )}
        {linkedIds.map((id) => {
          const fiche = ficheById.get(id);
          return (
            <span
              key={id}
              className="inline-flex max-w-full items-center gap-1 rounded-md border bg-muted/50 py-0.5 pl-2 pr-0.5 text-xs"
            >
              <FileText className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
              <span className="truncate">{fiche ? fiche.title : 'Fiche supprimée ou inactive'}</span>
              <button
                type="button"
                onClick={() => onUnlink(id)}
                className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={`Retirer la fiche ${fiche?.title || ''}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          );
        })}
      </div>
      {available.length > 0 && (
        <select
          aria-label="Lier une fiche"
          className="flex h-8 w-full max-w-sm rounded-md border border-input bg-background px-2 text-xs"
          value=""
          onChange={(e) => {
            if (e.target.value) onLink(e.target.value);
          }}
        >
          <option value="">+ Lier une fiche…</option>
          {available.map((fiche) => (
            <option key={fiche.id} value={fiche.id}>
              {fiche.title}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
