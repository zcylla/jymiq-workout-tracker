import assert from 'node:assert/strict';
import { test } from 'node:test';

import { heading, inEdgeBand, rubberBand, swipeIntent } from './pager.ts';

test('pager convention: finger left is the next set, finger up the next exercise', () => {
  assert.equal(heading('x', -1), 'nextSet');
  assert.equal(heading('x', 1), 'prevSet');
  assert.equal(heading('y', -1), 'nextExercise');
  assert.equal(heading('y', 1), 'prevExercise');
});

test('a slow release commits only past 30% of the width', () => {
  assert.equal(swipeIntent('x', -100, 0, 400), null);
  assert.equal(swipeIntent('x', -121, 0, 400), 'nextSet');
  assert.equal(swipeIntent('y', 130, 200, 400), 'prevExercise');
});

test('a fling commits short of the threshold, and a fling back cancels past it', () => {
  assert.equal(swipeIntent('x', -30, -800, 400), 'nextSet');
  assert.equal(swipeIntent('x', -300, 800, 400), null);
  assert.equal(swipeIntent('x', 0, 800, 400), null);
});

test('the rubber band keeps its sign and never passes 55% of the extent', () => {
  assert.ok(rubberBand(100, 400) > 0 && rubberBand(100, 400) < 100);
  assert.ok(rubberBand(-100, 400) < 0);
  assert.ok(rubberBand(1e6, 400) < 220);
  assert.equal(rubberBand(0, 400), 0);
});

test('the 40dp back-gesture band on both edges', () => {
  assert.equal(inEdgeBand(39, 411), true);
  assert.equal(inEdgeBand(40, 411), false);
  assert.equal(inEdgeBand(371, 411), false);
  assert.equal(inEdgeBand(372, 411), true);
});
