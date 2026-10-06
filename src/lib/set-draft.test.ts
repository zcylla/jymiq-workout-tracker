import assert from 'node:assert/strict';
import { test } from 'node:test';

import { applyDraft, draftPatch } from './set-draft.ts';

const stored = { weightKg: 100, reps: 5, rpe: null };

test('no draft leaves the stored values and an empty patch', () => {
  assert.deepEqual(applyDraft(stored, null), stored);
  assert.deepEqual(draftPatch(stored, null), {});
  assert.deepEqual(draftPatch(stored, {}), {});
});

test('draft fields are layered over the stored ones', () => {
  assert.deepEqual(applyDraft(stored, { reps: 6 }), { weightKg: 100, reps: 6, rpe: null });
  assert.deepEqual(applyDraft(stored, { weightKg: 0 }), { weightKg: 0, reps: 5, rpe: null });
});

test('a field equal to the stored value is not part of the patch', () => {
  assert.deepEqual(draftPatch(stored, { weightKg: 100, reps: 5 }), {});
});

test('only the changed fields are in the patch', () => {
  assert.deepEqual(draftPatch(stored, { weightKg: 100, reps: 6 }), { reps: 6 });
  assert.deepEqual(draftPatch(stored, { weightKg: 102.5, reps: 6 }), { weightKg: 102.5, reps: 6 });
});

test('weight compares with a float tolerance', () => {
  assert.deepEqual(draftPatch({ ...stored, weightKg: 0.3 }, { weightKg: 0.1 + 0.2 }), {});
  assert.deepEqual(draftPatch(stored, { weightKg: 100.001 }), { weightKg: 100.001 });
});

test('an rpe set from null counts as a change', () => {
  assert.deepEqual(draftPatch(stored, { rpe: 8 }), { rpe: 8 });
  assert.deepEqual(draftPatch({ ...stored, rpe: 8 }, { rpe: 8 }), {});
});

test('a zero weight differs from an unset one', () => {
  assert.deepEqual(draftPatch({ ...stored, weightKg: null }, { weightKg: 0 }), { weightKg: 0 });
});
