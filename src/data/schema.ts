import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

/**
 * Every weight in this database is kilograms. Pounds are a display transform
 * (src/lib/units.ts) and never reach a column.
 *
 * Timestamps are unix milliseconds.
 */

export const MUSCLES = [
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'adductors',
  'chest',
  'back',
  'lats',
  'traps',
  'lower_back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'neck',
] as const;
export type Muscle = (typeof MUSCLES)[number];

// ------------------------------------------------------------- reference ----
export const exercises = sqliteTable(
  'exercises',
  {
    /** Stable slug for the built-in library, uuid for anything the user adds. */
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    equipment: text('equipment', {
      enum: ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'other'],
    }).notNull(),
    /** Drives the default rest time and whether e1RM means anything. */
    kind: text('kind', { enum: ['compound', 'isolation'] }).notNull(),
    isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
    isFavorite: integer('is_favorite', { mode: 'boolean' }).notNull().default(false),
    /** Null when the lift has no bar. */
    barWeightKg: real('bar_weight_kg'),
    /** Null falls back to the per-kind default in settings. */
    defaultRestSec: integer('default_rest_sec'),
    /** RPE is off unless asked for: it must never arrive pre-filled (§0). */
    trackRpe: integer('track_rpe', { mode: 'boolean' }).notNull().default(false),
    description: text('description'),
    cues: text('cues', { mode: 'json' }).$type<string[]>(),
    mistakes: text('mistakes', { mode: 'json' }).$type<string[]>(),
    /** Soft delete — history keeps pointing at it. */
    archivedAt: integer('archived_at'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (t) => [index('idx_ex_name').on(t.name), index('idx_ex_favorite').on(t.isFavorite)],
);

/** A join table, not a JSON column: the library filters query it. */
export const exerciseMuscles = sqliteTable(
  'exercise_muscles',
  {
    exerciseId: text('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'cascade' }),
    muscle: text('muscle', { enum: MUSCLES }).notNull(),
    role: text('role', { enum: ['prime', 'assist'] }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.exerciseId, t.muscle] }), index('idx_em_muscle').on(t.muscle)],
);

