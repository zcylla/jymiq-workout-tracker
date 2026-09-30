import assert from 'node:assert/strict';
import { test } from 'node:test';

import { moved } from './reorder.ts';

test('moved lifts an item down and up without touching the input', () => {
  const items = ['a', 'b', 'c', 'd'];
  assert.deepEqual(moved(items, 0, 2), ['b', 'c', 'a', 'd']);
  assert.deepEqual(moved(items, 3, 1), ['a', 'd', 'b', 'c']);
  assert.deepEqual(items, ['a', 'b', 'c', 'd']);
});

test('moving an item onto its own slot changes nothing', () => {
  assert.deepEqual(moved(['a', 'b'], 1, 1), ['a', 'b']);
});
