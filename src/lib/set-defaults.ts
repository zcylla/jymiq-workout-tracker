import type { SetKind } from './volume.ts';

export interface SetParameters {
  loadKg: number | null;
  reps: number | null;
  rpe: number | null;
}

export function setDefaults(
  previous: SetParameters | null,
  lastSession: readonly (SetParameters & { position: number })[],
  position: number,
  target: SetParameters | null,
): SetParameters {
  const baseline =
    previous ?? lastSession.find((s) => s.position === position) ?? lastSession.at(-1);
  const defaults = baseline ?? target;
  return {
    loadKg: defaults?.loadKg ?? null,
    reps: defaults?.reps ?? null,
    rpe: defaults?.rpe ?? null,
  };
}

export function canCarrySetDefaults(
  set: {
    completedAt: number | null;
    createdAt: number;
    updatedAt: number;
    kind?: SetKind;
  },
  sourceKind: SetKind = 'working',
): boolean {
  return (
    sourceKind !== 'warmup' &&
    sourceKind !== 'drop' &&
    set.kind !== 'warmup' &&
    set.kind !== 'drop' &&
    set.completedAt == null &&
    set.updatedAt === set.createdAt
  );
}
