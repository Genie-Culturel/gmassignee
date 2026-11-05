import { isMockMode, supabase } from './supabase';
import { DEMO_PARCOURS, ParcoursDefinition, ParcoursStep, newStepKey } from './parcours';
import { DEMO_STEP_FICHE_LINKS } from './demoParcoursFiches';

const DEMO_PARCOURS_STORAGE_KEY = 'gmassignee_demo_parcours';

function cloneDemo(): ParcoursDefinition[] {
  return DEMO_PARCOURS.map((parcours) => ({ ...parcours, steps: parcours.steps.map((step) => ({ ...step })) }));
}

function readDemo(): ParcoursDefinition[] {
  try {
    const raw = window.localStorage.getItem(DEMO_PARCOURS_STORAGE_KEY);
    if (!raw) return cloneDemo();
    const parsed = JSON.parse(raw) as ParcoursDefinition[];
    return Array.isArray(parsed) && parsed.length ? parsed : cloneDemo();
  } catch {
    return cloneDemo();
  }
}

function writeDemo(list: ParcoursDefinition[]) {
  try {
    window.localStorage.setItem(DEMO_PARCOURS_STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

function sortSteps(steps: ParcoursStep[]): ParcoursStep[] {
  return [...steps].sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label));
}

function updateDemoStep(id: string, mutate: (step: ParcoursStep) => ParcoursStep | null) {
  const list = readDemo().map((parcours) => ({
    ...parcours,
    steps: parcours.steps
      .map((step) => (step.id === id ? mutate(step) : step))
      .filter((step): step is ParcoursStep => Boolean(step)),
  }));
  writeDemo(list);
}

type ParcoursRow = {
  id: string;
  name: string;
  description: string | null;
  is_provisional: boolean;
  locations: { slug: string } | { slug: string }[] | null;
  parcours_steps: Array<ParcoursStep & { step_key: string; deleted_at: string | null }> | null;
};

/** All parcours with their non-deleted steps. Falls back to the in-code list. */
export async function fetchParcoursList(): Promise<ParcoursDefinition[]> {
  if (isMockMode || !supabase) return readDemo();
  const { data, error } = await supabase
    .from('parcours')
    .select(
      'id, name, description, is_provisional, locations!location_id(slug), parcours_steps(id, parcours_id, step_key, label, hint, note, sort_order, is_active, deleted_at)'
    );
  if (error || !data?.length) {
    if (error) console.warn('Parcours: lecture impossible, parcours intégrés utilisés.', error.message);
    return cloneDemo();
  }
  return (data as unknown as ParcoursRow[]).map((row) => {
    const location = Array.isArray(row.locations) ? row.locations[0] : row.locations;
    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      locationSlug: location?.slug || '',
      isProvisional: row.is_provisional,
      steps: sortSteps(
        (row.parcours_steps || [])
          .filter((step) => !step.deleted_at)
          .map((step) => ({
            id: step.id,
            parcours_id: step.parcours_id,
            key: step.step_key,
            label: step.label,
            hint: step.hint,
            note: step.note,
            sort_order: step.sort_order,
            is_active: step.is_active,
          }))
      ),
    };
  });
}

export async function updateParcoursStep(
  id: string,
  patch: Partial<Pick<ParcoursStep, 'label' | 'hint' | 'note' | 'is_active'>>
) {
  if (isMockMode || !supabase) {
    updateDemoStep(id, (step) => ({ ...step, ...patch }));
    return;
  }
  const { error } = await supabase
    .from('parcours_steps')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(`Étape : ${error.message}`);
}

export async function addParcoursStep(parcoursId: string, label: string, sortOrder: number) {
  const key = newStepKey(parcoursId);
  if (isMockMode || !supabase) {
    const list = readDemo().map((parcours) =>
      parcours.id === parcoursId
        ? {
            ...parcours,
            steps: [
              ...parcours.steps,
              { id: `${parcoursId}:${key}`, parcours_id: parcoursId, key, label, hint: null, note: null, sort_order: sortOrder, is_active: true },
            ],
          }
        : parcours
    );
    writeDemo(list);
    return;
  }
  const { error } = await supabase.from('parcours_steps').insert({
    parcours_id: parcoursId,
    step_key: key,
    label,
    sort_order: sortOrder,
  });
  if (error) throw new Error(`Ajout de l’étape : ${error.message}`);
}

