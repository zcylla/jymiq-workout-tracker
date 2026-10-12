import { and, asc, desc, eq } from 'drizzle-orm';
import { useMemo } from 'react';

import { type RoutineChange, routineChanges } from '@/lib/routine-diff';

import { db } from '../db';
import { useRows } from '../live';
import { exercises, type Routine, type Session, sessionExercises, sessions } from '../schema';
import { routineExercisesQuery, routineQuery } from './routines';
import { sessionQuery, sessionSetsQuery } from './sessions';

export interface RoutineChanges {
  routineId: string;
  routineName: string;
  changes: RoutineChange[];
  /** Exercise id to name, for every lift the routine or the session names. */
  names: Record<string, string>;
}

/** The newest completed session of a routine. Only that one may propose targets. */
export function latestRoutineSessionQuery(routineId: string) {
  return db
    .select({ id: sessions.id })
    .from(sessions)
    .where(and(eq(sessions.routineId, routineId), eq(sessions.status, 'completed')))
    .orderBy(desc(sessions.startedAt), desc(sessions.id))
    .limit(1);
}

/** Every lift of a session, removed ones included: the diff needs to see what was dropped. */
export function routineDiffExercisesQuery(sessionId: string) {
  return db
    .select({
      id: sessionExercises.id,
      exerciseId: sessionExercises.exerciseId,
      routineExerciseId: sessionExercises.routineExerciseId,
      addedMidSession: sessionExercises.addedMidSession,
      removedAt: sessionExercises.removedAt,
      position: sessionExercises.position,
      plannedSets: sessionExercises.plannedSets,
      name: exercises.name,
    })
    .from(sessionExercises)
    .innerJoin(exercises, eq(exercises.id, sessionExercises.exerciseId))
    .where(eq(sessionExercises.sessionId, sessionId))
    .orderBy(asc(sessionExercises.position));
}

type Lines = Awaited<ReturnType<typeof routineExercisesQuery>>;
type SessionLifts = Awaited<ReturnType<typeof routineDiffExercisesQuery>>;
type SessionSets = Awaited<ReturnType<typeof sessionSetsQuery>>;

/** Null unless this is the routine's latest completed session and the routine is still live. */
export function composeRoutineChanges(input: {
  session: Pick<Session, 'id' | 'routineId' | 'status'>;
  latestSessionId: string | null;
  routine: Pick<Routine, 'id' | 'name' | 'archivedAt'> | null;
  lines: Lines;
  lifts: SessionLifts;
  sets: SessionSets;
}): RoutineChanges | null {
  const { session, routine, lifts } = input;
  if (session.status !== 'completed' || session.routineId == null) return null;
  if (!routine || routine.archivedAt != null || routine.id !== session.routineId) return null;
  if (input.latestSessionId !== session.id) return null;

  const exerciseInputs = lifts.map((e) => ({
    ...e,
    sets: input.sets.filter((s) => s.sessionExerciseId === e.id),
  }));

  const names: Record<string, string> = {};
  for (const e of [...input.lines, ...lifts]) names[e.exerciseId] = e.name;

  return {
    routineId: routine.id,
    routineName: routine.name,
    changes: routineChanges(input.lines, exerciseInputs),
    names,
  };
}

/**
 * What a finished session changed against its routine, live: saving a change to
 * the routine rewrites `routine_exercises` and the change drops out on its own.
 * Null while loading and whenever there is nothing to offer. One subscription
 * per table, because `useLiveQuery` only watches the table in `FROM`.
 */
export function useRoutineChanges(sessionId: string): RoutineChanges | null {
  const found = useRows(
    useMemo(() => sessionQuery(sessionId), [sessionId]),
    [sessionId],
  );
  const session = found?.[0];
  const routineId = session?.routineId ?? '';

  const latest = useRows(
    useMemo(() => latestRoutineSessionQuery(routineId), [routineId]),
    [routineId],
  );
  const routineRows = useRows(
    useMemo(() => routineQuery(routineId), [routineId]),
    [routineId],
  );
  const lines = useRows(
    useMemo(() => routineExercisesQuery(routineId), [routineId]),
    [routineId],
  );
  const lifts = useRows(
    useMemo(() => routineDiffExercisesQuery(sessionId), [sessionId]),
    [sessionId],
  );
  const sets = useRows(
    useMemo(() => sessionSetsQuery(sessionId), [sessionId]),
    [sessionId],
  );

  return useMemo(() => {
    if (!session || !latest || !routineRows || !lines || !lifts || !sets) return null;
    return composeRoutineChanges({
      session,
      latestSessionId: latest[0]?.id ?? null,
      routine: routineRows[0] ?? null,
      lines,
      lifts,
      sets,
    });
  }, [session, latest, routineRows, lines, lifts, sets]);
}
