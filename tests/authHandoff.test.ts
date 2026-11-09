import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  captureAuthHandoff,
  decideHandoffSession,
  emailsMatch,
  parseAuthHandoff,
  persistHandoff,
  readStoredHandoff,
  resetCapturedHandoffForTests,
  resolveCapturedHandoff,
  shouldKeepHandoffSession,
  stripAuthHandoffHref,
} from '../src/lib/authHandoff.ts';

const PAGES = 'https://genie-culturel.github.io/gmassignee/';

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

test('parse: HashRouter query used by Lovable GMDashboard links', () => {
  const href = `${PAGES}#/formation?handoff=1&email=${encodeURIComponent('gm.a@example.com')}`;
  assert.deepEqual(parseAuthHandoff(href), { active: true, email: 'gm.a@example.com' });
});

test('parse: suivi-parties hash route', () => {
  const href = `${PAGES}#/suivi-parties?handoff=1&email=test%40genie-culturel.ch`;
  assert.deepEqual(parseAuthHandoff(href), {
    active: true,
    email: 'test@genie-culturel.ch',
  });
});

test('parse: document search (before hash) also counts', () => {
  const href = `${PAGES}?handoff=1&email=a%40b.ch#/formation`;
  assert.deepEqual(parseAuthHandoff(href), { active: true, email: 'a@b.ch' });
});

test('parse: AdminConsole links without handoff stay inactive', () => {
  assert.deepEqual(parseAuthHandoff(`${PAGES}#/formation`), { active: false, email: '' });
  assert.deepEqual(parseAuthHandoff(`${PAGES}#/suivi-parties`), { active: false, email: '' });
  assert.deepEqual(parseAuthHandoff(PAGES), { active: false, email: '' });
});

test('parse: plus-encoded email round-trips', () => {
  const href = `${PAGES}#/formation?handoff=1&email=${encodeURIComponent('gm+test@example.com')}`;
  assert.equal(parseAuthHandoff(href).email, 'gm+test@example.com');
});

test('parse: handoff=true is active (defensive)', () => {
  const href = `${PAGES}#/formation?handoff=true&email=info%40genieculturel.ch`;
  assert.deepEqual(parseAuthHandoff(href), {
    active: true,
    email: 'info@genieculturel.ch',
  });
});

test('parse: handoff=1 without email is still active (force re-login)', () => {
  assert.deepEqual(parseAuthHandoff(`${PAGES}#/formation?handoff=1`), {
    active: true,
    email: '',
  });
});

test('strip: removes handoff params, keeps route', () => {
  const href = `${PAGES}#/formation?handoff=1&email=a%40b.ch`;
  assert.equal(stripAuthHandoffHref(href), '/gmassignee/#/formation');
});

test('strip: keeps unrelated hash query params', () => {
  const href = `${PAGES}#/formation?handoff=1&email=a%40b.ch&tab=admin`;
  assert.equal(stripAuthHandoffHref(href), '/gmassignee/#/formation?tab=admin');
});

test('strip: document search + hash route', () => {
  const href = `${PAGES}?handoff=1&email=a%40b.ch#/suivi-parties`;
  assert.equal(stripAuthHandoffHref(href), '/gmassignee/#/suivi-parties');
});

test('emailsMatch is case-insensitive', () => {
  assert.equal(emailsMatch('GM@X.ch', 'gm@x.ch'), true);
  assert.equal(emailsMatch('a@b.ch', 'c@d.ch'), false);
});

test('shouldKeepHandoffSession only when emails match', () => {
  assert.equal(shouldKeepHandoffSession('gm.a@example.com', 'gm.a@example.com'), true);
  assert.equal(shouldKeepHandoffSession('julien@x.ch', 'test@x.ch'), false);
  assert.equal(shouldKeepHandoffSession(null, 'test@x.ch'), false);
  assert.equal(shouldKeepHandoffSession('test@x.ch', ''), false);
});

