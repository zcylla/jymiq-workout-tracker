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
  return {
    loadKg: target?.loadKg ?? baseline?.loadKg ?? null,
    reps: target?.reps ?? baseline?.reps ?? null,
    rpe: target?.rpe ?? baseline?.rpe ?? null,
  };
}

export function canCarrySetDefaults(set: {
  completedAt: number | null;
  createdAt: number;
  updatedAt: number;
}): boolean {
  return set.completedAt == null && set.updatedAt === set.createdAt;
}
