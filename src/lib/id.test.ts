import assert from 'node:assert/strict';
import test from 'node:test';

import { newId } from './id.ts';

test('ids sort by creation time and survive a colliding millisecond', () => {
  const a = newId(1_700_000_000_000, () => 0.1);
  const b = newId(1_700_000_000_001, () => 0.1);
  assert.ok(a < b, 'a later id must sort after an earlier one');

  // Same millisecond, different randomness: still distinct.
  assert.notEqual(
    newId(1_700_000_000_000, () => 0.1),
    newId(1_700_000_000_000, () => 0.9),
  );

  // The tail is fixed width, so string ordering matches time ordering.
  assert.equal(a.length, b.length);
  assert.match(newId(), /^[0-9a-z]{9}-[0-9a-z]{7}$/);
});
