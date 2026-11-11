import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  isSessionMediaSizeExceededError,
  mapSessionMediaUploadError,
  sessionMediaTooLargeMessage,
} from '../src/lib/sessionMediaErrors.ts';

const LABEL = '50 Mo';
const FRIENDLY = 'Fichier trop lourd (max 50 Mo).';

const root = dirname(fileURLToPath(import.meta.url));

test('SESSION_MEDIA_MAX_* = 50 Mo (52428800) dans sessionMedia.ts', () => {
  const src = readFileSync(join(root, '../src/lib/sessionMedia.ts'), 'utf8');
  assert.match(src, /SESSION_MEDIA_MAX_BYTES = 50 \* 1024 \* 1024/);
  assert.match(src, /SESSION_MEDIA_MAX_LABEL = '50 Mo'/);
  assert.equal(50 * 1024 * 1024, 52428800);
  assert.match(src, /tooLargeMessageFor\(SESSION_MEDIA_MAX_LABEL\)/);
  assert.match(src, /mapUploadError\(error, SESSION_MEDIA_MAX_LABEL\)/);
});

test('l’UI affiche le label et l’astuce 1080p, sans taille en dur', () => {
  const src = readFileSync(join(root, '../src/components/SessionVideos.tsx'), 'utf8');
  assert.match(src, /SESSION_MEDIA_MAX_LABEL/);
  assert.match(src, /sessionMediaTooLargeMessage\(\)/);
  assert.match(
    src,
    /une ou plusieurs vidéos de \{SESSION_MEDIA_MAX_LABEL\} max chacune \(environ 40 secondes\)/
  );
  assert.match(src, /filmées en 1080p plutôt qu[’']en 4K\./);
  assert.doesNotMatch(src, /100 Mo|300 Mo/);
});

test('message trop lourd : une seule formulation, label injecté', () => {
  assert.equal(sessionMediaTooLargeMessage(LABEL), FRIENDLY);
});

test('TUS 413 Maximum size exceeded → message FR', () => {
  const raw = new Error(
    'tus: unexpected response while creating upload, originated from request (method: POST, url: https://example.supabase.co/storage/v1/upload/resumable, response code: 413, response text: Maximum size exceeded, request id: n/a)'
  );
  assert.equal(isSessionMediaSizeExceededError(raw), true);
  assert.equal(mapSessionMediaUploadError(raw, LABEL).message, FRIENDLY);
});

test('originalResponse.getStatus() === 413 → message FR', () => {
  const raw = Object.assign(new Error('upload failed'), {
    originalResponse: {
      getStatus: () => 413,
      getBody: () => 'Maximum size exceeded',
    },
  });
  assert.equal(isSessionMediaSizeExceededError(raw), true);
  assert.equal(mapSessionMediaUploadError(raw, LABEL).message, FRIENDLY);
});

test('mapping idempotent si le message FR est déjà posé', () => {
  const mapped = new Error(FRIENDLY);
  assert.equal(isSessionMediaSizeExceededError(mapped), true);
  assert.equal(mapSessionMediaUploadError(mapped, LABEL).message, FRIENDLY);
});

test('les autres erreurs d’upload ne sont pas réécrites', () => {
  const raw = new Error('Network request failed');
  assert.equal(isSessionMediaSizeExceededError(raw), false);
  assert.equal(mapSessionMediaUploadError(raw, LABEL).message, 'Network request failed');
});
