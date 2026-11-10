import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ficheImagePublicUrl,
  normalizeFicheImageForStorage,
  normalizeFicheStepImages,
  resolveFicheImageSrc,
  storageKeyFromFicheImage,
} from '../src/lib/ficheImageUrl.ts';

const KEY = 'e3592ebe-1111-4111-8111-aaaaaaaaaaaa/ee7b8de0-2222-4222-8222-bbbbbbbbbbbb.jpg';
const SUPABASE = 'https://dnxyidnkmtrmkxucqrry.supabase.co';
const PUBLIC = `${SUPABASE}/storage/v1/object/public/fiche-images/${KEY}`;

test('storageKeyFromFicheImage : clé brute, URL publique, URL signée', () => {
  assert.equal(storageKeyFromFicheImage(KEY), KEY);
  assert.equal(storageKeyFromFicheImage(` ${KEY} `), KEY);
  assert.equal(storageKeyFromFicheImage(PUBLIC), KEY);
  assert.equal(
    storageKeyFromFicheImage(
      `${SUPABASE}/storage/v1/object/sign/fiche-images/${KEY}?token=abc.def`
    ),
    KEY
  );
  assert.equal(storageKeyFromFicheImage('data:image/jpeg;base64,xxx'), null);
  assert.equal(storageKeyFromFicheImage('https://example.com/photo.jpg'), null);
  assert.equal(storageKeyFromFicheImage('/gmassignee/' + KEY), null);
});

test('normalizeFicheImageForStorage : toujours la clé, jamais une URL signée', () => {
  assert.equal(normalizeFicheImageForStorage(PUBLIC), KEY);
  assert.equal(
    normalizeFicheImageForStorage(
      `${SUPABASE}/storage/v1/object/sign/fiche-images/${KEY}?token=expired`
    ),
    KEY
  );
  assert.equal(normalizeFicheImageForStorage(KEY), KEY);
  assert.equal(normalizeFicheImageForStorage('data:image/png;base64,abc'), 'data:image/png;base64,abc');
  assert.equal(normalizeFicheImageForStorage('../relative.jpg'), null);
});

test('normalizeFicheStepImages déduplique et ignore les chemins relatifs', () => {
  assert.deepEqual(
    normalizeFicheStepImages([KEY, PUBLIC, KEY, '', 'foo/bar.jpg']),
    [KEY, 'foo/bar.jpg']
  );
});

test('resolveFicheImageSrc : clé → URL publique absolue (jamais relative Pages)', () => {
  const src = resolveFicheImageSrc(KEY, (key) => ficheImagePublicUrl(key, SUPABASE));
  assert.equal(src, PUBLIC);
  assert.ok(src.startsWith('https://'));
  assert.equal(
    resolveFicheImageSrc(PUBLIC, (key) => ficheImagePublicUrl(key, SUPABASE)),
    PUBLIC
  );
  assert.equal(resolveFicheImageSrc('data:image/gif;base64,xx', () => 'nope'), 'data:image/gif;base64,xx');
  assert.equal(
    resolveFicheImageSrc('https://cdn.example/x.png', (key) => ficheImagePublicUrl(key, SUPABASE)),
    'https://cdn.example/x.png'
  );
  assert.equal(resolveFicheImageSrc('../oops.jpg', () => 'nope'), '');
});

test('ficheImagePublicUrl encode les segments sans casser les /', () => {
  assert.equal(
    ficheImagePublicUrl('a b/c.jpg', SUPABASE),
    `${SUPABASE}/storage/v1/object/public/fiche-images/a%20b/c.jpg`
  );
});
