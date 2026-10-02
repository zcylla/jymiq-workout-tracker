import assert from 'node:assert/strict';
import { test } from 'node:test';

import { canCarrySetDefaults, setDefaults } from './set-defaults.ts';

const unset = { loadKg: null, reps: null, rpe: null };
const first = { position: 1, loadKg: 42.5, reps: 8, rpe: 7 };
const last = { position: 2, loadKg: 45, reps: 6, rpe: null };
const history = [first, last];

test('same-session parameters override history', () => {
  const previous = { loadKg: 47.5, reps: 5, rpe: 9 };
  assert.deepEqual(setDefaults(previous, history, 2, null), previous);
});

test('same-session nulls stay unset rather than falling through to history', () => {
  assert.deepEqual(setDefaults(unset, history, 2, null), unset);
});

test('first set uses the first set in the last completed session', () => {
  assert.deepEqual(setDefaults(null, history, 1, null), { loadKg: 42.5, reps: 8, rpe: 7 });
});

test('drafts use history at the same position before anything is logged', () => {
  assert.deepEqual(setDefaults(null, history, 2, null), { loadKg: 45, reps: 6, rpe: null });
});

test('a shorter historical session falls back to its last logged set', () => {
  assert.deepEqual(setDefaults(null, history, 5, null), { loadKg: 45, reps: 6, rpe: null });
});

test('missing historical positions fall back to the last logged set', () => {
  assert.deepEqual(setDefaults(null, [{ ...last, position: 3 }], 1, null), {
    loadKg: 45,
    reps: 6,
    rpe: null,
  });
});

test('no history leaves every parameter unset', () => {
  assert.deepEqual(setDefaults(null, [], 1, null), unset);
});

test('explicit targets override previous parameters per field', () => {
  assert.deepEqual(setDefaults(last, history, 3, { loadKg: 50, reps: 10, rpe: null }), {
    loadKg: 50,
    reps: 10,
    rpe: null,
  });
});

test('null target fields inherit history', () => {
  assert.deepEqual(setDefaults(null, history, 1, { loadKg: null, reps: 12, rpe: null }), {
    loadKg: 42.5,
    reps: 12,
    rpe: 7,
  });
});

test('null target fields inherit same-session nulls as-is', () => {
  assert.deepEqual(setDefaults(unset, history, 2, { loadKg: null, reps: 12, rpe: null }), {
    loadKg: null,
    reps: 12,
    rpe: null,
  });
});

test('partial history preserves known reps and unset load and RPE', () => {
  assert.deepEqual(setDefaults(null, [{ ...unset, position: 1, reps: 10 }], 1, null), {
    loadKg: null,
    reps: 10,
    rpe: null,
  });
});

test('zero load is an explicit target and kilograms are never converted', () => {
  assert.deepEqual(setDefaults(null, history, 1, { loadKg: 0, reps: null, rpe: null }), {
    loadKg: 0,
    reps: 8,
    rpe: 7,
  });
  assert.equal(setDefaults(null, history, 1, null).loadKg, 42.5);
});

test('a non-null RPE target overrides history', () => {
  assert.equal(setDefaults(null, history, 1, { ...unset, rpe: 8 }).rpe, 8);
});

test('an untouched draft can receive repeated automatic carries', () => {
  assert.equal(canCarrySetDefaults({ completedAt: null, createdAt: 100, updatedAt: 100 }), true);
});

test('a future draft edited by the owner cannot be overwritten', () => {
  assert.equal(canCarrySetDefaults({ completedAt: null, createdAt: 100, updatedAt: 101 }), false);
});

test('a logged set cannot receive defaults', () => {
  assert.equal(canCarrySetDefaults({ completedAt: 100, createdAt: 100, updatedAt: 100 }), false);
});

test('perform-again targets preserve the chosen session load and reps, with RPE unset', () => {
  const source = [100, 100, 90].map((loadKg) => ({ loadKg, reps: 5, rpe: null }));
  assert.deepEqual(
    source.map((target, i) => setDefaults(null, [], i + 1, target)),
    source,
  );
});

test('perform-again null targets stay unset without a carry or history baseline', () => {
  assert.deepEqual(setDefaults(null, [], 1, { loadKg: null, reps: 8, rpe: null }), {
    loadKg: null,
    reps: 8,
    rpe: null,
  });
  assert.deepEqual(setDefaults(null, [], 2, { loadKg: 0, reps: null, rpe: null }), {
    loadKg: 0,
    reps: null,
    rpe: null,
  });
});
