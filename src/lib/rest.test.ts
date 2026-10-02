import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as rest from './rest.ts';

const { adjustRestUntil } = rest;

test('extending an expired rest starts from now', () => {
  assert.equal(adjustRestUntil(90_000, 100_000, 30), 130_000);
});

test('extending a running rest adds to its deadline', () => {
  assert.equal(adjustRestUntil(150_000, 100_000, 30), 180_000);
});

test('shortening to or below now ends the rest', () => {
  assert.equal(adjustRestUntil(120_000, 100_000, -30), null);
  assert.equal(adjustRestUntil(130_000, 100_000, -30), null);
  assert.equal(adjustRestUntil(90_000, 100_000, -30), null);
});

test('shortening a running rest subtracts from its deadline', () => {
  assert.equal(adjustRestUntil(150_000, 100_000, -30), 120_000);
});

test('an absent rest stays absent', () => {
  assert.equal(adjustRestUntil(null, 100_000, 30), null);
  assert.equal(adjustRestUntil(null, 100_000, -30), null);
});

test('a new rest starts full and drains linearly to its deadline', () => {
  const sweep = rest.updateRestSweep(null, 190_000, 1, 100_000);
  assert.equal(rest.restProgress(sweep, 100_000), 1);
  assert.equal(rest.restProgress(sweep, 122_500), 0.75);
  assert.equal(rest.restProgress(sweep, 145_000), 0.5);
  assert.equal(rest.restProgress(sweep, 190_000), 0);
});

test('a resumed rest starts full at its current remaining time', () => {
  const sweep = rest.updateRestSweep(null, 190_000, 4, 160_000);
  assert.equal(rest.restProgress(sweep, 160_000), 1);
  assert.equal(rest.restProgress(sweep, 175_000), 0.5);
  assert.equal(rest.restProgress(sweep, 190_000), 0);
});

test('an extension grows the span and the remaining fill without restarting', () => {
  const sweep = rest.updateRestSweep(null, 190_000, 1, 100_000);
  const extended = rest.updateRestSweep(sweep, 220_000, 1, 160_000);
  assert.equal(extended.spanMs, 120_000);
  assert.equal(rest.restProgress(sweep, 160_000), 1 / 3);
  assert.equal(rest.restProgress(extended, 160_000), 0.5);
  assert.equal(rest.restProgress(extended, 190_000), 0.25);
  assert.equal(rest.restProgress(extended, 220_000), 0);
});

test('repeated extensions add each deadline delta exactly once', () => {
  const sweep = rest.updateRestSweep(null, 190_000, 1, 100_000);
  const first = rest.updateRestSweep(sweep, 220_000, 1, 160_000);
  const repeated = rest.updateRestSweep(first, 220_000, 1, 170_000);
  const second = rest.updateRestSweep(repeated, 250_000, 1, 190_000);
  assert.equal(repeated.spanMs, 120_000);
  assert.equal(second.spanMs, 150_000);
  assert.equal(rest.restProgress(second, 190_000), 0.4);
});

test('a shorter new rest replaces the old span and starts full', () => {
  const sweep = rest.updateRestSweep(null, 280_000, 1, 100_000);
  const next = rest.updateRestSweep(sweep, 220_000, 2, 160_000);
  assert.equal(next.spanMs, 60_000);
  assert.equal(rest.restProgress(next, 160_000), 1);
  assert.equal(rest.restProgress(next, 190_000), 0.5);
});

test('a longer new rest resets full even when its delta looks like +30s', () => {
  const sweep = rest.updateRestSweep(null, 190_000, 1, 100_000);
  const next = rest.updateRestSweep(sweep, 220_000, 2, 160_000);
  assert.equal(next.spanMs, 60_000);
  assert.equal(rest.restProgress(next, 160_000), 1);
});

test('logging a set resets full even if the new deadline is unchanged', () => {
  const sweep = rest.updateRestSweep(null, 190_000, 1, 100_000);
  const next = rest.updateRestSweep(sweep, 190_000, 2, 160_000);
  const extended = rest.updateRestSweep(next, 220_000, 2, 160_000);
  assert.equal(rest.restProgress(next, 160_000), 1);
  assert.equal(extended.spanMs, 60_000);
  assert.equal(rest.restProgress(extended, 160_000), 1);
});

test('a deadline arriving before the logged-set count still resets full', () => {
  const sweep = rest.updateRestSweep(null, 190_000, 1, 100_000);
  const deadlineFirst = rest.updateRestSweep(sweep, 220_000, 1, 160_000);
  const next = rest.updateRestSweep(deadlineFirst, 220_000, 2, 160_000);
  assert.equal(next.spanMs, 60_000);
  assert.equal(rest.restProgress(next, 160_000), 1);
});

test('a logged-set count arriving before a shorter deadline leaves no stale span', () => {
  const sweep = rest.updateRestSweep(null, 280_000, 1, 100_000);
  const countFirst = rest.updateRestSweep(sweep, 280_000, 2, 160_000);
  const next = rest.updateRestSweep(countFirst, 220_000, 2, 160_000);
  assert.equal(next.spanMs, 60_000);
  assert.equal(rest.restProgress(next, 160_000), 1);
});

test('undoing or deleting a logged set does not restart the rest', () => {
  const sweep = rest.updateRestSweep(null, 190_000, 2, 100_000);
  const reduced = rest.updateRestSweep(sweep, 190_000, 1, 160_000);
  assert.equal(rest.restProgress(reduced, 160_000), 1 / 3);
  const relogged = rest.updateRestSweep(reduced, 220_000, 2, 160_000);
  assert.equal(rest.restProgress(relogged, 160_000), 1);
});

test('shortening a rest keeps its elapsed portion instead of restarting', () => {
  const sweep = rest.updateRestSweep(null, 190_000, 1, 100_000);
  const shortened = rest.updateRestSweep(sweep, 160_000, 1, 130_000);
  assert.equal(shortened.spanMs, 60_000);
  assert.equal(rest.restProgress(shortened, 130_000), 0.5);
  assert.equal(rest.restProgress(shortened, 160_000), 0);
});

test('expired rests are empty, including on first render', () => {
  const sweep = rest.updateRestSweep(null, 100_000, 1, 100_000);
  assert.equal(rest.restProgress(sweep, 100_000), 0);
  assert.equal(rest.restProgress(sweep, 160_000), 0);
  assert.equal(rest.restProgress(null, 160_000), 0);
});

test('a new deadline after an expired rest starts a fresh full sweep', () => {
  const sweep = rest.updateRestSweep(null, 190_000, 1, 100_000);
  const next = rest.updateRestSweep(sweep, 250_000, 1, 220_000);
  assert.equal(next.spanMs, 30_000);
  assert.equal(rest.restProgress(next, 220_000), 1);
});

test('foreground resumption catches up from the timestamp without clock ticks', () => {
  const sweep = rest.updateRestSweep(null, 190_000, 1, 100_000);
  assert.equal(rest.restProgress(sweep, 145_000), 0.5);
  assert.equal(rest.restProgress(sweep, 180_000), 1 / 9);
  assert.equal(rest.restProgress(sweep, 220_000), 0);
});

test('a clock adjustment never draws more than a full bar', () => {
  const sweep = rest.updateRestSweep(null, 190_000, 1, 100_000);
  assert.equal(rest.restProgress(sweep, 90_000), 1);
});
