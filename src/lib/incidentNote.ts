/**
 * Free-text incident note is required when a category is selected and the
 * session has no bug-reporter entries (the same list that feeds « N bug »).
 */
export function isIncidentNoteRequired(
  incidentType: string | null | undefined,
  sessionBugCount: number
): boolean {
  return Boolean(incidentType) && sessionBugCount <= 0;
}
