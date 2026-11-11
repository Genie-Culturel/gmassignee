import assert from 'node:assert/strict';
import { test } from 'node:test';
import { stripDemoQuery } from '../src/lib/demoUrl.ts';

test('stripDemoQuery enlève demo=1 du search et du hash', () => {
  assert.equal(
    stripDemoQuery('http://localhost:8080/?demo=1'),
    'http://localhost:8080/'
  );
  assert.equal(
    stripDemoQuery('http://localhost:8080/?demo=1#/dashboard'),
    'http://localhost:8080/#/dashboard'
  );
  assert.equal(
    stripDemoQuery('http://localhost:8080/#/dashboard?demo=1'),
    'http://localhost:8080/#/dashboard'
  );
  assert.equal(
    stripDemoQuery('http://localhost:8080/#/formation?editor=1&demo=1'),
    'http://localhost:8080/#/formation?editor=1'
  );
  assert.equal(
    stripDemoQuery('http://localhost:8080/#/dashboard'),
    'http://localhost:8080/#/dashboard'
  );
});
