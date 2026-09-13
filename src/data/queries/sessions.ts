import { and, asc, desc, eq, inArray, isNotNull, isNull, lt, ne, sql } from 'drizzle-orm';

import type { PrBaseline } from '@/lib/pr';
import { weightKey } from '@/lib/units';

import type { Db } from '../db';
import { db } from '../db';
import { exercises, personalRecords, sessionExercises, sessions, sets } from '../schema';

/** A transaction reads exactly like the database does, and the baseline needs both. */
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
type Reader = Db | Tx;

/**
 * The one live session, if there is one. The partial unique index makes "one"
 * a database fact rather than something the app has to be careful about.
 */
export function activeSessionQuery() {
  return db.select().from(sessions).where(eq(sessions.status, 'in_progress')).limit(1);
}

export function sessionQuery(id: string) {
  return db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
}

/** The session's lifts in performed order. Skipped ones are excluded, not gone. */
export function sessionExercisesQuery(sessionId: string) {
  return db
    .select({
      id: sessionExercises.id,
      position: sessionExercises.position,
      plannedSets: sessionExercises.plannedSets,
      plannedReps: sessionExercises.plannedReps,
      plannedWeightKg: sessionExercises.plannedWeightKg,
      restSec: sessionExercises.restSec,
      addedMidSession: sessionExercises.addedMidSession,
      note: sessionExercises.note,
      exerciseId: exercises.id,
      name: exercises.name,
      kind: exercises.kind,
      equipment: exercises.equipment,
      barWeightKg: exercises.barWeightKg,
      trackRpe: exercises.trackRpe,
    })
    .from(sessionExercises)
    .innerJoin(exercises, eq(exercises.id, sessionExercises.exerciseId))
    .where(and(eq(sessionExercises.sessionId, sessionId), isNull(sessionExercises.removedAt)))
    .orderBy(asc(sessionExercises.position));
}

/** Every set in the session, in the order the screen walks them. */
export function sessionSetsQuery(sessionId: string) {
  return db
    .select({
      id: sets.id,
      sessionExerciseId: sets.sessionExerciseId,
      exercisePosition: sessionExercises.position,
      position: sets.position,
      kind: sets.kind,
      plannedWeightKg: sets.plannedWeightKg,
      plannedReps: sets.plannedReps,
      weightKg: sets.weightKg,
      reps: sets.reps,
      rpe: sets.rpe,
      completedAt: sets.completedAt,
      e1rmKg: sets.e1rmKg,
    })
    .from(sets)
    .innerJoin(sessionExercises, eq(sessionExercises.id, sets.sessionExerciseId))
    .where(eq(sessionExercises.sessionId, sessionId))
    .orderBy(asc(sessionExercises.position), asc(sets.position));
}

/** The NEW RECORDS section on the summary screen, in the order they landed. */
export function sessionRecordsQuery(sessionId: string) {
  return db
    .select({
      id: personalRecords.id,
      category: personalRecords.category,
      value: personalRecords.value,
      previousValue: personalRecords.previousValue,
      weightKg: personalRecords.weightKg,
      reps: personalRecords.reps,
      name: exercises.name,
    })
    .from(personalRecords)
    .innerJoin(exercises, eq(exercises.id, personalRecords.exerciseId))
    .where(eq(personalRecords.sessionId, sessionId))
    .orderBy(asc(personalRecords.achievedAt));
}

/** The summary screen's VOLUME delta baseline: this routine's last completed session. */
export function previousSessionVolumeQuery(routineId: string, startedAt: number) {
  return db
    .select({ totalVolumeKg: sessions.totalVolumeKg })
    .from(sessions)
    .where(
      and(
        eq(sessions.routineId, routineId),
        eq(sessions.status, 'completed'),
        lt(sessions.startedAt, startedAt),
      ),
    )
    .orderBy(desc(sessions.startedAt))
    .limit(1);
}

export function setsForExerciseQuery(sessionExerciseId: string) {
  return db
    .select()
    .from(sets)
    .where(eq(sets.sessionExerciseId, sessionExerciseId))
    .orderBy(asc(sets.position));
}

/** The Today rail and the history list. */
export function recentSessionsQuery(limit = 20) {
  return db
    .select()
    .from(sessions)
    .where(ne(sessions.status, 'in_progress'))
    .orderBy(desc(sessions.startedAt))
    .limit(limit);
}

