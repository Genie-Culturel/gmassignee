import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildSouvenirsMakePayload,
  clientEmailFromActivity,
  firstEmailInText,
  formatSouvenirsExpiry,
  formatSouvenirsSessionDate,
  formatSouvenirsSessionLabel,
  formatSouvenirsSessionTime,
  isClientEmail,
  reservationDetailsText,
  sanitizeDropboxLabel,
} from '../src/lib/souvenirsMake.ts';

/** Same shape as Lovable `activities.description` (Make → EventDescriptionFormatter). */
const SERVEUR_DESCRIPTION = `8 réservées, 0 disponibles
Halle(s): halle 1
-----
22611027087466
Le Serviteur de la rédemption I ou 2 - Halle 1
8 personnes
lundi, 9 novembre 2026 12:00
Joelle Deburaux
joelle@solalex.ch
079 509 20 04 (portable)
Gryon Vaud 1882
Switzerland
Google
Une entreprise
Prix total: 416 CHF
Acompte: 416 CHF
Versé: 416 CHF
Total dû: 0 CHF
no voucher`;

test('sessionLabel : jeu + date + heure au format Dropbox', () => {
  assert.equal(
    formatSouvenirsSessionLabel('La Bataille de la Planta', '2026-11-09', '14:30'),
    'La Bataille de la Planta 09.11.2026 14h30'
  );
});

test('sessionLabel : strip slash et deux-points du nom de jeu', () => {
  assert.equal(
    formatSouvenirsSessionLabel('Jeu / secret:test', '2026-11-09', '09:05'),
    'Jeu secret test 09.11.2026 09h05'
  );
});

test('heure : 14:30 et 14.30 deviennent 14h30', () => {
  assert.equal(formatSouvenirsSessionTime('14:30'), '14h30');
  assert.equal(formatSouvenirsSessionTime('14.30'), '14h30');
  assert.equal(formatSouvenirsSessionTime('9:05'), '09h05');
});

test('date session YYYY-MM-DD → dd.mm.yyyy', () => {
  assert.equal(formatSouvenirsSessionDate('2026-11-09'), '09.11.2026');
});

test('expiresAt ISO → dd.mm.yyyy Zurich', () => {
  assert.equal(formatSouvenirsExpiry('2026-11-23T12:00:00.000Z'), '23.11.2026');
});

test('sanitizeDropboxLabel retire les caractères interdits', () => {
  assert.equal(sanitizeDropboxLabel('A\\B/C:D*E?F"G<H>I|J#K'), 'A B C D E F G H I J K');
});

test('isClientEmail', () => {
  assert.equal(isClientEmail('client@vrcenter.ch'), true);
  assert.equal(isClientEmail('  a@b.ch '), true);
  assert.equal(isClientEmail('pas-un-email'), false);
  assert.equal(isClientEmail(''), false);
});

test('payload Make : champs exacts et exemple', () => {
  const payload = buildSouvenirsMakePayload({
    clientEmail: 'marie.dupont@example.ch',
    souvenirLink: 'https://genie-culturel.github.io/gmassignee/souvenirs/?token=6dfb4599-19c0-46f8-acf7-b8494e9f51f8',
    sessionId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    game: 'La Bataille de la Planta',
    date: '2026-11-09',
    time: '14:30',
    gmName: 'Aino',
    expiresAtIso: '2026-11-23T12:00:00.000Z',
    files: [
      {
        url: 'https://dnxyidnkmtrmkxucqrry.supabase.co/storage/v1/object/sign/session-media/sess/clip.mp4?token=signed',
        name: 'IMG_0001.MOV',
      },
    ],
  });
  assert.deepEqual(Object.keys(payload), [
    'clientEmail',
    'souvenirLink',
    'sessionId',
    'sessionLabel',
    'gmName',
    'expiresAt',
    'files',
  ]);
  assert.equal(payload.sessionLabel, 'La Bataille de la Planta 09.11.2026 14h30');
  assert.equal(payload.expiresAt, '23.11.2026');
  assert.equal(payload.files[0].name, 'IMG_0001.MOV');
  assert.ok(payload.files[0].url.includes('/object/sign/'));
});

test('clientEmailFromActivity lit client_email puis email', () => {
  assert.equal(clientEmailFromActivity({ client_email: 'a@b.ch' }), 'a@b.ch');
  assert.equal(clientEmailFromActivity({ email: 'groupe@example.com' }), 'groupe@example.com');
  assert.equal(clientEmailFromActivity({ client: { email: 'nested@x.ch' } }), 'nested@x.ch');
  assert.equal(clientEmailFromActivity({ title: 'Saga [6]' }), undefined);
  assert.equal(clientEmailFromActivity({ email: 'not-an-email' }), undefined);
});

test('e-mail dans Détails de la réservation (description Make / Lovable)', () => {
  assert.equal(clientEmailFromActivity({ description: SERVEUR_DESCRIPTION }), 'joelle@solalex.ch');
  assert.ok(reservationDetailsText(SERVEUR_DESCRIPTION).includes('22611027087466'));
  assert.equal(firstEmailInText(reservationDetailsText(SERVEUR_DESCRIPTION)), 'joelle@solalex.ch');
  assert.equal(
    clientEmailFromActivity({
      description: `Contact interne info@genieculturel.ch\n-----\n22611027087466\nJoelle\njoelle@solalex.ch`,
    }),
    'joelle@solalex.ch'
  );
});

test('e-mail dans description sans séparateur, ou mailto/HTML', () => {
  assert.equal(clientEmailFromActivity({ description: 'Groupe Dupont\nmarie.dupont@example.ch\n079 111 22 33' }), 'marie.dupont@example.ch');
  assert.equal(firstEmailInText('Contact: mailto:joelle@solalex.ch'), 'joelle@solalex.ch');
  assert.equal(firstEmailInText('Écrire à <joelle@solalex.ch>.'), 'joelle@solalex.ch');
});

test('colonne dédiée gagne sur la description', () => {
  assert.equal(
    clientEmailFromActivity({
      client_email: 'prioritaire@vrcenter.ch',
      description: SERVEUR_DESCRIPTION,
    }),
    'prioritaire@vrcenter.ch'
  );
});
