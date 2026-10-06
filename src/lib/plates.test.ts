import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  DEFAULT_INVENTORY,
  DEFAULT_PLATE_COUNTS,
  loadInUnit,
  PLATE_DENOMINATIONS,
  solveInUnit,
  solvePlates,
} from './plates.ts';
import { toKg } from './units.ts';

test('the default kg inventory is the seven plates it always was', () => {
  assert.deepEqual(DEFAULT_INVENTORY.plates, [
    { kg: 25, count: 4 },
    { kg: 20, count: 4 },
    { kg: 15, count: 2 },
    { kg: 10, count: 2 },
    { kg: 5, count: 2 },
    { kg: 2.5, count: 2 },
    { kg: 1.25, count: 2 },
  ]);
});

test('every denomination has a default count', () => {
  for (const unit of ['kg', 'lb'] as const)
    for (const size of PLATE_DENOMINATIONS[unit])
      assert.ok(Number.isInteger(DEFAULT_PLATE_COUNTS[unit][size]));
});

test('kg through the unit path matches the kg solver', () => {
  for (const load of [20, 60, 102.5, 142.5, 197.5]) {
    const a = solveInUnit(load, 'kg', 20, DEFAULT_PLATE_COUNTS.kg);
    const b = solvePlates(load, 20);
    assert.deepEqual(a.perSide, b.perSide);
    assert.equal(a.achieved, b.achievedKg);
    assert.equal(a.residual, b.residualKg);
  }
});

test('225 lb on a 45 lb bar is a pair of 45s a side', () => {
  const sol = solveInUnit(toKg(225, 'lb'), 'lb', 45, DEFAULT_PLATE_COUNTS.lb);
  assert.deepEqual(sol.perSide, [45, 45]);
  assert.equal(sol.achieved, 225);
  assert.equal(sol.residual, 0);
});

test('a stored kilogram load comes back to the pounds that were typed', () => {
  for (const lb of [135, 225, 315, 142.5, 87.5]) assert.equal(loadInUnit(toKg(lb, 'lb'), 'lb'), lb);
});

test('an unreachable lb load reports the pounds it falls short by', () => {
  const sol = solveInUnit(toKg(142.5, 'lb'), 'lb', 45, DEFAULT_PLATE_COUNTS.lb);
  assert.deepEqual(sol.perSide, [45, 2.5]);
  assert.equal(sol.achieved, 140);
  assert.equal(sol.residual, 2.5);
});

test('255 lb on the 45 lb bar is 45 + 45 + 10 + 5 a side', () => {
  const sol = solveInUnit(toKg(255, 'lb'), 'lb', 45, DEFAULT_PLATE_COUNTS.lb);
  assert.deepEqual(sol.perSide, [45, 45, 10, 5]);
  assert.equal(sol.residual, 0);
});

test('limited lb plates fall short and say by how much', () => {
  const counts = { 45: 1, 35: 0, 25: 0, 10: 0, 5: 0, 2.5: 0 };
  const sol = solveInUnit(toKg(315, 'lb'), 'lb', 45, counts);
  assert.deepEqual(sol.perSide, [45]);
  assert.equal(sol.achieved, 135);
  assert.equal(sol.residual, 180);
});

test('a denomination set to zero is never used', () => {
  const counts = { ...DEFAULT_PLATE_COUNTS.lb, 45: 0 };
  const sol = solveInUnit(toKg(135, 'lb'), 'lb', 45, counts);
  assert.ok(!sol.perSide.includes(45));
  assert.deepEqual(sol.perSide, [35, 10]);
  assert.equal(sol.achieved, 135);
});

test('the 35 lb bar loads from its own weight', () => {
  const sol = solveInUnit(toKg(135, 'lb'), 'lb', 35, DEFAULT_PLATE_COUNTS.lb);
  assert.deepEqual(sol.perSide, [45, 5]);
  assert.equal(sol.achieved, 135);
});

test('only the 45 lb bar when nothing is racked', () => {
  const none = { 45: 0, 35: 0, 25: 0, 10: 0, 5: 0, 2.5: 0 };
  const sol = solveInUnit(toKg(225, 'lb'), 'lb', 45, none);
  assert.deepEqual(sol.perSide, []);
  assert.equal(sol.achieved, 45);
  assert.equal(sol.residual, 180);
});

test('a load below the bar loads nothing', () => {
  const sol = solveInUnit(toKg(40, 'lb'), 'lb', 45, DEFAULT_PLATE_COUNTS.lb);
  assert.deepEqual(sol.perSide, []);
  assert.equal(sol.achieved, 45);
});

test('limiting kg plates changes the answer', () => {
  const noTwentyFives = { ...DEFAULT_PLATE_COUNTS.kg, 25: 0 };
  const sol = solveInUnit(100, 'kg', 20, noTwentyFives);
  assert.deepEqual(sol.perSide, [20, 20]);
  assert.equal(sol.achieved, 100);
  const onePairOfTwenties = { ...DEFAULT_PLATE_COUNTS.kg, 25: 0, 20: 1 };
  assert.deepEqual(solveInUnit(100, 'kg', 20, onePairOfTwenties).perSide, [20, 15, 5]);
});
