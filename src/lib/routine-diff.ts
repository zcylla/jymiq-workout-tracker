import { isWorkingSet } from './set-groups.ts';
import type { Kg } from './units.ts';
import { type SetLike, topSet, wasPerformed } from './volume.ts';

export interface PlanLine {
  id: string;
  exerciseId: string;
  position: number;
  targetSets: number;
  targetReps: number | null;
  targetWeightKg: Kg | null;
}

export interface SessionExerciseInput {
  id: string;
  exerciseId: string;
  routineExerciseId: string | null;
  addedMidSession: boolean;
  removedAt: number | null;
  position: number;
  plannedSets: number | null;
  sets: readonly SetLike[];
}

export interface AddChange {
  kind: 'add';
  key: string;
  exerciseId: string;
  targetSets: number;
  targetReps: number | null;
  targetWeightKg: Kg | null;
}

export interface RemoveChange {
  kind: 'remove';
  key: string;
  routineExerciseId: string;
  exerciseId: string;
}

export interface SwapChange {
  kind: 'swap';
  key: string;
  routineExerciseId: string;
  fromExerciseId: string;
  toExerciseId: string;
  targetSets: number;
  targetReps: number | null;
  targetWeightKg: Kg | null;
}

export interface SetsChange {
  kind: 'sets';
  key: string;
  routineExerciseId: string;
  exerciseId: string;
  from: number;
  to: number;
}

export interface RepsChange {
  kind: 'reps';
  key: string;
  routineExerciseId: string;
  exerciseId: string;
  from: number;
  to: number;
}

export interface LoadChange {
  kind: 'load';
  key: string;
  routineExerciseId: string;
  exerciseId: string;
  fromKg: Kg;
  toKg: Kg;
}

export type RoutineChange =
  | AddChange
  | RemoveChange
  | SwapChange
  | SetsChange
  | RepsChange
  | LoadChange;

const LOAD_TOLERANCE_KG = 0.01;

const loggedWork = (sets: readonly SetLike[]): SetLike[] =>
  sets.filter((s) => wasPerformed(s) && isWorkingSet(s));

function targetsOf(done: readonly SetLike[]) {
  const top = topSet(done);
  const reps = done.flatMap((s) => (s.reps == null ? [] : [s.reps]));
  return {
    targetSets: done.length,
    targetReps: top?.reps ?? (reps.length ? Math.max(...reps) : null),
    targetWeightKg: top?.weightKg ?? null,
  };
}

function uniform(values: readonly (number | null)[], tolerance: number): number | null {
  const first = values[0];
  if (first == null) return null;
  return values.every((v) => v != null && Math.abs(v - first) <= tolerance) ? first : null;
}

function replacement(
  old: SessionExerciseInput,
  exercises: readonly SessionExerciseInput[],
): SessionExerciseInput | null {
  let cur = old;
  for (;;) {
    const next = exercises.find(
      (e) =>
        e.position === cur.position + 1 &&
        e.addedMidSession &&
        e.routineExerciseId == null &&
        e.plannedSets != null &&
        e.plannedSets === old.plannedSets,
    );
    if (!next) return null;
    if (next.removedAt == null) return next;
    if (next.sets.some(wasPerformed)) return null;
    cur = next;
  }
}

/**
 * What the session did differently from the routine as it stands now, so a change
 * already saved to the routine stops being reported. Ordered by routine line, then
 * sets, reps, load per line; additions last, in session order.
 */
export function routineChanges(
  lines: readonly PlanLine[],
  exercises: readonly SessionExerciseInput[],
): RoutineChange[] {
  const byLine = new Map<string, SessionExerciseInput[]>();
  for (const e of exercises) {
    if (e.routineExerciseId == null) continue;
    byLine.set(e.routineExerciseId, [...(byLine.get(e.routineExerciseId) ?? []), e]);
  }

  const changes: RoutineChange[] = [];
  const replacements = new Set<string>();

  function compareTargets(line: PlanLine, done: readonly SetLike[]): void {
    const routineExerciseId = line.id;
    const exerciseId = line.exerciseId;
    if (!done.length) return;
    if (done.length !== line.targetSets) {
      changes.push({
        kind: 'sets',
        key: `sets:${line.id}`,
        routineExerciseId,
        exerciseId,
        from: line.targetSets,
        to: done.length,
      });
    }
    const reps = uniform(
      done.map((s) => s.reps),
      0,
    );
    if (reps != null && line.targetReps != null && reps !== line.targetReps) {
      changes.push({
        kind: 'reps',
        key: `reps:${line.id}`,
        routineExerciseId,
        exerciseId,
        from: line.targetReps,
        to: reps,
      });
    }
    const kg = uniform(
      done.map((s) => s.weightKg),
      LOAD_TOLERANCE_KG,
    );
    if (
      kg != null &&
      line.targetWeightKg != null &&
      Math.abs(kg - line.targetWeightKg) > LOAD_TOLERANCE_KG
    ) {
      changes.push({
        kind: 'load',
        key: `load:${line.id}`,
        routineExerciseId,
        exerciseId,
        fromKg: line.targetWeightKg,
        toKg: kg,
      });
    }
  }

  for (const line of [...lines].sort((a, b) => a.position - b.position)) {
    const linked = byLine.get(line.id);
    if (linked?.length !== 1) continue;
    const [e] = linked;
    const routineExerciseId = line.id;
    const exerciseId = line.exerciseId;

    if (e.removedAt != null) {
      if (e.sets.some(wasPerformed)) continue;
      const next = replacement(e, exercises);
      if (!next) {
        changes.push({ kind: 'remove', key: `remove:${line.id}`, routineExerciseId, exerciseId });
        continue;
      }
      replacements.add(next.id);
      const done = loggedWork(next.sets);
      if (next.exerciseId === line.exerciseId) {
        compareTargets(line, done);
      } else if (done.length) {
        changes.push({
          kind: 'swap',
          key: `swap:${line.id}`,
          routineExerciseId,
          fromExerciseId: line.exerciseId,
          toExerciseId: next.exerciseId,
          ...targetsOf(done),
        });
      }
      continue;
    }

    compareTargets(line, loggedWork(e.sets));
  }

  const linkedThisSession = new Set(exercises.flatMap((e) => e.routineExerciseId ?? []));
  const savedEarlier = lines.filter((l) => !linkedThisSession.has(l.id));
  for (const e of [...exercises].sort((a, b) => a.position - b.position)) {
    if (!e.addedMidSession || e.removedAt != null || replacements.has(e.id)) continue;
    const done = loggedWork(e.sets);
    if (!done.length) continue;
    const saved = savedEarlier.findIndex((l) => l.exerciseId === e.exerciseId);
    if (saved >= 0) {
      savedEarlier.splice(saved, 1);
      continue;
    }
    changes.push({ kind: 'add', key: `add:${e.id}`, exerciseId: e.exerciseId, ...targetsOf(done) });
  }

  return changes;
}
