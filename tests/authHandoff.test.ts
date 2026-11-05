import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  emailsMatch,
  parseAuthHandoff,
  shouldKeepHandoffSession,
  stripAuthHandoffHref,
} from '../src/lib/authHandoff.ts';

const PAGES = 'https://genie-culturel.github.io/gmassignee/';

test('parse: HashRouter query used by Lovable links', () => {
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

test('parse: no handoff keeps inactive so a direct visit keeps the session', () => {
  assert.deepEqual(parseAuthHandoff(`${PAGES}#/formation`), { active: false, email: '' });
  assert.deepEqual(parseAuthHandoff(`${PAGES}#/dashboard`), { active: false, email: '' });
  assert.deepEqual(parseAuthHandoff(PAGES), { active: false, email: '' });
});

test('parse: plus-encoded email round-trips', () => {
  const href = `${PAGES}#/formation?handoff=1&email=${encodeURIComponent('gm+test@example.com')}`;
  assert.equal(parseAuthHandoff(href).email, 'gm+test@example.com');
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
