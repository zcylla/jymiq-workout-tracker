import type { RoutineChange } from './routine-diff.ts';
import { formatWeight, type Kg, type Unit } from './units.ts';

export interface ChangeText {
  tag: string;
  title: string;
  detail: string;
}

const FALLBACK_NAME = 'Exercise';

const count = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 'S'}`;

interface Target {
  targetSets: number;
  targetReps: number | null;
  targetWeightKg: Kg | null;
}

/** The routine detail's lift meta without the rest: "3 × 10 @ 60 KG", "3 SETS". */
function targetDetail(t: Target, unit: Unit): string {
  const head =
    t.targetReps == null ? count(t.targetSets, 'SET') : `${t.targetSets} × ${t.targetReps}`;
  return t.targetWeightKg == null
    ? head
    : `${head} @ ${formatWeight(t.targetWeightKg, unit)} ${unit.toUpperCase()}`;
}

/**
 * How one proposed routine change reads on the summary: a tag, the lift, and what
 * moves. Mono detail lines are upper-case in this app, as the routine's lift meta is.
 */
export function describeChange(
  change: RoutineChange,
  names: Readonly<Record<string, string>>,
  unit: Unit,
): ChangeText {
  const name = (exerciseId: string) => names[exerciseId] ?? FALLBACK_NAME;
  switch (change.kind) {
    case 'add':
      return { tag: 'ADD', title: name(change.exerciseId), detail: targetDetail(change, unit) };
    case 'remove':
      return { tag: 'REMOVE', title: name(change.exerciseId), detail: 'NOT DONE THIS SESSION' };
    case 'swap':
      return {
        tag: 'SWAP',
        title: `${name(change.fromExerciseId)} → ${name(change.toExerciseId)}`,
        detail: targetDetail(change, unit),
      };
    case 'sets':
      return {
        tag: 'SETS',
        title: name(change.exerciseId),
        detail: `${change.from} → ${count(change.to, 'SET')}`,
      };
    case 'reps':
      return {
        tag: 'REPS',
        title: name(change.exerciseId),
        detail: `${change.from} → ${count(change.to, 'REP')}`,
      };
    case 'load':
      return {
        tag: 'LOAD',
        title: name(change.exerciseId),
        detail: `${formatWeight(change.fromKg, unit)} → ${formatWeight(change.toKg, unit)} ${unit.toUpperCase()}`,
      };
  }
}
