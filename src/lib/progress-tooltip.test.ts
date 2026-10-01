import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Bucket, Granularity, Metric } from './exercise-progress.ts';

const bucket: Bucket = {
  start: new Date(2026, 8, 14).getTime(),
  e1rmKg: 120.6,
  weightKg: 102.5,
  volumeKg: 1000,
  reps: 12,
  sessions: 2,
};

test('tooltip headings name the calendar period with its year', async () => {
  const { progressTooltip } = await import('./progress-tooltip.ts');
  const headings: Record<Granularity, string> = {
    day: '14 SEP 2026',
    week: 'WEEK OF 14 SEP 2026',
    month: 'SEP 2026',
    all: 'SEP 2026',
    year: '2026',
  };
  for (const gran of Object.keys(headings) as Granularity[])
    assert.equal(progressTooltip(bucket, 'weight', gran, 'kg').heading, headings[gran]);
});

test('tooltip values describe the selected metric in kilograms', async () => {
  const { progressTooltip } = await import('./progress-tooltip.ts');
  const values: Record<Metric, string> = {
    e1rm: 'BEST e1RM · 121 KG',
    weight: 'TOP WEIGHT · 102.5 KG',
    volume: 'TOTAL VOLUME · 1000 KG',
    reps: 'BEST SET · 12 REPS',
  };
  for (const metric of Object.keys(values) as Metric[])
    assert.deepEqual(progressTooltip(bucket, metric, 'day', 'kg').lines, [
      values[metric],
      '2 SESSIONS',
    ]);
});

test('tooltip pounds use the existing estimate and measured weight precision', async () => {
  const { progressTooltip } = await import('./progress-tooltip.ts');
  assert.equal(progressTooltip(bucket, 'e1rm', 'month', 'lb').lines[0], 'BEST e1RM · 266 LB');
  assert.equal(progressTooltip(bucket, 'weight', 'month', 'lb').lines[0], 'TOP WEIGHT · 226 LB');
  assert.equal(
    progressTooltip(bucket, 'volume', 'month', 'lb').lines[0],
    'TOTAL VOLUME · 2204.6 LB',
  );
});

test('tooltip handles a missing estimate and singular session or rep', async () => {
  const { progressTooltip } = await import('./progress-tooltip.ts');
  const single = { ...bucket, e1rmKg: null, sessions: 1, reps: 1 };
  assert.deepEqual(progressTooltip(single, 'e1rm', 'year', 'kg').lines, [
    'BEST e1RM · —',
    '1 SESSION',
  ]);
  assert.equal(progressTooltip(single, 'reps', 'year', 'kg').lines[0], 'BEST SET · 1 REP');
});
