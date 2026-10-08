import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  BAR_WEIGHTS,
  DEFAULT_INVENTORY,
  DEFAULT_PLATE_COUNTS,
  loadInUnit,
  PLATE_DENOMINATIONS,
  solveInUnit,
  solvePlates,
  weighPlates,
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

test('the bars keep their order and NO BAR comes last', () => {
  assert.deepEqual(BAR_WEIGHTS.kg, [20, 15, 0]);
  assert.deepEqual(BAR_WEIGHTS.lb, [45, 35, 0]);
});

test('100 kg with no bar is 25 + 25 a side', () => {
  const sol = solveInUnit(100, 'kg', 0, DEFAULT_PLATE_COUNTS.kg);
  assert.deepEqual(sol.perSide, [25, 25]);
  assert.equal(sol.achieved, 100);
  assert.equal(sol.residual, 0);
});

test('100 lb with no bar is 45 + 5 a side', () => {
  const sol = solveInUnit(toKg(100, 'lb'), 'lb', 0, DEFAULT_PLATE_COUNTS.lb);
  assert.deepEqual(sol.perSide, [45, 5]);
  assert.equal(sol.achieved, 100);
  assert.equal(sol.residual, 0);
});

test('with no bar the smallest pair of plates is the smallest load', () => {
  const kg = solveInUnit(2.5, 'kg', 0, DEFAULT_PLATE_COUNTS.kg);
  assert.deepEqual(kg.perSide, [1.25]);
  assert.equal(kg.achieved, 2.5);
  const lb = solveInUnit(toKg(5, 'lb'), 'lb', 0, DEFAULT_PLATE_COUNTS.lb);
  assert.deepEqual(lb.perSide, [2.5]);
  assert.equal(lb.achieved, 5);
});

test('with no bar a load below the smallest pair fits nothing and says by how much', () => {
  const kg = solveInUnit(2, 'kg', 0, DEFAULT_PLATE_COUNTS.kg);
  assert.deepEqual(kg.perSide, []);
  assert.equal(kg.achieved, 0);
  assert.equal(kg.residual, 2);
  const lb = solveInUnit(toKg(4, 'lb'), 'lb', 0, DEFAULT_PLATE_COUNTS.lb);
  assert.deepEqual(lb.perSide, []);
  assert.equal(lb.achieved, 0);
  assert.equal(lb.residual, 4);
});

test('with no bar and nothing to load there is nothing to do', () => {
  const sol = solveInUnit(0, 'kg', 0, DEFAULT_PLATE_COUNTS.kg);
  assert.deepEqual(sol.perSide, []);
  assert.equal(sol.achieved, 0);
  assert.equal(sol.residual, 0);
});

test('weighing the plates of a kg load gives the bar plus both sides', () => {
  const w = weighPlates({ 25: 2, 1.25: 1 }, 20);
  assert.equal(w.perSide, 51.25);
  assert.equal(w.total, 122.5);
});

test('weighing pounds', () => {
  const w = weighPlates({ 45: 2, 10: 1, 2.5: 1 }, 45);
  assert.equal(w.perSide, 102.5);
  assert.equal(w.total, 250);
});

test('weighing with no bar is just the two sides', () => {
  assert.deepEqual(weighPlates({ 20: 1 }, 0), { perSide: 20, total: 40 });
  assert.deepEqual(weighPlates({ 45: 1, 5: 1 }, 0), { perSide: 50, total: 100 });
});

test('weighing no plates is just the bar', () => {
  assert.deepEqual(weighPlates({}, 20), { perSide: 0, total: 20 });
  assert.deepEqual(weighPlates({ 25: 0, 20: 0 }, 45), { perSide: 0, total: 45 });
  assert.deepEqual(weighPlates({}, 0), { perSide: 0, total: 0 });
});

test('weighing repeated fractional plates stays exact', () => {
  assert.deepEqual(weighPlates({ 1.25: 3 }, 20), { perSide: 3.75, total: 27.5 });
  assert.deepEqual(weighPlates({ 2.5: 3, 1.25: 7 }, 20), { perSide: 16.25, total: 52.5 });
});

test('weighing rounds float noise to a hundredth', () => {
  assert.deepEqual(weighPlates({ 0.1: 3 }, 0), { perSide: 0.3, total: 0.6 });
  assert.deepEqual(weighPlates({ 0.1: 3, 0.2: 1 }, 0.7), { perSide: 0.5, total: 1.7 });
});

test('weighing what the solver loaded gives back the weight it achieved', () => {
  const tally = (plates: number[]) => {
    const counts: Record<number, number> = {};
    for (const p of plates) counts[p] = (counts[p] ?? 0) + 1;
    return counts;
  };
  for (const unit of ['kg', 'lb'] as const) {
    for (const bar of [...BAR_WEIGHTS[unit]]) {
      for (const load of [0, 12.5, 60, 100, 142.5, 225, 317.5]) {
        const sol = solveInUnit(toKg(load, unit), unit, bar, DEFAULT_PLATE_COUNTS[unit]);
        assert.equal(weighPlates(tally(sol.perSide), bar).total, sol.achieved);
      }
    }
  }
});