/** Soft delete: past sessions keep their recorded steps (steps_snapshot). */
export async function deleteParcoursStep(id: string) {
  if (isMockMode || !supabase) {
    updateDemoStep(id, () => null);
    return;
  }
  const { error } = await supabase
    .from('parcours_steps')
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq('id', id);
  if (error) throw new Error(`Suppression : ${error.message}`);
}

export async function reorderParcoursSteps(updates: { id: string; sort_order: number }[]) {
  if (!updates.length) return;
  if (isMockMode || !supabase) {
    const byId = new Map(updates.map((update) => [update.id, update.sort_order]));
    writeDemo(
      readDemo().map((parcours) => ({
        ...parcours,
        steps: sortSteps(
          parcours.steps.map((step) =>
            byId.has(step.id) ? { ...step, sort_order: byId.get(step.id)! } : step
          )
        ),
      }))
    );
    return;
  }
  for (const update of updates) {
    const { error } = await supabase
      .from('parcours_steps')
      .update({ sort_order: update.sort_order })
      .eq('id', update.id);
    if (error) throw new Error(`Ordre : ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Step → fiche links (session_step_fiches, keyed by parcours_id + step key)

const DEMO_LINKS_STORAGE_KEY = 'gmassignee_demo_step_fiches';

/** stepKey → fiche ids for one parcours. */
export type StepFicheLinks = Record<string, string[]>;

function readDemoLinks(): Record<string, string[]> {
  try {
    const raw = window.localStorage.getItem(DEMO_LINKS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, string[]>;
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {
    /* ignore */
  }
  return { ...DEMO_STEP_FICHE_LINKS };
}

function writeDemoLinks(links: Record<string, string[]>) {
  try {
    window.localStorage.setItem(DEMO_LINKS_STORAGE_KEY, JSON.stringify(links));
  } catch {
    /* ignore */
  }
}

export async function listStepFicheLinks(parcoursId: string): Promise<StepFicheLinks> {
  if (isMockMode || !supabase) {
    const result: StepFicheLinks = {};
    const prefix = `${parcoursId}:`;
    for (const [key, ids] of Object.entries(readDemoLinks())) {
      if (key.startsWith(prefix)) result[key.slice(prefix.length)] = [...ids];
    }
    return result;
  }
  const { data, error } = await supabase
    .from('session_step_fiches')
    .select('step, fiche_id')
    .eq('parcours_id', parcoursId);
  if (error) throw new Error(`Fiches des étapes : ${error.message}`);
  const result: StepFicheLinks = {};
  for (const row of (data || []) as { step: string; fiche_id: string }[]) {
    (result[row.step] ||= []).push(row.fiche_id);
  }
  return result;
}

export async function linkStepFiche(parcoursId: string, stepKey: string, ficheId: string) {
  if (isMockMode || !supabase) {
    const links = readDemoLinks();
    const key = `${parcoursId}:${stepKey}`;
    links[key] = Array.from(new Set([...(links[key] || []), ficheId]));
    writeDemoLinks(links);
    return;
  }
  const { error } = await supabase
    .from('session_step_fiches')
    .upsert(
      { parcours_id: parcoursId, step: stepKey, fiche_id: ficheId },
      { onConflict: 'parcours_id,step,fiche_id', ignoreDuplicates: true }
    );
  if (error) throw new Error(`Lien fiche : ${error.message}`);
}

export async function unlinkStepFiche(parcoursId: string, stepKey: string, ficheId: string) {
  if (isMockMode || !supabase) {
    const links = readDemoLinks();
    const key = `${parcoursId}:${stepKey}`;
    links[key] = (links[key] || []).filter((id) => id !== ficheId);
    writeDemoLinks(links);
    return;
  }
  const { error } = await supabase
    .from('session_step_fiches')
    .delete()
    .eq('parcours_id', parcoursId)
    .eq('step', stepKey)
    .eq('fiche_id', ficheId);
  if (error) throw new Error(`Lien fiche : ${error.message}`);
}
