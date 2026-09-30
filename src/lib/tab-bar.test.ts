import assert from 'node:assert/strict';
import { test } from 'node:test';

import { type BarScroll, TOP_ZONE, TRAVEL, stepBar } from './tab-bar.ts';

const top: BarScroll = { minimised: false, anchor: 0 };

function run(start: BarScroll, offsets: number[]) {
  return offsets.reduce((s, y) => stepBar(s, y), start);
}

test('the bar stays full inside the top zone, overscroll included', () => {
  assert.equal(run(top, [0, 8, TOP_ZONE, -40]).minimised, false);
});

test('it minimises once a downward drag has covered the travel, below the top zone', () => {
  assert.equal(run(top, [TOP_ZONE, TOP_ZONE + 1, TOP_ZONE + TRAVEL - 1]).minimised, false);
  assert.equal(run(top, [TOP_ZONE, TOP_ZONE + TRAVEL]).minimised, true);
  assert.equal(stepBar(top, 400).minimised, true);
});

test('a small upward tremor while minimised does not restore it', () => {
  const s = run(top, [100, 200, 200 - TRAVEL + 1]);
  assert.equal(s.minimised, true);
});

test('an upward drag of the travel restores it, anywhere on the page', () => {
  assert.equal(run(top, [100, 300, 300 - TRAVEL]).minimised, false);
});

test('reaching the top restores it however fast', () => {
  assert.equal(run(top, [100, 500, 0]).minimised, false);
});

test('the anchor follows the furthest point, so a reversal is measured from there', () => {
  const s = run(top, [100, 200, 260, 260 - TRAVEL + 1]);
  assert.equal(s.minimised, true);
  assert.equal(stepBar(s, 260 - TRAVEL).minimised, false);
});

test('direction changes in the full state reset the downward measure', () => {
  const s = run(top, [100, 100 + TRAVEL - 1, 90]);
  assert.equal(s.minimised, false);
  assert.equal(stepBar(s, 90 + TRAVEL - 1).minimised, false);
  assert.equal(stepBar(s, 90 + TRAVEL).minimised, true);
});
