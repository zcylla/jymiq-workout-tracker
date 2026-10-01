import assert from 'node:assert/strict';
import { test } from 'node:test';

import { adjustRestUntil } from './rest.ts';

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
