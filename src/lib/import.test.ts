import assert from 'node:assert/strict';
import { test } from 'node:test';

import { EXPORT_VERSION, buildExport } from './export.ts';
import { describeBackup, parseBackup } from './import.ts';

const meta = { now: Date.UTC(2026, 8, 13, 10, 42), appVersion: '1.0.0' };

test('a real export round-trips through the parser', () => {
  const envelope = buildExport({ routines: [{ id: 'a' }], sets: [{}, {}] }, meta);
  const result = parseBackup(JSON.stringify(envelope));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.backup.tables, envelope.tables);
  assert.deepEqual(result.backup.counts, envelope.counts);
  assert.equal(result.backup.version, envelope.version);
  assert.equal(result.backup.appVersion, envelope.appVersion);
  assert.equal(result.backup.exportedAt, envelope.exportedAt);
  assert.deepEqual(result.backup.unknownTables, []);
});

test('an empty database still parses as a valid backup', () => {
  const envelope = buildExport({}, meta);
  const result = parseBackup(JSON.stringify(envelope));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.backup.tables, {});
  assert.deepEqual(result.backup.counts, {});
});

test('text that is not JSON at all is rejected', () => {
  const result = parseBackup('not json{');
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.reason, /not valid JSON/);
});

test('valid JSON that is not an object is rejected', () => {
  const result = parseBackup('[1, 2, 3]');
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.reason, /does not look like a Jymiq backup/);
});

test('an object missing format is rejected', () => {
  const result = parseBackup(JSON.stringify({ version: 1, tables: {} }));
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.reason, /does not look like a Jymiq backup/);
});

test('someone else JSON with the wrong format tag is rejected', () => {
  const result = parseBackup(JSON.stringify({ format: 'some-other-app', version: 1, tables: {} }));
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.reason, /not a Jymiq backup/);
});

test('a missing version is rejected', () => {
  const result = parseBackup(JSON.stringify({ format: 'jymiq-export', tables: {} }));
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.reason, /does not say what version/);
});

test('a non-numeric version is rejected', () => {
  const result = parseBackup(JSON.stringify({ format: 'jymiq-export', version: '1', tables: {} }));
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.reason, /does not say what version/);
});

test('a version newer than this app understands is rejected', () => {
  const result = parseBackup(
    JSON.stringify({ format: 'jymiq-export', version: EXPORT_VERSION + 1, tables: {} }),
  );
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.reason, /newer version of Jymiq/);
});

test('a version older than this app is accepted', () => {
  // Older files are read as-is; there is nothing yet to migrate at version 1.
  const result = parseBackup(
    JSON.stringify({
      format: 'jymiq-export',
      version: 0,
      exportedAt: meta.now,
      appVersion: '0.9.0',
      counts: {},
      tables: {},
    }),
  );
  assert.equal(result.ok, true);
});

test('a missing tables object is rejected', () => {
  const result = parseBackup(JSON.stringify({ format: 'jymiq-export', version: 1 }));
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.reason, /no tables/);
});

test('a count that disagrees with the actual rows is rejected, naming the table', () => {
  const result = parseBackup(
    JSON.stringify({
      format: 'jymiq-export',
      version: 1,
      exportedAt: meta.now,
      appVersion: '1.0.0',
      counts: { sets: 5 },
      tables: { sets: [{}, {}] },
    }),
  );
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.reason, /sets/);
  assert.match(result.reason, /truncated|damaged/);
});

test('a table the current schema does not know about is surfaced, not rejected', () => {
  const envelope = buildExport({ routines: [], future_table: [{ x: 1 }] }, meta);
  const result = parseBackup(JSON.stringify(envelope));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.backup.unknownTables, ['future_table']);
  assert.deepEqual(result.backup.tables.future_table, [{ x: 1 }]);
});

test('the summary reports counts and the export date', () => {
  const envelope = buildExport(
    { sessions: [{}, {}, {}], sets: new Array(42).fill({}), routines: [{}] },
    meta,
  );
  const result = parseBackup(JSON.stringify(envelope));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const summary = describeBackup(result.backup);
  assert.match(summary, /3 sessions/);
  assert.match(summary, /42 sets/);
  assert.match(summary, /1 routine\b/); // singular, and not "1 routines"
  assert.match(summary, /13 Sep 2026/);
});

test('the summary names the tables a person recognises, not the join rows', () => {
  const envelope = buildExport(
    { exercises: [{}, {}], exercise_muscles: [{}, {}, {}], sessions: [{}] },
    meta,
  );
  const result = parseBackup(JSON.stringify(envelope));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const summary = describeBackup(result.backup);
  assert.match(summary, /1 session/);
  // Reciting join tables makes the summary read as a schema dump rather than an
  // answer to "is this the right file".
  assert.doesNotMatch(summary, /exercise_muscles/);
  assert.doesNotMatch(summary, /exercises/);
});

test('a backup with nothing in it says so rather than printing an empty tally', () => {
  const result = parseBackup(JSON.stringify(buildExport({}, meta)));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.match(describeBackup(result.backup), /no training yet/);
});
