import { and, asc, eq, isNull, sql } from 'drizzle-orm';

import { estimate1RM } from '@/lib/e1rm';
import { newId } from '@/lib/id';
import { type PrHit, detectSessionVolumePr, detectSetPrs } from '@/lib/pr';
import { resolveRestSec } from '@/lib/rest';
import { elapsedSec } from '@/lib/time';
import { countWorkingSets, type SetLike, totalVolume } from '@/lib/volume';

import { db } from '../db';
import { readPrBaseline } from '../queries/sessions';
import {
  exercises,
  personalRecords,
  routineExercises,
  routines,
  sessionExercises,
  sessions,
  sets,
} from '../schema';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Sets given to an exercise added with no plan behind it. */
const DEFAULT_SETS = 3;

/**
 * Opens a session and snapshots the plan into it.
 *
 * The snapshot is the point: `session_exercises` and `sets` are copies, so
 * editing the routine tomorrow never rewrites what happened today. The set rows
 * are created up front with the plan already dialled into `weightKg`/`reps`,
 * which is what makes the row the draft — the tape writes to a row that exists,
 * and a force-stop loses nothing.
 */
export function startSession(input: { routineId?: string | null; name?: string } = {}): string {
  const id = newId();
  const now = Date.now();

  db.transaction((tx) => {
    const [live] = tx
      .select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.status, 'in_progress'))
      .limit(1)
      .all();
    // The partial unique index would refuse this anyway; saying so beats a
    // constraint error surfacing from four frames down.
    if (live) throw new Error(`A session is already in progress (${live.id}).`);

    const routine = input.routineId
      ? tx.select().from(routines).where(eq(routines.id, input.routineId)).limit(1).all()[0]
      : undefined;

    tx.insert(sessions)
      .values({
        id,
        routineId: routine?.id ?? null,
        name: input.name?.trim() || routine?.name || 'Workout',
        status: 'in_progress',
        startedAt: now,
      })
      .run();

    if (!routine) return;

    const plan = tx
      .select({
        id: routineExercises.id,
        exerciseId: routineExercises.exerciseId,
        targetSets: routineExercises.targetSets,
        targetReps: routineExercises.targetReps,
        targetWeightKg: routineExercises.targetWeightKg,
        restSec: routineExercises.restSec,
        exerciseRestSec: exercises.defaultRestSec,
        kind: exercises.kind,
      })
      .from(routineExercises)
      .innerJoin(exercises, eq(exercises.id, routineExercises.exerciseId))
      .where(eq(routineExercises.routineId, routine.id))
      .orderBy(asc(routineExercises.position))
      .all();

    let firstExerciseId: string | null = null;
    let firstSetId: string | null = null;

    plan.forEach((line, position) => {
      const sxId = newId();
      tx.insert(sessionExercises)
        .values({
          id: sxId,
          sessionId: id,
          exerciseId: line.exerciseId,
          routineExerciseId: line.id,
          position,
          plannedSets: line.targetSets,
          plannedReps: line.targetReps,
          plannedWeightKg: line.targetWeightKg,
          restSec: resolveRestSec(line.restSec, line.exerciseRestSec, line.kind),
        })
        .run();

      for (let i = 0; i < line.targetSets; i++) {
        const setId = newId();
        tx.insert(sets)
          .values({
            id: setId,
            sessionExerciseId: sxId,
            position: i + 1,
            kind: 'working',
            plannedWeightKg: line.targetWeightKg,
            plannedReps: line.targetReps,
            weightKg: line.targetWeightKg,
            reps: line.targetReps,
            createdAt: now,
            updatedAt: now,
          })
          .run();
        if (!firstSetId) {
          firstSetId = setId;
          firstExerciseId = sxId;
        }
      }
    });

    if (firstSetId) {
      tx.update(sessions)
        .set({ currentSessionExerciseId: firstExerciseId, currentSetId: firstSetId })
        .where(eq(sessions.id, id))
        .run();
    }
  });

  return id;
}

/** What the tape writes on every gesture end. */
export function updateSet(
  id: string,
  patch: {
    weightKg?: number | null;
    reps?: number | null;
    rpe?: number | null;
    kind?: SetLike['kind'];
  },
): void {
  db.update(sets)
    .set({ ...patch, updatedAt: Date.now() })
    .where(eq(sets.id, id))
    .run();
}

