import assert from 'node:assert/strict';
import { test } from 'node:test';

import { EXPORT_FORMAT, EXPORT_VERSION, buildExport, exportFileName, totalRows } from './export.ts';

const meta = { now: Date.UTC(2026, 8, 13, 10, 42), appVersion: '1.0.0' };

test('the envelope names itself, so a reader can refuse someone else JSON', () => {
  const e = buildExport({ routines: [] }, meta);
  assert.equal(e.format, EXPORT_FORMAT);
  assert.equal(e.version, EXPORT_VERSION);
  assert.equal(e.appVersion, '1.0.0');
  assert.equal(e.exportedAt, meta.now);
});

test('rows are carried through untouched', () => {
  const rows = [{ id: 'a', name: 'Lower A' }];
  const e = buildExport({ routines: rows }, meta);
  assert.deepEqual(e.tables.routines, rows);
});

test('counts match the tables, so a reader can check without walking them', () => {
  const e = buildExport({ routines: [{}, {}], sets: [{}, {}, {}], sessions: [] }, meta);
  assert.deepEqual(e.counts, { routines: 2, sets: 3, sessions: 0 });
  assert.equal(totalRows(e), 5);
});

test('an empty database still produces a valid file', () => {
  const e = buildExport({}, meta);
  assert.equal(totalRows(e), 0);
  assert.deepEqual(e.tables, {});
  assert.equal(e.format, EXPORT_FORMAT);
});

test('the file name carries a date you recognise, to the minute', () => {
  // Built from local time, so assert against the same clock the code reads.
  const d = new Date(meta.now);
  const p = (n: number) => String(n).padStart(2, '0');
  const expected =
    `jymiq-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` +
    `-${p(d.getHours())}${p(d.getMinutes())}.json`;
  assert.equal(exportFileName(meta.now), expected);
});

test('two exports in the same minute collide; a minute apart do not', () => {
  const a = exportFileName(meta.now);
  assert.equal(exportFileName(meta.now + 30_000), a);
  assert.notEqual(exportFileName(meta.now + 60_000), a);
});