// ------------------------------------------------------------- the plan ----
export const routines = sqliteTable('routines', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  note: text('note'),
  position: integer('position').notNull().default(0),
  archivedAt: integer('archived_at'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const routineExercises = sqliteTable(
  'routine_exercises',
  {
    id: text('id').primaryKey(),
    routineId: text('routine_id')
      .notNull()
      .references(() => routines.id, { onDelete: 'cascade' }),
    exerciseId: text('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'restrict' }),
    position: integer('position').notNull(),
    targetSets: integer('target_sets').notNull(),
    targetReps: integer('target_reps'),
    targetWeightKg: real('target_weight_kg'),
    /** Null falls back to the exercise, then to settings. */
    restSec: integer('rest_sec'),
    note: text('note'),
  },
  (t) => [index('idx_rx_routine').on(t.routineId, t.position)],
);

// -------------------------------------------------- what actually happened ----
export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    routineId: text('routine_id').references(() => routines.id, { onDelete: 'set null' }),
    /** Snapshot of the routine name: renaming a routine never rewrites history. */
    name: text('name').notNull(),
    status: text('status', { enum: ['in_progress', 'completed', 'abandoned'] })
      .notNull()
      .default('in_progress'),
    startedAt: integer('started_at').notNull(),
    endedAt: integer('ended_at'),
    /** elapsed = now − startedAt − pausedMs. */
    pausedMs: integer('paused_ms').notNull().default(0),
    note: text('note'),

    // Live-session resume state. Because these live on the row, a crash or a
    // force-stop needs no recovery code — the session already knows where it was.
    restUntil: integer('rest_until'),
    currentSessionExerciseId: text('current_session_exercise_id'),
    currentSetId: text('current_set_id'),

    // Written once, inside the completion transaction. The history list and the
    // calendar scan hundreds of these and must not re-aggregate to do it.
    totalVolumeKg: real('total_volume_kg'),
    totalSets: integer('total_sets'),
    durationSec: integer('duration_sec'),
  },
  (t) => [
    index('idx_sessions_started').on(t.startedAt),
    index('idx_sessions_status').on(t.status),
    /** At most one live session, enforced by the database rather than by app code. */
    uniqueIndex('idx_sessions_one_live').on(t.status).where(sql`status = 'in_progress'`),
  ],
);

export const sessionExercises = sqliteTable(
  'session_exercises',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    exerciseId: text('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'restrict' }),
    routineExerciseId: text('routine_exercise_id').references(() => routineExercises.id, {
      onDelete: 'set null',
    }),
    /** Order actually performed; reordering mid-session rewrites this, not the plan. */
    position: integer('position').notNull(),

    // What was planned, snapshotted at session start.
    plannedSets: integer('planned_sets'),
    plannedReps: integer('planned_reps'),
    plannedWeightKg: real('planned_weight_kg'),
    /** Resolved at start: routine → exercise → settings. */
    restSec: integer('rest_sec').notNull(),

    addedMidSession: integer('added_mid_session', { mode: 'boolean' }).notNull().default(false),
    /** Skipped, not deleted — "planned and not done" is a fact worth keeping. */
    removedAt: integer('removed_at'),
    note: text('note'),
  },
  (t) => [index('idx_sx_session').on(t.sessionId, t.position)],
);

export const sets = sqliteTable(
  'sets',
  {
    id: text('id').primaryKey(),
    sessionExerciseId: text('session_exercise_id')
      .notNull()
      .references(() => sessionExercises.id, { onDelete: 'cascade' }),
    /** 1-based within the exercise. */
    position: integer('position').notNull(),
    kind: text('kind', { enum: ['warmup', 'working', 'drop', 'failure'] })
      .notNull()
      .default('working'),

    plannedWeightKg: real('planned_weight_kg'),
    plannedReps: integer('planned_reps'),

    // What is currently dialled. The tape writes here on every gesture end, so
    // the row IS the draft — there is no separate unsaved state to lose.
    weightKg: real('weight_kg'),
    reps: integer('reps'),
    /** Null means unset, and unset is the default. Never 8. */
    rpe: real('rpe'),

    /** The only "done" flag. Null means dialled but not logged. */
    completedAt: integer('completed_at'),
    /** Frozen at completion, so changing the formula never rewrites history.
     *  Null past twelve reps, where the estimate is meaningless. */
    e1rmKg: real('e1rm_kg'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (t) => [index('idx_sets_session_exercise').on(t.sessionExerciseId, t.position)],
);

// ----------------------------------------------------------------- records ----
/**
 * Append-only. The current record is the newest row per (exercise, category),
 * never an UPDATE — that makes the timeline a plain ordered scan, keeps
 * "was 128" for free, and lets deleting a session retract its records by cascade.
 */
export const personalRecords = sqliteTable(
  'personal_records',
  {
    id: text('id').primaryKey(),
    exerciseId: text('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'cascade' }),
    category: text('category', {
      enum: [
        'heaviest',
        'best_e1rm',
        'most_reps_at_weight',
        'best_set_volume',
        'best_session_volume',
      ],
    }).notNull(),
    /** Kilograms, reps, or kilogram-volume, depending on the category. */
    value: real('value').notNull(),
    /** Which weight, for most_reps_at_weight. */
    weightKg: real('weight_kg'),
    reps: integer('reps'),
    previousValue: real('previous_value'),
    setId: text('set_id').references(() => sets.id, { onDelete: 'cascade' }),
    sessionId: text('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    achievedAt: integer('achieved_at').notNull(),
  },
  (t) => [
    index('idx_pr_exercise_category').on(t.exerciseId, t.category, t.achievedAt),
    index('idx_pr_achieved').on(t.achievedAt),
  ],
);

export type Exercise = typeof exercises.$inferSelect;
export type Routine = typeof routines.$inferSelect;
export type RoutineExercise = typeof routineExercises.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type SessionExercise = typeof sessionExercises.$inferSelect;
export type WorkoutSet = typeof sets.$inferSelect;
export type PersonalRecord = typeof personalRecords.$inferSelect;