/**
 * Logs a set: freezes its e1RM, judges it against the exercise's history,
 * writes any records it set, starts the rest clock and moves the cursor on.
 *
 * The baseline is read *before* the set is marked complete, so a set never
 * competes with itself — but earlier sets in the same session do count, which
 * is right: 105 after 100 is a heaviest-ever either way.
 *
 * Returns the records, so the screen can name them rather than count them.
 */
export function completeSet(id: string): PrHit[] {
  let hits: PrHit[] = [];

  db.transaction((tx) => {
    const [row] = tx
      .select({
        id: sets.id,
        kind: sets.kind,
        weightKg: sets.weightKg,
        reps: sets.reps,
        completedAt: sets.completedAt,
        position: sets.position,
        sessionExerciseId: sets.sessionExerciseId,
        exerciseId: sessionExercises.exerciseId,
        exercisePosition: sessionExercises.position,
        restSec: sessionExercises.restSec,
        sessionId: sessionExercises.sessionId,
      })
      .from(sets)
      .innerJoin(sessionExercises, eq(sessionExercises.id, sets.sessionExerciseId))
      .where(eq(sets.id, id))
      .limit(1)
      .all();

    if (!row) throw new Error(`No such set: ${id}`);
    if (row.completedAt != null) return;
    // A set with nothing dialled is not a lift. The screen should not offer the
    // button, but the guard belongs here, where every caller passes through.
    if (row.weightKg == null || row.reps == null || row.reps < 1) {
      throw new Error(`Set ${id} has no load or reps to log.`);
    }

    const now = Date.now();
    const e1rmKg = estimate1RM(row.weightKg, row.reps);
    const baseline = readPrBaseline(tx, row.exerciseId);

    hits = detectSetPrs(
      { weightKg: row.weightKg, reps: row.reps, e1rmKg, kind: row.kind },
      baseline,
    );

    tx.update(sets).set({ completedAt: now, e1rmKg, updatedAt: now }).where(eq(sets.id, id)).run();

    for (const hit of hits) {
      tx.insert(personalRecords)
        .values({
          id: newId(),
          exerciseId: row.exerciseId,
          category: hit.category,
          value: hit.value,
          weightKg: hit.weightKg ?? null,
          reps: hit.reps ?? null,
          previousValue: hit.previous,
          setId: row.id,
          sessionId: row.sessionId,
          achievedAt: now,
        })
        .run();
    }

    const next = nextIncompleteSet(tx, row.sessionId, row.exercisePosition, row.position);
    tx.update(sessions)
      .set({
        restUntil: now + row.restSec * 1000,
        currentSessionExerciseId: next?.sessionExerciseId ?? row.sessionExerciseId,
        currentSetId: next?.id ?? row.id,
      })
      .where(eq(sessions.id, row.sessionId))
      .run();
  });

  return hits;
}

/**
 * Undo. The records this set set are deleted rather than kept — they were
 * claims about a lift that is no longer logged. Anything it beat is simply the
 * newest surviving row again, which is what makes the table append-only.
 */
export function uncompleteSet(id: string): void {
  db.transaction((tx) => {
    tx.update(sets)
      .set({ completedAt: null, e1rmKg: null, updatedAt: Date.now() })
      .where(eq(sets.id, id))
      .run();
    tx.delete(personalRecords).where(eq(personalRecords.setId, id)).run();
  });
}

