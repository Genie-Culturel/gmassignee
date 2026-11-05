/** Roles that unlock session follow-up + formation editing (not full Lovable admin). */
export const STAFF_ROLES = ['admin', 'formateur_suivi'] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export function isAdminRole(role: string): boolean {
  return role === 'admin';
}

export function isStaffRole(role: string): boolean {
  return role === 'admin' || role === 'formateur_suivi';
}

export function staffFlagsFromRoles(roles: readonly string[]): {
  isAdmin: boolean;
  isFormateur: boolean;
} {
  const isAdmin = roles.some(isAdminRole);
  const isFormateur = isAdmin || roles.some((role) => role === 'formateur_suivi');
  return { isAdmin, isFormateur };
}

/** True when the user may edit fiches / see the Éditeur tab. Admin always counts. */
export function canEditFormations(flags: { isAdmin: boolean; isFormateur: boolean }): boolean {
  return flags.isAdmin || flags.isFormateur;
}
