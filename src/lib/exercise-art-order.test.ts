import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import test from 'node:test';

import { demoFrames, reversedDemoIds } from './exercise-art-order.ts';

test('a reversed exercise plays its frames last to first', () => {
  assert.deepEqual(demoFrames('bicep-curl', [1, 2, 3]), [3, 2, 1]);
});

test('an exercise that is not listed keeps its frame order', () => {
  assert.deepEqual(demoFrames('goblet-squat', [1, 2, 3]), [1, 2, 3]);
  assert.deepEqual(demoFrames('a-custom-exercise', [1, 2, 3]), [1, 2, 3]);
});

test('every reversed id is an exercise in the art package, listed once', () => {
  const ids = reversedDemoIds();
  const art = new Set(readdirSync('node_modules/@bryllim/workout-guide/assets'));
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.ok(art.has(id), id);
});
