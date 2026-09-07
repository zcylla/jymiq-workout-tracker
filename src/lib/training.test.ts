import assert from 'node:assert/strict';
import { test } from 'node:test';

import { estimate1RM, loadForReps, percentOf1RM } from './e1rm.ts';
import { detectSessionVolumePr, detectSetPrs, type PrBaseline } from './pr.ts';
import { DEFAULT_INVENTORY, solvePlates, warmupRamp } from './plates.ts';
import { LOAD_SCALE, RPE_SCALE, indexOf, valueAt } from './scale.ts';
import { elapsedSec, formatClock, formatDuration, formatRest, restRemainingSec } from './time.ts';
import { formatTonnage, setVolume, topSet, totalVolume, type SetLike } from './volume.ts';
import { fromDisplay, roundToStep, toDisplay, weightKey } from './units.ts';

// ---------------------------------------------------------------- e1RM ----
test('e1RM is the weight itself at one rep', () => {
  assert.equal(estimate1RM(100, 1), 100);
  assert.equal(estimate1RM(100, 1, 'brzycki'), 100);
});

test('the two e1RM formulae stay within five percent of each other', () => {
  // They are not interchangeable — Epley reads high under ten reps and low above,
  // crossing at ten — but neither should ever be wildly out from the other, and
  // a switch in Settings must not move a record by a visible amount.
  for (let reps = 1; reps <= 12; reps++) {
    const e = estimate1RM(100, reps)!;
    const b = estimate1RM(100, reps, 'brzycki')!;
    assert.ok(Math.abs(e - b) / e < 0.05, `reps ${reps}: ${e} vs ${b}`);
  }
});

test('e1RM refuses to guess past twelve reps or on nonsense input', () => {
  assert.equal(estimate1RM(100, 13), null);
  assert.equal(estimate1RM(100, 0), null);
  assert.equal(estimate1RM(0, 5), null);
  assert.equal(estimate1RM(100, 5.5), null);
});

test('loadForReps inverts estimate1RM', () => {
  const e1 = estimate1RM(102.5, 8)!;
  assert.ok(Math.abs(loadForReps(e1, 8) - 102.5) < 0.05);
  assert.equal(percentOf1RM(102.5, 130), 79);
});

// -------------------------------------------------------------- volume ----
const s = (weightKg: number, reps: number, extra: Partial<SetLike> = {}): SetLike => ({
  weightKg,
  reps,
  kind: 'working',
  completedAt: 1,
  ...extra,
});

test('volume counts only completed sets and excludes warm-ups', () => {
  const sets = [s(100, 5), s(60, 5, { kind: 'warmup' }), s(100, 5, { completedAt: null })];
  assert.equal(setVolume(sets[0]), 500);
  assert.equal(totalVolume(sets), 500);
  assert.equal(totalVolume(sets, { includeWarmup: true }), 800);
});

test('top set is the heaviest, ties broken by reps', () => {
  assert.equal(topSet([s(100, 5), s(102.5, 3), s(102.5, 8)])!.reps, 8);
  assert.equal(topSet([s(60, 5, { kind: 'warmup' })]), null);
});

test('tonnage switches unit at a tonne', () => {
  assert.equal(formatTonnage(8640), '8.6 T');
  assert.equal(formatTonnage(820), '820 KG');
});

// ------------------------------------------------------------- records ----
const baseline = (over: Partial<PrBaseline> = {}): PrBaseline => ({
  heaviestKg: 100,
  bestE1rmKg: 128,
  bestRepsAtWeight: new Map([[weightKey(100), 8]]),
  bestSetVolumeKg: 800,
  bestSessionVolumeKg: 2900,
  ...over,
});

test('a heavier top set sets heaviest and carries what it beat', () => {
  const hits = detectSetPrs({ weightKg: 102.5, reps: 8, e1rmKg: 130, kind: 'working' }, baseline());
  const heaviest = hits.find((h) => h.category === 'heaviest')!;
  assert.equal(heaviest.value, 102.5);
  assert.equal(heaviest.previous, 100);
  assert.ok(hits.some((h) => h.category === 'best_e1rm'));
  assert.ok(hits.some((h) => h.category === 'best_set_volume'));
});

test('most-reps-at-weight is bucketed by exact weight', () => {
  const hits = detectSetPrs({ weightKg: 100, reps: 9, e1rmKg: 130, kind: 'working' }, baseline());
  const reps = hits.find((h) => h.category === 'most_reps_at_weight')!;
  assert.equal(reps.previous, 8);
  // A weight never lifted before has no previous, and still counts.
  const fresh = detectSetPrs({ weightKg: 97.5, reps: 3, e1rmKg: null, kind: 'working' }, baseline());
  assert.equal(fresh.find((h) => h.category === 'most_reps_at_weight')!.previous, null);
});

