import assert from 'node:assert/strict';
import { test } from 'node:test';
import { convertDailyStrength, type DailyStrengthArchive } from './daily-strength.ts';
import { buildExport } from './export.ts';
import { nextScheduled } from './program.ts';
import { formatWeight } from './units.ts';

function fixture() {
  const exercise = {
    id: 'ex',
    name: 'Bench',
    category: 'weight_and_reps',
    equipment: 'Barbell',
    mechanicsType: 'compound',
    primaryMuscleGroups: [{ name: 'Chest' }],
  };
  const workout = {
    id: 'routine',
    name: 'Push',
    exerciseList: [
      {
        id: 'rx',
        position: 1,
        type: 'exercise',
        exercise,
        workoutExerciseSets: [{ id: 'target', set: 1, minReps: 8, maxReps: 12, restTime: 90 }],
      },
    ],
  };
  const sets = [
    {
      id: 'done',
      set: 1,
      isComplete: true,
      measurementUnit: 'lbs',
      weight: 100,
      reps: 8,
      completedDate: 30000,
    },
    { id: 'draft', set: 2, isComplete: false, measurementUnit: 'lbs', weight: 150, reps: 12 },
    {
      id: 'warmup',
      set: 3,
      isComplete: true,
      warmUp: true,
      measurementUnit: 'lbs',
      weight: 200,
      reps: 5,
    },
  ];
  const session = {
    id: 'session',
    name: 'Push',
    startDate: 1000,
    endDate: 61000,
    isComplete: true,
    workout,
    workoutSessionExercises: [
      { id: 'sx', position: 1, type: 'exercise', exercise, workoutSessionSets: sets },
    ],
  };
  const archive: DailyStrengthArchive = {
    'Workout.json': [workout],
    'UserPreferences.json': [{ currentSchedules: [{ workouts: [workout] }] }],
    'WorkoutSession.json': [session],
  };
  return { archive, sets, session, exercise };
}
const empty = () => buildExport({}, { now: 1, appVersion: '1.0.0' });
const rows = (backup: ReturnType<typeof empty>, table: string) =>
  backup.tables[table] as Record<string, unknown>[];

test('pounds round trip, draft sets stay unlogged, warmups do not inflate totals or records', () => {
  const { backup, report } = convertDailyStrength(fixture().archive, empty());
  const sets = rows(backup, 'sets');
  assert.equal(formatWeight(sets[0].weightKg as number, 'lb'), '100');
  assert.equal(sets[0].completedAt, 30000);
  assert.equal(sets[2].completedAt, 61000);
  assert.equal(sets[1].completedAt, null);
  assert.equal(sets[1].e1rmKg, null);
  const session = rows(backup, 'sessions')[0];
  assert.equal(session.totalSets, 1);
  assert.equal(session.totalVolumeKg, (sets[0].weightKg as number) * 8);
  assert.equal(session.durationSec, 60);
  assert.equal(report.completionTimesInferredFromSessionEnd, 1);
  assert.ok(rows(backup, 'personal_records').every((r) => r.setId !== sets[2].id));
  assert.equal(rows(backup, 'routine_exercises')[0].restSec, 90);
});

test('merge retains existing data and rerunning with reordered exported fields adds nothing', () => {
  const base = buildExport(
    {
      body_weights: [{ id: 'existing', weightKg: 70 }],
      routines: [{ id: 'local', name: 'Local' }],
    },
    { now: 1, appVersion: '1.0.0' },
  );
  const { backup } = convertDailyStrength(fixture().archive, base);
  assert.deepEqual(backup.tables.body_weights, base.tables.body_weights);
  assert.deepEqual(rows(backup, 'routines')[0], base.tables.routines[0]);
  const reordered = structuredClone(backup);
  for (const [name, table] of Object.entries(reordered.tables))
    reordered.tables[name] = (table as Record<string, unknown>[]).map((row) =>
      Object.fromEntries(Object.entries(row).reverse()),
    );
  const again = convertDailyStrength(fixture().archive, reordered).backup;
  assert.deepEqual(again.counts, backup.counts);
  assert.deepEqual(again.tables, backup.tables);
});

