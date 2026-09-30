import assert from 'node:assert/strict';
import { test } from 'node:test';

import { liveE1rm, loadDelta } from './live-readout.ts';

test('load delta is signed and trims trailing zeros', () => {
  assert.deepEqual(loadDelta(102.5, 100), { text: '+2.5', sign: 1 });
  assert.deepEqual(loadDelta(95, 100), { text: '−5', sign: -1 });
  assert.deepEqual(loadDelta(100, 100), { text: '±0', sign: 0 });
  assert.deepEqual(loadDelta(0.1 + 0.2, 0.3), { text: '±0', sign: 0 });
});

test('e1RM is the best logged set, ignoring unlogged ones', () => {
  const sets = [
    { completedAt: 1, e1rmKg: 120 },
    { completedAt: 2, e1rmKg: 130 },
    { completedAt: null, e1rmKg: 200 },
  ];
  assert.equal(liveE1rm(sets, 100, 8), 130);
});

test('with nothing logged, e1RM is what the dialled set implies', () => {
  assert.equal(liveE1rm([{ completedAt: null, e1rmKg: null }], 100, 1), 100);
  assert.equal(liveE1rm([], 0, 8), null);
});

test('live load delta follows the display unit', () => {
  assert.deepEqual(loadDelta(102.5, 100, 'lb'), { text: '+5.5', sign: 1 });
  assert.deepEqual(loadDelta(95, 100, 'lb'), { text: '−11', sign: -1 });
  assert.deepEqual(loadDelta(100, 100, 'lb'), { text: '±0', sign: 0 });
});
