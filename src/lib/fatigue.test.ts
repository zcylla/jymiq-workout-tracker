import assert from 'node:assert/strict';
import { test } from 'node:test';

import { hardest, loadByMuscle, type MuscleSet, relativeLoad } from './fatigue.ts';

const NOW = 1_800_000_000_000;
const H = 3_600_000;

const set = (over: Partial<MuscleSet> = {}): MuscleSet => ({
  muscle: 'quads',
  role: 'prime',
  kind: 'working',
  weightKg: 100,
  reps: 5,
  completedAt: NOW,
  ...over,
});

test('no sets: empty load, empty list', () => {
  assert.equal(loadByMuscle([], NOW).size, 0);
  assert.deepEqual(hardest([], NOW), []);
  assert.equal(relativeLoad(new Map()).size, 0);
});

test('a prime set now is 1, 48 h ago is 0.5', () => {
  assert.equal(loadByMuscle([set()], NOW).get('quads'), 1);
  assert.equal(loadByMuscle([set({ completedAt: NOW - 48 * H })], NOW).get('quads'), 0.5);
});

test('an assist counts half', () => {
  assert.equal(loadByMuscle([set({ role: 'assist' })], NOW).get('quads'), 0.5);
});

test('warm-ups and unperformed sets are ignored', () => {
  const load = loadByMuscle([set({ kind: 'warmup' }), set({ completedAt: null })], NOW);
  assert.equal(load.size, 0);
});

test('a set older than 7 days is ignored', () => {
  assert.equal(loadByMuscle([set({ completedAt: NOW - 7 * 24 * H - 1 })], NOW).size, 0);
  assert.equal(loadByMuscle([set({ completedAt: NOW - 6 * 24 * H })], NOW).size, 1);
});

test('relative divides by the max; all zero when the max is zero', () => {
  const r = relativeLoad(
    new Map([
      ['a', 4],
      ['b', 1],
    ]),
  );
  assert.equal(r.get('a'), 1);
  assert.equal(r.get('b'), 0.25);
  assert.equal(relativeLoad(new Map([['a', 0]])).get('a'), 0);
});

test('hardest: ordered by decayed load, prime-only set counts, capped at n', () => {
  const sets = [
    set({ muscle: 'chest' }),
    set({ muscle: 'chest' }),
    set({ muscle: 'triceps', role: 'assist' }),
    set({ muscle: 'triceps', role: 'assist' }),
    set({ muscle: 'quads', completedAt: NOW - 48 * H }),
    set({ muscle: 'calves', completedAt: NOW - 144 * H }),
    set({ muscle: 'lats', kind: 'warmup' }),
  ];
  const top = hardest(sets, NOW, 3);
  assert.deepEqual(
    top.map((t) => t.muscle),
    ['chest', 'triceps', 'quads'],
  );
  assert.equal(top[0].name, 'Chest');
  assert.equal(top[0].sets, 2);
  assert.equal(top[0].relative, 1);
  assert.equal(top[1].sets, 0);
  assert.equal(top[1].relative, 0.5);
  assert.equal(hardest(sets, NOW).length, 4);
});