test('decide: SIGNED_IN from session restore with another account is kicked', () => {
  assert.equal(
    decideHandoffSession({
      pending: true,
      passwordLoginRequested: false,
      event: 'SIGNED_IN',
      sessionEmail: 'julien.quinodoz@gmail.com',
      hintEmail: 'info@genieculturel.ch',
    }),
    'kick'
  );
});

test('decide: queued SIGNED_IN restore after kick is still kicked (not a form login)', () => {
  assert.equal(
    decideHandoffSession({
      pending: true,
      passwordLoginRequested: false,
      event: 'SIGNED_IN',
      sessionEmail: 'julien.quinodoz@gmail.com',
      hintEmail: 'info@genieculturel.ch',
    }),
    'kick'
  );
});

test('decide: INITIAL_SESSION of another account is kicked', () => {
  assert.equal(
    decideHandoffSession({
      pending: true,
      passwordLoginRequested: false,
      event: 'INITIAL_SESSION',
      sessionEmail: 'julien.quinodoz@gmail.com',
      hintEmail: 'info@genieculturel.ch',
    }),
    'kick'
  );
});

test('decide: matching restore is kept', () => {
  assert.equal(
    decideHandoffSession({
      pending: true,
      passwordLoginRequested: false,
      event: 'SIGNED_IN',
      sessionEmail: 'info@genieculturel.ch',
      hintEmail: 'info@genieculturel.ch',
    }),
    'accept'
  );
});

test('decide: password form SIGNED_IN is accepted even if e-mail differs', () => {
  assert.equal(
    decideHandoffSession({
      pending: true,
      passwordLoginRequested: true,
      event: 'SIGNED_IN',
      sessionEmail: 'other@genieculturel.ch',
      hintEmail: 'info@genieculturel.ch',
    }),
    'accept'
  );
});

test('decide: no session during handoff shows login', () => {
  assert.equal(
    decideHandoffSession({
      pending: true,
      passwordLoginRequested: false,
      event: 'INITIAL_SESSION',
      sessionEmail: null,
      hintEmail: 'info@genieculturel.ch',
    }),
    'kick'
  );
});

test('decide: without handoff, restored session is left alone', () => {
  assert.equal(
    decideHandoffSession({
      pending: false,
      passwordLoginRequested: false,
      event: 'SIGNED_IN',
      sessionEmail: 'julien.quinodoz@gmail.com',
      hintEmail: '',
    }),
    'passthrough'
  );
});

test('decide: handoff=1 without email never keeps the Pages session', () => {
  assert.equal(
    decideHandoffSession({
      pending: true,
      passwordLoginRequested: false,
      event: 'SIGNED_IN',
      sessionEmail: 'julien.quinodoz@gmail.com',
      hintEmail: '',
    }),
    'kick'
  );
});

test('capture: persists URL handoff so a later stripped URL still remembers it', () => {
  resetCapturedHandoffForTests();
  const storage = memoryStorage();
  const href = `${PAGES}#/formation?handoff=1&email=${encodeURIComponent('info@genieculturel.ch')}`;
  const first = captureAuthHandoff(href, storage);
  assert.deepEqual(first, { active: true, email: 'info@genieculturel.ch' });
  assert.deepEqual(readStoredHandoff(storage), { active: true, email: 'info@genieculturel.ch' });

  const afterStrip = captureAuthHandoff(`${PAGES}#/formation`, storage);
  assert.deepEqual(afterStrip, { active: true, email: 'info@genieculturel.ch' });

  resolveCapturedHandoff(storage);
  resetCapturedHandoffForTests();
  assert.deepEqual(captureAuthHandoff(`${PAGES}#/formation`, storage), {
    active: false,
    email: '',
  });
});

test('persist/read stored handoff JSON', () => {
  const storage = memoryStorage();
  persistHandoff({ active: true, email: 'a@b.ch' }, storage);
  assert.deepEqual(readStoredHandoff(storage), { active: true, email: 'a@b.ch' });
});
