export const FORMATION_EDITOR_TAB = 'admin';

export const FORMATION_EDITOR_SECTIONS = ['fiches', 'parcours', 'suivi'] as const;
export type FormationEditorSection = (typeof FORMATION_EDITOR_SECTIONS)[number];

export type FormationEditorQuery = {
  editor: FormationEditorSection | null;
  fiche: string | null;
  retour: 'parcours' | null;
  step: string | null;
};

function isEditorSection(value: string | null): value is FormationEditorSection {
  return value !== null && (FORMATION_EDITOR_SECTIONS as readonly string[]).includes(value);
}

function paramsFromSearch(search: string): URLSearchParams {
  const raw = search.startsWith('?') ? search.slice(1) : search;
  return new URLSearchParams(raw);
}

export function parseFormationEditorQuery(search: string): FormationEditorQuery {
  const params = paramsFromSearch(search);
  const editorRaw = params.get('editor');
  return {
    editor: isEditorSection(editorRaw) ? editorRaw : null,
    fiche: params.get('fiche'),
    retour: params.get('retour') === 'parcours' ? 'parcours' : null,
    step: params.get('step'),
  };
}

export function applyFormationEditorQuery(
  search: string,
  patch: {
    tab?: string | null;
    editor?: FormationEditorSection | null;
    fiche?: string | null;
    retour?: 'parcours' | null;
    step?: string | null;
  }
): string {
  const params = paramsFromSearch(search);
  if (patch.tab === null) {
    params.delete('tab');
    params.delete('editor');
    params.delete('fiche');
    params.delete('retour');
    params.delete('step');
  } else if (patch.tab) {
    params.set('tab', patch.tab);
  }
  if (patch.editor === null) params.delete('editor');
  else if (patch.editor) params.set('editor', patch.editor);
  if (patch.fiche === null) params.delete('fiche');
  else if (patch.fiche) params.set('fiche', patch.fiche);
  if (patch.retour === null) params.delete('retour');
  else if (patch.retour) params.set('retour', patch.retour);
  if (patch.step === null) params.delete('step');
  else if (patch.step) params.set('step', patch.step);
  const next = params.toString();
  return next ? `?${next}` : '';
}

export function formationEditorSearch(query?: Partial<FormationEditorQuery>): string {
  return applyFormationEditorQuery('', {
    tab: FORMATION_EDITOR_TAB,
    editor: query?.editor ?? null,
    fiche: query?.fiche ?? null,
    retour: query?.retour ?? null,
    step: query?.step ?? null,
  });
}

export function isFormationEditorPath(pathname: string, search: string): boolean {
  const path = pathname.replace(/^\//, '').split('/')[0] || '';
  if (path !== 'formation') return false;
  return new URLSearchParams(search).get('tab') === FORMATION_EDITOR_TAB;
}

export function formationTabFromSearch(search: string, isFormateur: boolean): string | null {
  if (!isFormateur) return null;
  return new URLSearchParams(search).get('tab') === FORMATION_EDITOR_TAB
    ? FORMATION_EDITOR_TAB
    : null;
}

export function parcoursStepElementId(stepId: string): string {
  return `parcours-step-${stepId}`;
}