/** The most recently logged set for an exercise before the current session. */
export function lastCompletedExerciseSetQuery(exerciseId: string, currentSessionId: string) {
  return db
    .select({
      weightKg: sets.weightKg,
      reps: sets.reps,
      rpe: sets.rpe,
      e1rmKg: sets.e1rmKg,
      startedAt: sessions.startedAt,
    })
    .from(sets)
    .innerJoin(sessionExercises, eq(sessionExercises.id, sets.sessionExerciseId))
    .innerJoin(sessions, eq(sessions.id, sessionExercises.sessionId))
    .where(
      and(
        eq(sessionExercises.exerciseId, exerciseId),
        ne(sessionExercises.sessionId, currentSessionId),
        isNotNull(sets.completedAt),
      ),
    )
    .orderBy(desc(sessions.startedAt), desc(sets.position))
    .limit(1);
}

/**
 * Everything `detectSetPrs` needs to judge one exercise, read from the sets
 * themselves rather than from `personal_records`.
 *
 * It has to be the sets: `bestRepsAtWeight` is the map that decides whether a
 * weight has *ever* been lifted, and the records table only knows the weights
 * that once won something. Reading it from records would fire a
 * most-reps-at-weight record on every unfamiliar load — the exact failure
 * `detectSetPrs` guards against.
 *
 * `heaviest`, `best_e1rm` and `best_set_volume` see working and failure sets
 * only, matching `detectSetPrs`, which refuses warm-ups and drops. Session
 * volume follows `totalVolume` instead and excludes warm-ups alone.
 */
export function readPrBaseline(
  reader: Reader,
  exerciseId: string,
  opts: { excludeSessionId?: string } = {},
): PrBaseline {
  const scoring = and(
    eq(sessionExercises.exerciseId, exerciseId),
    isNotNull(sets.completedAt),
    isNotNull(sets.weightKg),
    isNotNull(sets.reps),
    inArray(sets.kind, ['working', 'failure']),
    opts.excludeSessionId ? ne(sessionExercises.sessionId, opts.excludeSessionId) : undefined,
  );

  const [agg] = reader
    .select({
      heaviestKg: sql<number | null>`max(${sets.weightKg})`,
      bestE1rmKg: sql<number | null>`max(${sets.e1rmKg})`,
      bestSetVolumeKg: sql<number | null>`max(${sets.weightKg} * ${sets.reps})`,
    })
    .from(sets)
    .innerJoin(sessionExercises, eq(sessionExercises.id, sets.sessionExerciseId))
    .where(scoring)
    .all();

  const perWeight = reader
    .select({ weightKg: sets.weightKg, reps: sql<number>`max(${sets.reps})` })
    .from(sets)
    .innerJoin(sessionExercises, eq(sessionExercises.id, sets.sessionExerciseId))
    .where(scoring)
    .groupBy(sets.weightKg)
    .all();

  // Summed per session in SQL, maximised in JS: one row per session this
  // exercise appears in, which is small, and it avoids a nested subquery.
  const perSession = reader
    .select({ volumeKg: sql<number>`sum(${sets.weightKg} * ${sets.reps})` })
    .from(sets)
    .innerJoin(sessionExercises, eq(sessionExercises.id, sets.sessionExerciseId))
    .where(
      and(
        eq(sessionExercises.exerciseId, exerciseId),
        isNotNull(sets.completedAt),
        isNotNull(sets.weightKg),
        isNotNull(sets.reps),
        ne(sets.kind, 'warmup'),
        opts.excludeSessionId ? ne(sessionExercises.sessionId, opts.excludeSessionId) : undefined,
      ),
    )
    .groupBy(sessionExercises.sessionId)
    .all();

  return {
    heaviestKg: agg?.heaviestKg ?? null,
    bestE1rmKg: agg?.bestE1rmKg ?? null,
    bestSetVolumeKg: agg?.bestSetVolumeKg ?? null,
    bestRepsAtWeight: new Map(
      perWeight
        .filter((r): r is { weightKg: number; reps: number } => r.weightKg != null)
        .map((r) => [weightKey(r.weightKg), r.reps]),
    ),
    bestSessionVolumeKg: perSession.length ? Math.max(...perSession.map((r) => r.volumeKg)) : null,
  };
}
