import { isMockMode, supabase } from './supabase';
import {
  FicheCategory,
  FicheValidation,
  ProcedureFiche,
  QuizChoice,
  QuizQuestionAdmin,
  QuizQuestionPublic,
} from './database.types';
import { mockFiches } from './mockData';
import { DEMO_GM_ID } from './assignedSessions';
import { FORMATION_PAGE_CATEGORIES } from './constants';
import { isFicheDeleted } from './training';
import { DEMO_EXTRA_FICHES, FicheScopeKind } from './venues';
import { DEMO_PARCOURS_FICHES } from './demoParcoursFiches';

export const TRAINING_STORAGE_KEY = 'gmassignee_fiche_validations';

const DEMO_QUIZ: QuizQuestionAdmin[] = [
  {
    id: 'q-pc1-1',
    fiche_id: 'pc-1',
    prompt: 'Où installer le premier groupe à son arrivée ? (exemple)',
    choices: [
      { id: 'lobby', text: "Au lobby (tables d'accueil)" },
      { id: 'salle', text: 'Directement en salle de jeu' },
      { id: 'parking', text: 'Sur le parking' },
    ],
    correct_choice_ids: ['lobby'],
    order_index: 1,
    is_example: true,
  },
  {
    id: 'q-pc1-2',
    fiche_id: 'pc-1',
    prompt: 'Combien de tables de 8 y a-t-il au lobby ? (exemple)',
    choices: [
      { id: '1', text: '1 table' },
      { id: '2', text: '2 tables' },
      { id: '4', text: '4 tables' },
    ],
    correct_choice_ids: ['2'],
    order_index: 2,
    is_example: true,
  },
  {
    id: 'q-malaise-1',
    fiche_id: '3',
    prompt: 'Premier geste si un client se sent mal en VR ? (exemple)',
    choices: [
      { id: 'casque', text: 'Retirer immédiatement le casque' },
      { id: 'continuer', text: 'Le laisser finir la partie' },
      { id: 'eau_casque', text: "Lui donner de l'eau sans retirer le casque" },
    ],
    correct_choice_ids: ['casque'],
    order_index: 1,
    is_example: true,
  },
];

function seedDemoValidations(gmId: string): FicheValidation[] {
  const now = new Date().toISOString();
  return [
    { gm_id: gmId, fiche_id: 'pc-1', version: 1, validated_at: now },
    { gm_id: gmId, fiche_id: 'pc-2', version: 1, validated_at: now },
    { gm_id: gmId, fiche_id: 'pc-3', version: 1, validated_at: now },
    { gm_id: gmId, fiche_id: 'pc-4', version: 1, validated_at: now },
    { gm_id: gmId, fiche_id: 'pc-5', version: 1, validated_at: now },
  ];
}