test('warm-ups and drop sets never set records, and a null e1RM only skips its category', () => {
  assert.deepEqual(detectSetPrs({ weightKg: 200, reps: 1, e1rmKg: 200, kind: 'warmup' }, baseline()), []);
  assert.deepEqual(detectSetPrs({ weightKg: 200, reps: 1, e1rmKg: 200, kind: 'drop' }, baseline()), []);
  const hits = detectSetPrs({ weightKg: 105, reps: 15, e1rmKg: null, kind: 'working' }, baseline());
  assert.ok(!hits.some((h) => h.category === 'best_e1rm'));
  assert.ok(hits.some((h) => h.category === 'heaviest'));
});

test('session volume record is judged once, at the end', () => {
  assert.equal(detectSessionVolumePr(3100, baseline())!.previous, 2900);
  assert.equal(detectSessionVolumePr(2800, baseline()), null);
});

// -------------------------------------------------------------- plates ----
test('102.5 on a 20 kg bar is 25 + 15 + 1.25 a side', () => {
  // The bug Lab 17 caught: the board showed 20 + 20 + 10 + 2.5 under a label
  // reading 41.25. This test exists so it cannot come back.
  const sol = solvePlates(102.5, 20);
  assert.deepEqual(sol.perSide, [25, 15, 1.25]);
  assert.equal(sol.achievedKg, 102.5);
  assert.equal(sol.residualKg, 0);
});

test('plate maths is not greedy', () => {
  // 25 a side from {20, 15, 10}: greedy takes the 20 and strands 5.
  const inv = { plates: [{ kg: 20, count: 2 }, { kg: 15, count: 2 }, { kg: 10, count: 2 }] };
  const sol = solvePlates(70, 20, inv);
  assert.equal(sol.achievedKg, 70);
  assert.deepEqual(sol.perSide, [15, 10]);
});

test('an unreachable weight reports its residual instead of lying', () => {
  const inv = { plates: [{ kg: 20, count: 2 }] };
  const sol = solvePlates(65, 20, inv);
  assert.equal(sol.achievedKg, 60);
  assert.equal(sol.residualKg, 5);
});

test('an empty bar loads nothing', () => {
  const sol = solvePlates(20, 20, DEFAULT_INVENTORY);
  assert.deepEqual(sol.perSide, []);
  assert.equal(sol.achievedKg, 20);
});

// -------------------------------------------------------------- warm-up ----
test('the warm-up ramp rounds down, skips the bar and never repeats', () => {
  const ramp = warmupRamp(100);
  assert.deepEqual(ramp.map((r) => r.weightKg), [40, 60, 75, 85]);
  assert.deepEqual(ramp.map((r) => r.reps), [5, 3, 2, 1]);
  // A light work set produces fewer steps rather than sub-bar ones.
  assert.deepEqual(warmupRamp(30).map((r) => r.weightKg), [22.5, 25]);
});

// --------------------------------------------------------------- scale ----
test('every load detent is a weight you could load', () => {
  assert.equal(LOAD_SCALE.n, 49);
  assert.equal(valueAt(LOAD_SCALE, 0), 20);
  assert.equal(valueAt(LOAD_SCALE, 48), 140);
  assert.equal(indexOf(LOAD_SCALE, 102.5), 33);
  assert.equal(valueAt(LOAD_SCALE, indexOf(LOAD_SCALE, 102.5)), 102.5);
});

test('scale indices clamp instead of running off the end', () => {
  assert.equal(indexOf(LOAD_SCALE, 5), 0);
  assert.equal(indexOf(LOAD_SCALE, 500), 48);
  assert.equal(RPE_SCALE.n, 10);
});

// ---------------------------------------------------------------- units ----
test('units convert both ways and round to a real increment', () => {
  assert.ok(Math.abs(toDisplay(100, 'lb') - 220.46) < 0.01);
  assert.ok(Math.abs(fromDisplay(220.46, 'lb') - 100) < 0.01);
  assert.equal(toDisplay(100, 'kg'), 100);
  assert.equal(roundToStep(101.3, 2.5), 102.5);
  assert.equal(roundToStep(101.2, 2.5), 100);
  assert.equal(weightKey(102.5), 10250);
});

// ----------------------------------------------------------------- time ----
test('clocks format and rest is derived from wall clock', () => {
  assert.equal(formatClock(3 * 3600 + 7 * 60 + 4), '03:07:04');
  assert.equal(formatDuration(64 * 60), '1H 04');
  assert.equal(formatDuration(28 * 60), '28 MIN');
  assert.equal(formatRest(150), '2:30');
  assert.equal(restRemainingSec(1000, 1000), 0);
  assert.equal(restRemainingSec(91_000, 1_000), 90);
  assert.equal(restRemainingSec(null), 0);
  assert.equal(elapsedSec(0, 0, 65_000), 65);
});