test('unknown units, unsupported categories and changed imported rows fail', () => {
  const f = fixture();
  f.sets[0].measurementUnit = 'stones';
  assert.throws(() => convertDailyStrength(f.archive, empty()), /Unknown weight unit/);
  const initial = convertDailyStrength(fixture().archive, empty()).backup;
  rows(initial, 'sets')[0].weightKg = 999;
  assert.throws(
    () => convertDailyStrength(fixture().archive, initial),
    /Existing imported row differs/,
  );
  f.sets[0].measurementUnit = 'lbs';
  f.exercise.category = 'time';
  assert.throws(() => convertDailyStrength(f.archive, empty()), /Unsupported exercise category/);
});

test('missing weights and RPE stay unset; estimates stop at twelve reps', () => {
  const f = fixture();
  delete (f.sets[0] as { weight?: number }).weight;
  f.sets[2].reps = 13;
  const result = convertDailyStrength(f.archive, empty()).backup;
  assert.equal(rows(result, 'sets')[0].weightKg, null);
  assert.equal(rows(result, 'sets')[0].rpe, null);
  assert.equal(rows(result, 'sets')[2].e1rmKg, null);
});

test('duplicate sessions, invalid timestamps and fractional reps are refused', () => {
  const f = fixture();
  f.archive['WorkoutSession.json'].push(f.session);
  assert.throws(() => convertDailyStrength(f.archive, empty()), /Duplicate session/);
  const g = fixture();
  g.sets[0].reps = 8.5;
  assert.throws(() => convertDailyStrength(g.archive, empty()), /Invalid reps/);
  g.session.endDate = 0;
  assert.throws(() => convertDailyStrength(g.archive, empty()), /Invalid dates/);
});

test('source-only import removes pre-import data and schedules only the current source routines', () => {
  const f = fixture();
  const currentSchedule = (
    f.archive['UserPreferences.json'][0] as { currentSchedules: { id?: string; name?: string }[] }
  ).currentSchedules[0];
  currentSchedule.id = 'ppl';
  currentSchedule.name = 'PPL';
  const base = buildExport(
    {
      routines: [{ id: 'test-routine', name: 'Lower A' }],
      programs: [{ id: 'test-program', name: 'PPL 3-Day', status: 'active' }],
      program_days: [{ programId: 'test-program', weekday: 2, routineId: 'test-routine' }],
      sessions: [{ id: 'test-session' }],
      sets: [{ id: 'test-set' }],
      body_weights: [{ id: 'test-weigh-in' }],
      check_ins: [{ id: 'test-check-in' }],
    },
    { now: 1, appVersion: '1.0.0' },
  );
  const { backup } = convertDailyStrength(f.archive, base, {
    sourceOnly: true,
    weeklyOrder: true,
    now: 100000,
  });
  assert.equal(backup.counts.sessions, 1);
  assert.equal(backup.counts.sets, 3);
  assert.equal(backup.counts.body_weights, 0);
  assert.equal(backup.counts.check_ins, 0);
  assert.ok(!JSON.stringify(backup.tables).includes('test-'));
  const program = rows(backup, 'programs')[0];
  assert.equal(program.name, 'PPL');
  assert.equal(program.status, 'active');
  assert.equal(program.startedAt, 100000);
  assert.deepEqual(backup.tables.program_days, [
    {
      programId: 'daily-strength:program:ppl',
      weekday: 0,
      routineId: 'daily-strength:routine:routine',
    },
  ]);
  assert.throws(
    () => convertDailyStrength(f.archive, base, { weeklyOrder: true }),
    /requires source-only/,
  );
});

test('weekly order picks Wednesdays routine from the source program and leaves Sunday as rest', () => {
  const f = fixture();
  const names = ['Pull 1', 'Legs 1', 'Push 2', 'Push 1', 'Pull 2', 'Legs 2'];
  const workouts = names.map((name, i) => ({ ...f.session.workout, id: `w${i}`, name }));
  f.archive['UserPreferences.json'] = [
    { currentSchedules: [{ id: 'ppl', name: 'PPL', workouts }] },
  ];
  const { backup } = convertDailyStrength(f.archive, empty(), {
    sourceOnly: true,
    weeklyOrder: true,
  });
  const routines = new Map(rows(backup, 'routines').map((r) => [r.id, r.name]));
  const days = new Map(
    rows(backup, 'program_days').map((d) => [Number(d.weekday), routines.get(d.routineId)]),
  );
  assert.deepEqual([...days.values()], names);
  assert.equal(days.has(6), false);
  const next = nextScheduled({ days, since: null }, new Date(2026, 8, 30));
  assert.equal(next?.routine, 'Push 2');
  assert.equal(next?.daysAway, 0);
});