function readLocalValidations(gmId: string): FicheValidation[] {
  try {
    const raw = window.localStorage.getItem(TRAINING_STORAGE_KEY);
    if (!raw) {
      const seed = seedDemoValidations(gmId);
      window.localStorage.setItem(TRAINING_STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as FicheValidation[];
    return Array.isArray(parsed) ? parsed.filter((row) => row.gm_id === gmId) : seedDemoValidations(gmId);
  } catch {
    return seedDemoValidations(gmId);
  }
}

function writeLocalValidations(gmId: string, rows: FicheValidation[]) {
  try {
    const raw = window.localStorage.getItem(TRAINING_STORAGE_KEY);
    const all = raw ? (JSON.parse(raw) as FicheValidation[]) : [];
    const others = Array.isArray(all) ? all.filter((row) => row.gm_id !== gmId) : [];
    window.localStorage.setItem(TRAINING_STORAGE_KEY, JSON.stringify([...others, ...rows]));
  } catch {
    /* ignore */
  }
}

function defaultDemoScope(fiche: ProcedureFiche): {
  scope_kind: FicheScopeKind;
  scope_location_ids: string[];
  scope_game_ids: string[];
} {
  if (fiche.scope_kind) {
    return {
      scope_kind: fiche.scope_kind,
      scope_location_ids: fiche.scope_location_ids || [],
      scope_game_ids: fiche.scope_game_ids || [],
    };
  }
  const title = fiche.title || '';
  if (/Lancement du Serviteur/i.test(title)) {
    return { scope_kind: 'games', scope_location_ids: [], scope_game_ids: ['game-serviteur'] };
  }
  if (/Lancement de la Planta/i.test(title)) {
    return { scope_kind: 'games', scope_location_ids: [], scope_game_ids: ['game-planta'] };
  }
  if (/Lancement de la Saga/i.test(title)) {
    return { scope_kind: 'games', scope_location_ids: [], scope_game_ids: ['game-saga'] };
  }
  return { scope_kind: 'locations', scope_location_ids: ['loc-vr_center'], scope_game_ids: [] };
}

export function hydrateTrainingFiche(fiche: ProcedureFiche): ProcedureFiche {
  const scope = defaultDemoScope(fiche);
  return {
    ...fiche,
    version: fiche.id === 'pc-1' ? fiche.version ?? 2 : fiche.version ?? 1,
    is_required: fiche.is_required ?? true,
    deleted_at: fiche.deleted_at ?? null,
    sort_order: fiche.sort_order,
    scope_kind: scope.scope_kind,
    scope_location_ids: scope.scope_location_ids,
    scope_game_ids: scope.scope_game_ids,
  };
}

export function toPublicQuestion(q: QuizQuestionAdmin): QuizQuestionPublic {
  return {
    id: q.id,
    fiche_id: q.fiche_id,
    prompt: q.prompt,
    choices: q.choices,
    order_index: q.order_index,
    is_example: q.is_example,
  };
}

export async function listMyValidations(gmId: string): Promise<FicheValidation[]> {
  if (isMockMode || !supabase) return readLocalValidations(gmId);
  const { data, error } = await supabase
    .from('fiche_validations')
    .select('gm_id, fiche_id, version, validated_at')
    .eq('gm_id', gmId);
  if (error) throw new Error(error.message);
  return (data || []) as FicheValidation[];
}

export async function listQuizQuestions(ficheId: string): Promise<QuizQuestionPublic[]> {
  if (isMockMode || !supabase) {
    return loadDemoQuiz().filter((q) => q.fiche_id === ficheId).map(toPublicQuestion);
  }
  const { data, error } = await supabase.rpc('get_quiz_questions', { p_fiche_id: ficheId });
  if (error) throw new Error(error.message);
  return (data || []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    fiche_id: String(row.fiche_id),
    prompt: String(row.prompt),
    choices: (row.choices || []) as QuizChoice[],
    order_index: Number(row.order_index || 0),
    is_example: Boolean(row.is_example),
  }));
}

export async function listQuizQuestionsAdmin(ficheId: string): Promise<QuizQuestionAdmin[]> {
  if (isMockMode || !supabase) {
    return loadDemoQuiz().filter((q) => q.fiche_id === ficheId).map((q) => ({ ...q }));
  }
  const { data, error } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('fiche_id', ficheId)
    .order('order_index');
  if (error) throw new Error(error.message);
  return (data || []) as QuizQuestionAdmin[];
}

function arraysEqual(a: string[], b: string[]): boolean {
  const left = [...a].sort();
  const right = [...b].sort();
  return left.length === right.length && left.every((value, i) => value === right[i]);
}

