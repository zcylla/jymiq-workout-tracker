import assert from 'node:assert/strict';
import { test } from 'node:test';

import { toggleExerciseSelection } from './exercise-selection.ts';

test('selecting exercises preserves tap order without changing the input', () => {
  const selection = ['squat', 'bench'];
  assert.deepEqual(toggleExerciseSelection(selection, 'row'), ['squat', 'bench', 'row']);
  assert.deepEqual(selection, ['squat', 'bench']);
  assert.deepEqual(toggleExerciseSelection([], 'squat'), ['squat']);
});

test('deselecting closes the order gap and reselecting appends at the end', () => {
  const selection = ['squat', 'bench', 'row'];
  const remaining = toggleExerciseSelection(selection, 'bench');
  assert.deepEqual(remaining, ['squat', 'row']);
  assert.deepEqual(toggleExerciseSelection(remaining, 'bench'), ['squat', 'row', 'bench']);
  assert.deepEqual(selection, ['squat', 'bench', 'row']);
  assert.deepEqual(toggleExerciseSelection(['squat'], 'squat'), []);
});