/** Appends a set, carrying the last one's load forward — the usual next action. */
export function addSet(sessionExerciseId: string, kind: SetLike['kind'] = 'working'): string {
  const id = newId();
  const now = Date.now();

  db.transaction((tx) => {
    const [last] = tx
      .select({ position: sets.position, weightKg: sets.weightKg, reps: sets.reps })
      .from(sets)
      .where(eq(sets.sessionExerciseId, sessionExerciseId))
      .orderBy(sql`${sets.position} desc`)
      .limit(1)
      .all();

    tx.insert(sets)
      .values({
        id,
        sessionExerciseId,
        position: (last?.position ?? 0) + 1,
        kind,
        weightKg: last?.weightKg ?? null,
        reps: last?.reps ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .run();
  });

  return id;
}

/** A hard delete: an unwanted set is a mistake, not history. */
export function removeSet(id: string): void {
  db.delete(sets).where(eq(sets.id, id)).run();
}

/** Adds a lift the plan did not have. Its sets carry no plan, because there is none. */
export function addExerciseToSession(sessionId: string, exerciseId: string): string {
  const sxId = newId();
  const now = Date.now();

  db.transaction((tx) => {
    const [ex] = tx
      .select({ kind: exercises.kind, defaultRestSec: exercises.defaultRestSec })
      .from(exercises)
      .where(eq(exercises.id, exerciseId))
      .limit(1)
      .all();
    if (!ex) throw new Error(`No such exercise: ${exerciseId}`);

    const [last] = tx
      .select({ max: sql<number | null>`max(${sessionExercises.position})` })
      .from(sessionExercises)
      .where(eq(sessionExercises.sessionId, sessionId))
      .all();

    tx.insert(sessionExercises)
      .values({
        id: sxId,
        sessionId,
        exerciseId,
        position: (last?.max ?? -1) + 1,
        restSec: resolveRestSec(null, ex.defaultRestSec, ex.kind),
        addedMidSession: true,
      })
      .run();

    for (let i = 0; i < DEFAULT_SETS; i++) {
      tx.insert(sets)
        .values({
          id: newId(),
          sessionExerciseId: sxId,
          position: i + 1,
          kind: 'working',
          createdAt: now,
          updatedAt: now,
        })
        .run();
    }
  });

  return sxId;
}

/**
 * Skipped, not deleted. "Planned and not done" is a fact the recap should be
 * able to state, and a hard delete would throw it away along with any sets that
 * were logged before the skip.
 */
export function skipSessionExercise(id: string): void {
  db.update(sessionExercises)
    .set({ removedAt: Date.now() })
    .where(eq(sessionExercises.id, id))
    .run();
}

export function unskipSessionExercise(id: string): void {
  db.update(sessionExercises).set({ removedAt: null }).where(eq(sessionExercises.id, id)).run();
}

/** The sheets' reorder grips. Positions are rewritten wholesale, in order. */
export function reorderSessionExercises(orderedIds: readonly string[]): void {
  db.transaction((tx) => {
    orderedIds.forEach((id, position) => {
      tx.update(sessionExercises).set({ position }).where(eq(sessionExercises.id, id)).run();
    });
  });
}

export function reorderSets(orderedIds: readonly string[]): void {
  db.transaction((tx) => {
    orderedIds.forEach((id, i) => {
      tx.update(sets)
        .set({ position: i + 1, updatedAt: Date.now() })
        .where(eq(sets.id, id))
        .run();
    });
  });
}

/** Where the two axes point. Written on navigation so a relaunch resumes in place. */
export function setSessionCursor(
  sessionId: string,
  cursor: { sessionExerciseId?: string | null; setId?: string | null },
): void {
  db.update(sessions)
    .set({
      ...(cursor.sessionExerciseId !== undefined
        ? { currentSessionExerciseId: cursor.sessionExerciseId }
        : {}),
      ...(cursor.setId !== undefined ? { currentSetId: cursor.setId } : {}),
    })
    .where(eq(sessions.id, sessionId))
    .run();
}

export function clearRest(sessionId: string): void {
  db.update(sessions).set({ restUntil: null }).where(eq(sessions.id, sessionId)).run();
}

/**
 * Closes the session: totals are computed once and written to the row, because
 * the history list and the calendar scan hundreds of these and must not
 * re-aggregate to draw one line each.
 *
 * Session-volume records are judged here rather than per set — it is the only
 * category that cannot be known until the exercise is over. Its baseline
 * excludes this session, or it would beat itself.
 *
 * Sets that were dialled and never logged are left alone. They contribute
 * nothing to either total, and deleting them would erase the difference between
 * what was planned and what got done.
 */
export function finishSession(sessionId: string, opts: { note?: string | null } = {}): PrHit[] {
  const hits: PrHit[] = [];

  db.transaction((tx) => {
    const [session] = tx.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1).all();
    if (!session) throw new Error(`No such session: ${sessionId}`);
    if (session.status !== 'in_progress') return;

    const rows = tx
      .select({
        exerciseId: sessionExercises.exerciseId,
        weightKg: sets.weightKg,
        reps: sets.reps,
        kind: sets.kind,
        completedAt: sets.completedAt,
      })
      .from(sets)
      .innerJoin(sessionExercises, eq(sessionExercises.id, sets.sessionExerciseId))
      .where(eq(sessionExercises.sessionId, sessionId))
      .all();

    const now = Date.now();

    const byExercise = new Map<string, SetLike[]>();
    for (const r of rows) {
      const list = byExercise.get(r.exerciseId);
      if (list) list.push(r);
      else byExercise.set(r.exerciseId, [r]);
    }

    for (const [exerciseId, exerciseSets] of byExercise) {
      const volume = totalVolume(exerciseSets);
      const hit = detectSessionVolumePr(
        volume,
        readPrBaseline(tx, exerciseId, { excludeSessionId: sessionId }),
      );
      if (!hit) continue;
      hits.push(hit);
      tx.insert(personalRecords)
        .values({
          id: newId(),
          exerciseId,
          category: hit.category,
          value: hit.value,
          previousValue: hit.previous,
          sessionId,
          achievedAt: now,
        })
        .run();
    }

    tx.update(sessions)
      .set({
        status: 'completed',
        endedAt: now,
        note: opts.note ?? session.note,
        totalVolumeKg: totalVolume(rows),
        totalSets: countWorkingSets(rows),
        durationSec: elapsedSec(session.startedAt, session.pausedMs, now),
        restUntil: null,
        currentSessionExerciseId: null,
        currentSetId: null,
      })
      .where(eq(sessions.id, sessionId))
      .run();
  });

  return hits;
}

/**
 * Abandoned, not deleted, and the records it set stand: a set that was logged
 * was still lifted. Totals are written the same way, so an abandoned session
 * still draws correctly in history.
 */
export function abandonSession(sessionId: string): void {
  db.transaction((tx) => {
    const [session] = tx.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1).all();
    if (!session || session.status !== 'in_progress') return;

    const rows = tx
      .select({
        weightKg: sets.weightKg,
        reps: sets.reps,
        kind: sets.kind,
        completedAt: sets.completedAt,
      })
      .from(sets)
      .innerJoin(sessionExercises, eq(sessionExercises.id, sets.sessionExerciseId))
      .where(eq(sessionExercises.sessionId, sessionId))
      .all();

    const now = Date.now();
    tx.update(sessions)
      .set({
        status: 'abandoned',
        endedAt: now,
        totalVolumeKg: totalVolume(rows),
        totalSets: countWorkingSets(rows),
        durationSec: elapsedSec(session.startedAt, session.pausedMs, now),
        restUntil: null,
        currentSessionExerciseId: null,
        currentSetId: null,
      })
      .where(eq(sessions.id, sessionId))
      .run();
  });
}

/**
 * The next thing to dial: the first unlogged set after this one, wrapping to
 * anything still unfinished earlier in the session. Wrapping is what makes the
 * last set of the last exercise land somewhere useful rather than nowhere.
 */
function nextIncompleteSet(
  tx: Tx,
  sessionId: string,
  afterExercisePosition: number,
  afterSetPosition: number,
): { id: string; sessionExerciseId: string } | null {
  const open = tx
    .select({
      id: sets.id,
      sessionExerciseId: sets.sessionExerciseId,
      exercisePosition: sessionExercises.position,
      position: sets.position,
    })
    .from(sets)
    .innerJoin(sessionExercises, eq(sessionExercises.id, sets.sessionExerciseId))
    .where(
      and(
        eq(sessionExercises.sessionId, sessionId),
        isNull(sets.completedAt),
        isNull(sessionExercises.removedAt),
      ),
    )
    .orderBy(asc(sessionExercises.position), asc(sets.position))
    .all();

  if (open.length === 0) return null;
  const after = open.find(
    (s) =>
      s.exercisePosition > afterExercisePosition ||
      (s.exercisePosition === afterExercisePosition && s.position > afterSetPosition),
  );
  return after ?? open[0];
}