export async function submitFicheValidation(params: {
  gmId: string;
  fiche: ProcedureFiche;
  confirmed: boolean;
  answers: { question_id: string; choice_ids: string[] }[];
}): Promise<{ ok: boolean; wrong_question_ids?: string[]; error?: string; version?: number }> {
  if (!params.confirmed) return { ok: false, error: 'confirm_required' };

  if (isMockMode || !supabase) {
    const questions = loadDemoQuiz().filter((q) => q.fiche_id === params.fiche.id);
    const wrong: string[] = [];
    for (const question of questions) {
      const given = params.answers.find((a) => a.question_id === question.id)?.choice_ids || [];
      if (!arraysEqual(given, question.correct_choice_ids)) wrong.push(question.id);
    }
    if (wrong.length) return { ok: false, wrong_question_ids: wrong };
    const version = params.fiche.version ?? 1;
    const rows = readLocalValidations(params.gmId);
    const next: FicheValidation = {
      gm_id: params.gmId,
      fiche_id: params.fiche.id,
      version,
      validated_at: new Date().toISOString(),
    };
    const idx = rows.findIndex((row) => row.fiche_id === params.fiche.id);
    if (idx >= 0) rows[idx] = next;
    else rows.push(next);
    writeLocalValidations(params.gmId, rows);
    return { ok: true, version };
  }

  const { data, error } = await supabase.rpc('submit_fiche_validation', {
    p_fiche_id: params.fiche.id,
    p_confirmed: params.confirmed,
    p_answers: params.answers,
  });
  if (error) throw new Error(error.message);
  const result = (data || {}) as {
    ok?: boolean;
    wrong_question_ids?: string[];
    error?: string;
    version?: number;
  };
  return {
    ok: Boolean(result.ok),
    wrong_question_ids: result.wrong_question_ids,
    error: result.error,
    version: result.version,
  };
}

let demoFichesStore: ProcedureFiche[] | null = null;
let demoQuizStore: QuizQuestionAdmin[] | null = null;

function ensureDemoSortOrders(fiches: ProcedureFiche[]) {
  const next: Partial<Record<FicheCategory, number>> = {};
  for (const fiche of fiches) {
    if (typeof fiche.sort_order === 'number') {
      next[fiche.category] = Math.max(next[fiche.category] ?? 0, fiche.sort_order);
    }
  }
  for (const fiche of fiches) {
    if (typeof fiche.sort_order === 'number') continue;
    next[fiche.category] = (next[fiche.category] ?? 0) + 10;
    fiche.sort_order = next[fiche.category];
  }
}

export function loadDemoFiches(): ProcedureFiche[] {
  if (!demoFichesStore) {
    demoFichesStore = [...mockFiches, ...DEMO_EXTRA_FICHES, ...DEMO_PARCOURS_FICHES].map(hydrateTrainingFiche);
    ensureDemoSortOrders(demoFichesStore);
  }
  return demoFichesStore;
}

async function nextSortOrder(category: FicheCategory): Promise<number> {
  if (isMockMode || !supabase) {
    const max = loadDemoFiches()
      .filter((fiche) => fiche.category === category && !isFicheDeleted(fiche))
      .reduce((current, fiche) => Math.max(current, fiche.sort_order ?? 0), 0);
    return max + 10;
  }
  const { data, error } = await supabase
    .from('procedure_fiches')
    .select('sort_order')
    .eq('category', category)
    .is('deleted_at', null)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return ((data as { sort_order?: number } | null)?.sort_order ?? 0) + 10;
}

export async function reorderFiches(
  updates: { id: string; sort_order: number }[]
): Promise<void> {
  const changed = updates.filter((row) => Number.isFinite(row.sort_order));
  if (!changed.length) return;
  if (isMockMode || !supabase) {
    const list = loadDemoFiches();
    for (const update of changed) {
      const row = list.find((fiche) => fiche.id === update.id);
      if (row) row.sort_order = update.sort_order;
    }
    return;
  }
  const results = await Promise.all(
    changed.map((update) =>
      supabase!.from('procedure_fiches').update({ sort_order: update.sort_order }).eq('id', update.id)
    )
  );
  const failed = results.find((result) => result.error);
  if (failed?.error) throw new Error(failed.error.message);
}

