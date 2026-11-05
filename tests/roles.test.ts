import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  canEditFormations,
  isStaffRole,
  staffFlagsFromRoles,
} from '../src/lib/roles.ts';

test('admin seul : isAdmin + isFormateur (Éditeur)', () => {
  const flags = staffFlagsFromRoles(['admin']);
  assert.deepEqual(flags, { isAdmin: true, isFormateur: true });
  assert.equal(canEditFormations(flags), true);
});

test('formateur_suivi seul : éditeur sans badge admin', () => {
  const flags = staffFlagsFromRoles(['formateur_suivi']);
  assert.deepEqual(flags, { isAdmin: false, isFormateur: true });
  assert.equal(canEditFormations(flags), true);
});

test('admin + formateur_suivi (2 lignes user_roles) : toujours éditeur', () => {
  const flags = staffFlagsFromRoles(['admin', 'formateur_suivi']);
  assert.deepEqual(flags, { isAdmin: true, isFormateur: true });
});

test('GM sans rôle staff : pas d’éditeur', () => {
  const flags = staffFlagsFromRoles([]);
  assert.deepEqual(flags, { isAdmin: false, isFormateur: false });
  assert.equal(canEditFormations(flags), false);
  assert.equal(isStaffRole('gm'), false);
});

test('isStaffRole couvre admin et formateur_suivi uniquement', () => {
  assert.equal(isStaffRole('admin'), true);
  assert.equal(isStaffRole('formateur_suivi'), true);
  assert.equal(isStaffRole('user'), false);
});
