import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  changeSetKind,
  dropParent,
  insertTypedSet,
  moveSetGroup,
  removalSetIds,
  setTypeLabel,
  continuesDropGroup,
  validateSetOrder,
  setTypeOrdinal,
} from './set-groups.ts';
import type { SetKind } from './volume.ts';

const row = (id: string, kind: SetKind = 'working') => ({ id, kind });
const a = row('a');
const b = row('b');
const d1 = row('d1', 'drop');
const d2 = row('d2', 'drop');
const warmup = row('w', 'warmup');
const ids = (rows: { id: string }[]) => rows.map((s) => s.id);

test('drops identify their parent by the persisted contiguous sequence', () => {
  assert.equal(dropParent([warmup, a, d1, d2, b], 'd2')?.id, 'a');
  assert.equal(dropParent([d1, warmup, a], 'd1'), null);
  assert.equal(dropParent([a, warmup, d1], 'd1'), null);
  assert.equal(dropParent([a, d1, b], 'b'), null);
});

test('drop labels identify the parent and warmup labels are explicit', () => {
  assert.equal(setTypeLabel([warmup, a, d1], 'd1'), 'Drop · set 2');
  assert.equal(setTypeLabel([warmup, a, d1], 'w'), 'Warmup');
  assert.equal(setTypeLabel([warmup, a, d1], 'a'), 'Working');
});

test('historical comparisons count only sets of the current type', () => {
  const sets = [warmup, a, d1, b, d2, row('f', 'failure')];
  assert.equal(setTypeOrdinal(sets, 'w'), 1);
  assert.equal(setTypeOrdinal(sets, 'a'), 1);
  assert.equal(setTypeOrdinal(sets, 'b'), 2);
  assert.equal(setTypeOrdinal(sets, 'f'), 3);
  assert.equal(setTypeOrdinal(sets, 'd1'), 1);
  assert.equal(setTypeOrdinal(sets, 'd2'), 2);
});

test('warmups precede working sets; drops follow the selected parent’s entire sequence', () => {
  assert.deepEqual(ids(insertTypedSet([a, d1, b], warmup)), ['w', 'a', 'd1', 'b']);
  assert.deepEqual(ids(insertTypedSet([warmup, a, d1, b], d2, 'a')), ['w', 'a', 'd1', 'd2', 'b']);
  assert.throws(() => insertTypedSet([a, b], d1), /working set/i);
  assert.throws(() => insertTypedSet([warmup, a], d1, 'w'), /working set/i);
});

test('working sets move with their drops across other groups and warmups', () => {
  const sets = [warmup, a, d1, d2, b];
  assert.deepEqual(ids(moveSetGroup(sets, 1, 4)), ['w', 'b', 'a', 'd1', 'd2']);
  assert.equal(dropParent(moveSetGroup(sets, 1, 4), 'd2')?.id, 'a');
  assert.deepEqual(ids(moveSetGroup(sets, 4, 2)), ['w', 'b', 'a', 'd1', 'd2']);
  assert.deepEqual(ids(moveSetGroup(sets, 0, 2)), ['a', 'd1', 'd2', 'w', 'b']);
});

test('drops can reorder among siblings but cannot silently attach to another parent', () => {
  const sets = [a, d1, d2, b];
  assert.deepEqual(ids(moveSetGroup(sets, 1, 2)), ['a', 'd2', 'd1', 'b']);
  assert.deepEqual(moveSetGroup(sets, 1, 3), sets);
  assert.deepEqual(moveSetGroup(sets, 1, 0), sets);
});

test('marking an existing set preserves its values and links it to a selected working set', () => {
  const source = [{ ...a, weightKg: 80, reps: 8, completedAt: 123 }, b];
  const changed = changeSetKind(source, 'a', 'drop', 'b');
  assert.deepEqual(ids(changed), ['b', 'a']);
  assert.deepEqual(changed[1], { ...source[0], kind: 'drop' });
  assert.equal(dropParent(changed, 'a')?.id, 'b');
  assert.deepEqual(source[0], { ...a, weightKg: 80, reps: 8, completedAt: 123 });
});

test('converting a drop to working or warmup preserves its siblings’ original parent', () => {
  const source = [a, d1, d2, b];
  const working = changeSetKind(source, 'd1', 'working');
  assert.deepEqual(ids(working), ['a', 'd2', 'd1', 'b']);
  assert.equal(dropParent(working, 'd2')?.id, 'a');
  const warm = changeSetKind(source, 'd1', 'warmup');
  assert.deepEqual(ids(warm), ['d1', 'a', 'd2', 'b']);
  assert.equal(dropParent(warm, 'd2')?.id, 'a');
});

test('a parent with linked drops cannot be reclassified into a non-working type', () => {
  assert.throws(() => changeSetKind([a, d1, b], 'a', 'warmup'), /linked drops/i);
  assert.throws(() => changeSetKind([a, d1, b], 'a', 'drop', 'b'), /linked drops/i);
  assert.throws(() => changeSetKind([a], 'a', 'drop', 'a'), /working set/i);
});

test('removing a parent includes its drops, while removing a drop keeps its siblings', () => {
  assert.deepEqual(removalSetIds([warmup, a, d1, d2, b], 'a'), ['a', 'd1', 'd2']);
  assert.deepEqual(removalSetIds([a, d1, d2, b], 'd1'), ['d1']);
  assert.deepEqual(removalSetIds([a, b], 'missing'), []);
});

test('rest is skipped only when advancing into the same drop sequence', () => {
  const sets = [a, d1, d2, b];
  assert.equal(continuesDropGroup(sets, 'a', 'd1'), true);
  assert.equal(continuesDropGroup(sets, 'd1', 'd2'), true);
  assert.equal(continuesDropGroup(sets, 'd2', 'b'), false);
  assert.equal(continuesDropGroup(sets, 'd2', 'd1'), false);
  assert.equal(continuesDropGroup(sets, 'b', 'd1'), false);
  assert.equal(continuesDropGroup(sets, 'a', null), false);
});

test('storage rejects partial reorders, mixed IDs, and detached drops', () => {
  const sets = [a, d1, d2, b];
  assert.doesNotThrow(() => validateSetOrder(sets, ['b', 'a', 'd2', 'd1']));
  assert.throws(() => validateSetOrder(sets, ['a', 'd1']), /all sets/i);
  assert.throws(() => validateSetOrder(sets, ['a', 'd1', 'd1', 'b']), /all sets/i);
  assert.throws(() => validateSetOrder(sets, ['a', 'd1', 'unknown', 'b']), /all sets/i);
  assert.throws(() => validateSetOrder(sets, ['a', 'b', 'd1', 'd2']), /linked drops/i);
});
