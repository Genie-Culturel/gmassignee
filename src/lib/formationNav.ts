export const FORMATION_EDITOR_TAB = 'admin';

export function formationEditorSearch(): string {
  return `?tab=${FORMATION_EDITOR_TAB}`;
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
