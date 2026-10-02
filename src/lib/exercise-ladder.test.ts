import assert from 'node:assert/strict';
import { test } from 'node:test';

import { closestExerciseRung } from './exercise-ladder.ts';

test('long pressing a rung selects the exercise nearest the finger', () => {
  assert.equal(closestExerciseRung(12.5, 25, 5), 0);
  assert.equal(closestExerciseRung(63, 25, 5), 2);
  assert.equal(closestExerciseRung(110, 25, 5), 4);
});

test('sliding changes selection only after crossing the next rung midpoint', () => {
  assert.equal(closestExerciseRung(24.9, 25, 5), 0);
  assert.equal(closestExerciseRung(25, 25, 5), 1);
  assert.equal(closestExerciseRung(49.9, 25, 5), 1);
  assert.equal(closestExerciseRung(50, 25, 5), 2);
});

test('fingers outside the rail stay on the nearest end exercise', () => {
  assert.equal(closestExerciseRung(-200, 25, 5), 0);
  assert.equal(closestExerciseRung(800, 25, 5), 4);
  assert.equal(closestExerciseRung(800, 25, 1), 0);
});

test('an empty or not yet measured rail has no selection', () => {
  assert.equal(closestExerciseRung(12, 25, 0), -1);
  assert.equal(closestExerciseRung(12, 0, 5), -1);
});

test('selection follows measured row height, including larger text', () => {
  assert.equal(closestExerciseRung(79, 40, 5), 1);
  assert.equal(closestExerciseRung(80, 40, 5), 2);
});
