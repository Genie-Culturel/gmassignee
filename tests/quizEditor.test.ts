import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertQuizzesBelongToFiche, quizzesBelongingToFiche } from '../src/lib/training.ts';

test('quizzesBelongingToFiche écarte les questions d’une autre fiche', () => {
  const rows = [
    { id: 'q1', fiche_id: 'fiche-a' },
    { id: 'q2', fiche_id: 'fiche-b' },
    { id: 'q3', fiche_id: 'fiche-a' },
  ];
  assert.deepEqual(
    quizzesBelongingToFiche(rows, 'fiche-a').map((row) => row.id),
    ['q1', 'q3']
  );
});

test('assertQuizzesBelongToFiche refuse un mélange (évite d’écrire sur la mauvaise fiche)', () => {
  assert.doesNotThrow(() =>
    assertQuizzesBelongToFiche(
      [
        { fiche_id: 'fiche-a' },
        { fiche_id: 'fiche-a' },
      ],
      'fiche-a'
    )
  );
  assert.throws(
    () =>
      assertQuizzesBelongToFiche(
        [
          { fiche_id: 'fiche-a' },
          { fiche_id: 'fiche-b' },
        ],
        'fiche-a'
      ),
    /ne correspondent pas/
  );
  assert.throws(() => assertQuizzesBelongToFiche([], ''), /ne correspondent pas/);
});