function loadDemoQuiz(): QuizQuestionAdmin[] {
  if (!demoQuizStore) demoQuizStore = DEMO_QUIZ.map((q) => ({ ...q }));
  return demoQuizStore;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertLiveIds(ids: string[], kind: 'lieu' | 'jeu') {
  const bad = ids.filter((id) => !UUID_RE.test(id));
  if (bad.length) {
    throw new Error(
      `Identifiants de ${kind} pas encore chargés (${bad.join(', ')}). Réessaie dans une seconde.`
    );
  }
}

async function replaceFicheScope(
  ficheId: string,
  scope: { kind: FicheScopeKind; locationIds: string[]; gameIds: string[] }
) {
  if (!supabase) return;
  await supabase.from('fiche_scope_locations').delete().eq('fiche_id', ficheId);
  await supabase.from('fiche_scope_games').delete().eq('fiche_id', ficheId);
  if (scope.kind === 'locations' && scope.locationIds.length) {
    assertLiveIds(scope.locationIds, 'lieu');
    const { error } = await supabase
      .from('fiche_scope_locations')
      .insert(scope.locationIds.map((location_id) => ({ fiche_id: ficheId, location_id })));
    if (error) throw new Error(error.message);
  }
  if (scope.kind === 'games' && scope.gameIds.length) {
    assertLiveIds(scope.gameIds, 'jeu');
    const { error } = await supabase
      .from('fiche_scope_games')
      .insert(scope.gameIds.map((game_id) => ({ fiche_id: ficheId, game_id })));
    if (error) throw new Error(error.message);
  }
}

function attachScopeFields(
  fiche: ProcedureFiche,
  scope?: { kind: FicheScopeKind; locationIds: string[]; gameIds: string[] }
): ProcedureFiche {
  if (!scope) return fiche;
  return {
    ...fiche,
    scope_kind: scope.kind,
    scope_location_ids: scope.kind === 'locations' ? scope.locationIds : [],
    scope_game_ids: scope.kind === 'games' ? scope.gameIds : [],
  };
}

export async function saveFiche(params: {
  fiche: Partial<ProcedureFiche> & { title: string; category: FicheCategory };
  minorCorrection: boolean;
  scope?: { kind: FicheScopeKind; locationIds: string[]; gameIds: string[] };
}): Promise<ProcedureFiche> {
  const body: Record<string, unknown> = {
    title: params.fiche.title,
    category: params.fiche.category,
    summary: params.fiche.summary ?? null,
    content_steps: params.fiche.content_steps ?? [],
    is_placeholder: params.fiche.is_placeholder ?? false,
    tags: params.fiche.tags ?? [],
    is_active: params.fiche.is_active ?? true,
    is_required: params.fiche.is_required ?? true,
  };
  if (params.scope) body.scope_kind = params.scope.kind;
  // Always explicit so a stale flag from an earlier minor save never blocks a real version bump.
  body.skip_version_bump = params.minorCorrection;

  if (isMockMode || !supabase) {
    const list = loadDemoFiches();
    const now = new Date().toISOString();
    if (params.fiche.id) {
      const idx = list.findIndex((row) => row.id === params.fiche.id);
      const prev = idx >= 0 ? list[idx] : hydrateTrainingFiche(params.fiche as ProcedureFiche);
      const contentChanged =
        params.fiche.title !== prev.title ||
        (params.fiche.summary ?? null) !== (prev.summary ?? null) ||
        JSON.stringify(params.fiche.content_steps ?? []) !== JSON.stringify(prev.content_steps ?? []) ||
        params.fiche.category !== prev.category ||
        (params.fiche.is_required !== false) !== (prev.is_required !== false);
      const version =
        params.minorCorrection || !contentChanged ? (prev.version ?? 1) : (prev.version ?? 1) + 1;
      const sort_order =
        params.fiche.category !== prev.category
          ? await nextSortOrder(params.fiche.category)
          : prev.sort_order;
      const next: ProcedureFiche = attachScopeFields(
        {
          ...prev,
          ...params.fiche,
          id: prev.id,
          version,
          sort_order,
          updated_at: now,
          deleted_at: prev.deleted_at ?? null,
        },
        params.scope
      );
      if (idx >= 0) list[idx] = next;
      else list.push(next);
      return next;
    }
    const created: ProcedureFiche = attachScopeFields(
      {
        id: `demo-fiche-${Date.now()}`,
        category: params.fiche.category,
        title: params.fiche.title,
        summary: params.fiche.summary ?? null,
        content_steps: params.fiche.content_steps ?? [],
        is_placeholder: params.fiche.is_placeholder ?? false,
        tags: params.fiche.tags ?? [],
        is_active: params.fiche.is_active ?? true,
        is_required: params.fiche.is_required ?? true,
        version: 1,
        sort_order: await nextSortOrder(params.fiche.category),
        deleted_at: null,
        created_at: now,
        updated_at: now,
      },
      params.scope
    );
    list.push(created);
    return created;
  }

  if (params.fiche.id) {
    if (params.fiche.category) {
      const { data: current } = await supabase
        .from('procedure_fiches')
        .select('category')
        .eq('id', params.fiche.id)
        .maybeSingle();
      if (current && (current as { category: FicheCategory }).category !== params.fiche.category) {
        body.sort_order = await nextSortOrder(params.fiche.category);
      }
    }
    const { data, error } = await supabase
      .from('procedure_fiches')
      .update(body)
      .eq('id', params.fiche.id)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    if (params.scope) await replaceFicheScope(params.fiche.id, params.scope);
    return attachScopeFields(data as ProcedureFiche, params.scope);
  }
  body.sort_order = await nextSortOrder(params.fiche.category);
  const { data, error } = await supabase.from('procedure_fiches').insert(body).select('*').single();
  if (error) throw new Error(error.message);
  if (params.scope) await replaceFicheScope(data.id, params.scope);
  return attachScopeFields(data as ProcedureFiche, params.scope);
}

export async function saveQuizQuestion(
  question: QuizQuestionAdmin,
  opts?: { skipBump?: boolean }
): Promise<void> {
  if (isMockMode || !supabase) {
    const list = loadDemoQuiz();
    const id = question.id && !question.id.startsWith('new-') ? question.id : `q-demo-${Date.now()}`;
    const next = { ...question, id };
    const idx = list.findIndex((row) => row.id === id);
    const unchanged =
      idx >= 0 &&
      list[idx].prompt === next.prompt &&
      JSON.stringify(list[idx].choices) === JSON.stringify(next.choices) &&
      JSON.stringify(list[idx].correct_choice_ids) === JSON.stringify(next.correct_choice_ids);
    if (idx >= 0) list[idx] = next;
    else list.push(next);
    if (!opts?.skipBump && !unchanged) {
      const fiches = loadDemoFiches();
      const fidx = fiches.findIndex((row) => row.id === question.fiche_id);
      if (fidx >= 0) fiches[fidx] = { ...fiches[fidx], version: (fiches[fidx].version ?? 1) + 1 };
    }
    return;
  }
  const body = {
    fiche_id: question.fiche_id,
    prompt: question.prompt,
    choices: question.choices,
    correct_choice_ids: question.correct_choice_ids,
    order_index: question.order_index,
    is_example: question.is_example,
  };
  if (opts?.skipBump) {
    const { error: skipError } = await supabase
      .from('procedure_fiches')
      .update({ skip_version_bump: true })
      .eq('id', question.fiche_id);
    if (skipError) throw new Error(skipError.message);
  }
  if (question.id && !question.id.startsWith('new-')) {
    const { error } = await supabase.from('quiz_questions').update(body).eq('id', question.id);
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await supabase.from('quiz_questions').insert(body);
  if (error) throw new Error(error.message);
}

export async function clearSkipVersionBump(ficheId: string): Promise<void> {
  if (isMockMode || !supabase) return;
  const { error } = await supabase
    .from('procedure_fiches')
    .update({ skip_version_bump: false })
    .eq('id', ficheId);
  if (error) throw new Error(error.message);
}

export async function deleteFiche(ficheId: string): Promise<void> {
  const now = new Date().toISOString();
  if (isMockMode || !supabase) {
    const list = loadDemoFiches();
    const idx = list.findIndex((row) => row.id === ficheId);
    if (idx >= 0) list[idx] = { ...list[idx], deleted_at: now, updated_at: now };
    return;
  }
  const { error } = await supabase
    .from('procedure_fiches')
    .update({ deleted_at: now })
    .eq('id', ficheId)
    .is('deleted_at', null);
  if (error) throw new Error(error.message);
}

export async function deleteQuizQuestion(id: string): Promise<void> {
  if (isMockMode || !supabase) {
    const list = loadDemoQuiz();
    const idx = list.findIndex((row) => row.id === id);
    if (idx >= 0) list.splice(idx, 1);
    return;
  }
  const { error } = await supabase.from('quiz_questions').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export interface GmTrainingRow {
  gm_id: string;
  display_name: string;
  email: string;
  done: number;
  total: number;
  missing: string[];
  revalidate: string[];
}

export async function listAdminValidations(): Promise<FicheValidation[]> {
  if (isMockMode || !supabase) return [];
  const { data, error } = await supabase
    .from('fiche_validations')
    .select('gm_id, fiche_id, version, validated_at');
  if (error) throw new Error(error.message);
  return (data || []) as FicheValidation[];
}

export async function listGmProfiles(): Promise<{ gm_id: string; display_name: string; email: string }[]> {
  if (isMockMode || !supabase) {
    return [
      { gm_id: DEMO_GM_ID, display_name: 'GM Demo', email: 'demo@local' },
      { gm_id: 'gm-julien', display_name: 'Julien Quinodoz', email: 'julien@genie-culturel.ch' },
      { gm_id: 'gm-aline', display_name: 'Aline', email: 'aline@genie-culturel.ch' },
    ];
  }
  const { data, error } = await supabase.rpc('list_gm_profiles');
  if (error) throw new Error(error.message);
  return (data || []) as { gm_id: string; display_name: string; email: string }[];
}

export function buildTrackingRows(
  profiles: { gm_id: string; display_name: string; email: string }[],
  fiches: ProcedureFiche[],
  validations: FicheValidation[]
): GmTrainingRow[] {
  const required = fiches.filter(
    (fiche) =>
      !isFicheDeleted(fiche) &&
      fiche.is_active &&
      fiche.is_required !== false &&
      FORMATION_PAGE_CATEGORIES.includes(fiche.category)
  );
  return profiles.map((profile) => {
    const mine = validations.filter((row) => row.gm_id === profile.gm_id);
    const byFiche = new Map(mine.map((row) => [row.fiche_id, row]));
    const missing: string[] = [];
    const revalidate: string[] = [];
    let done = 0;
    for (const fiche of required) {
      const row = byFiche.get(fiche.id);
      if (!row) missing.push(fiche.title);
      else if (row.version < (fiche.version ?? 1)) revalidate.push(fiche.title);
      else done += 1;
    }
    return {
      gm_id: profile.gm_id,
      display_name: profile.display_name,
      email: profile.email,
      done,
      total: required.length,
      missing,
      revalidate,
    };
  });
}

export function demoTrackingRows(
  currentGmId: string,
  fiches: ProcedureFiche[],
  myValidations: FicheValidation[]
): GmTrainingRow[] {
  const profiles = [
    { gm_id: currentGmId, display_name: 'GM Demo', email: 'demo@local' },
    { gm_id: 'gm-julien', display_name: 'Julien Quinodoz', email: 'julien@genie-culturel.ch' },
    { gm_id: 'gm-aline', display_name: 'Aline', email: 'aline@genie-culturel.ch' },
  ];
  const required = fiches.filter(
    (fiche) =>
      !isFicheDeleted(fiche) &&
      fiche.is_active &&
      fiche.is_required !== false &&
      FORMATION_PAGE_CATEGORIES.includes(fiche.category)
  );
  const julien: FicheValidation[] = required.map((fiche) => ({
    gm_id: 'gm-julien',
    fiche_id: fiche.id,
    version: fiche.version ?? 1,
    validated_at: new Date().toISOString(),
  }));
  const aline: FicheValidation[] = required.slice(0, 2).map((fiche) => ({
    gm_id: 'gm-aline',
    fiche_id: fiche.id,
    version: fiche.version ?? 1,
    validated_at: new Date().toISOString(),
  }));
  return buildTrackingRows(profiles, fiches, [
    ...myValidations.map((row) => ({ ...row, gm_id: currentGmId })),
    ...julien,
    ...aline,
  ]);
}

export { mockFiches, DEMO_QUIZ };
