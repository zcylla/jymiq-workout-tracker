import assert from 'node:assert/strict';
import { test } from 'node:test';

import { type NavExercise, nextExercise, nextSet, prevExercise, prevSet } from './live-nav.ts';

const ex = (logged: boolean[], removed = false): NavExercise => ({
  removed,
  sets: logged.map((l) => ({ logged: l })),
});

const at = (exerciseIndex: number, setIndex: number) => ({ exerciseIndex, setIndex });

test('sets step within an exercise and clamp at both ends', () => {
  const list = [ex([false, false, false]), ex([false])];
  assert.deepEqual(nextSet(list, at(0, 0)), at(0, 1));
  assert.deepEqual(prevSet(list, at(0, 2)), at(0, 1));
  const last = at(0, 2);
  assert.equal(nextSet(list, last), last);
  const first = at(0, 0);
  assert.equal(prevSet(list, first), first);
});

test('a set swipe never rolls into the neighbouring exercise', () => {
  const list = [ex([false, false]), ex([false, false])];
  const last = at(0, 1);
  assert.equal(nextSet(list, last), last);
  const first = at(1, 0);
  assert.equal(prevSet(list, first), first);
});

test('exercises step and clamp at both ends, with no wrap', () => {
  const list = [ex([false]), ex([false]), ex([false])];
  assert.deepEqual(nextExercise(list, at(0, 0)).exerciseIndex, 1);
  assert.deepEqual(prevExercise(list, at(2, 0)).exerciseIndex, 1);
  const last = at(2, 0);
  assert.equal(nextExercise(list, last), last);
  const first = at(0, 0);
  assert.equal(prevExercise(list, first), first);
});

test('removed exercises are stepped over in both directions', () => {
  const list = [ex([false]), ex([false], true), ex([false], true), ex([false])];
  assert.equal(nextExercise(list, at(0, 0)).exerciseIndex, 3);
  assert.equal(prevExercise(list, at(3, 0)).exerciseIndex, 0);
});

test('a removed tail or head is an edge, not a landing', () => {
  const list = [ex([false], true), ex([false]), ex([false], true)];
  const cursor = at(1, 0);
  assert.equal(nextExercise(list, cursor), cursor);
  assert.equal(prevExercise(list, cursor), cursor);
});

test('moving between exercises lands on the first unlogged set, else set 0', () => {
  const list = [ex([false]), ex([true, true, false, false]), ex([true, true])];
  assert.deepEqual(nextExercise(list, at(0, 0)), at(1, 2));
  assert.deepEqual(nextExercise(list, at(1, 3)), at(2, 0));
  assert.deepEqual(prevExercise(list, at(2, 0)), at(1, 2));
});

test('a single-exercise session has nowhere to go vertically', () => {
  const list = [ex([false, false])];
  const cursor = at(0, 0);
  assert.equal(nextExercise(list, cursor), cursor);
  assert.equal(prevExercise(list, cursor), cursor);
  assert.deepEqual(nextSet(list, cursor), at(0, 1));
});

test('an exercise with zero sets is landed on at set 0 and is an edge for sets', () => {
  const list = [ex([false]), ex([]), ex([false])];
  assert.deepEqual(nextExercise(list, at(0, 0)), at(1, 0));
  const empty = at(1, 0);
  assert.equal(nextSet(list, empty), empty);
  assert.equal(prevSet(list, empty), empty);
});

test('an empty session or a stale cursor is returned untouched', () => {
  const cursor = at(0, 0);
  assert.equal(nextSet([], cursor), cursor);
  assert.equal(nextExercise([], cursor), cursor);
  assert.equal(prevExercise([], cursor), cursor);
});
