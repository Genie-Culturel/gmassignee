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

const LABEL = '100 Mo';
const FRIENDLY = 'Fichier trop lourd (max 100 Mo).';

test('SESSION_MEDIA_MAX_* = 100 Mo (104857600) dans sessionMedia.ts', () => {
  const src = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '../src/lib/sessionMedia.ts'),
    'utf8'
  );
  assert.match(src, /SESSION_MEDIA_MAX_BYTES = 100 \* 1024 \* 1024/);
  assert.match(src, /SESSION_MEDIA_MAX_LABEL = '100 Mo'/);
  assert.equal(100 * 1024 * 1024, 104857600);
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
