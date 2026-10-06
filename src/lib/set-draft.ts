export type SetValues = { weightKg: number | null; reps: number | null; rpe: number | null };
export type SetDraft = Partial<SetValues>;

const KEYS = ['weightKg', 'reps', 'rpe'] as const;

const same = (a: number | null, b: number | null) =>
  a === b || (a != null && b != null && Math.abs(a - b) < 1e-6);

export function applyDraft(stored: SetValues, draft: SetDraft | null): SetValues {
  return { ...stored, ...draft };
}

export function draftPatch(stored: SetValues, draft: SetDraft | null): SetDraft {
  const patch: SetDraft = {};
  if (!draft) return patch;
  for (const key of KEYS) {
    const value = draft[key];
    if (value !== undefined && !same(stored[key], value)) patch[key] = value;
  }
  return patch;
}
