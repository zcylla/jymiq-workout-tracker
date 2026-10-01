import { estimate1RM } from './e1rm.ts';
import type { Kg } from './units.ts';
import { type SetLike, topSet, totalVolume, wasPerformed } from './volume.ts';

export interface SummarySet extends SetLike {
  rpe: number | null;
  e1rmKg: Kg | null;
}

export interface SummaryStats {
  totalReps: number | null;
  heaviestSet: SetLike | null;
  bestE1rmKg: Kg | null;
  averageRpe: number | null;
  densityKgPerMinute: Kg | null;
}

export function sessionSummaryStats(
  sets: readonly SummarySet[],
  durationSec: number | null,
): SummaryStats {
  const working = sets.filter((s) => wasPerformed(s) && s.kind !== 'warmup');
  const withReps = working.filter((s) => s.reps != null);
  const withLoad = withReps.filter((s) => s.weightKg != null);
  const withRpe = working.filter((s) => s.rpe != null);
  let bestE1rmKg: Kg | null = null;
  for (const s of working) {
    const estimate =
      s.e1rmKg ?? (s.weightKg != null && s.reps != null ? estimate1RM(s.weightKg, s.reps) : null);
    if (estimate != null && (bestE1rmKg == null || estimate > bestE1rmKg)) bestE1rmKg = estimate;
  }

  return {
    totalReps: withReps.length ? withReps.reduce((sum, s) => sum + s.reps!, 0) : null,
    heaviestSet: topSet(withLoad),
    bestE1rmKg,
    averageRpe: withRpe.length
      ? withRpe.reduce((sum, s) => sum + s.rpe!, 0) / withRpe.length
      : null,
    densityKgPerMinute:
      durationSec != null && durationSec > 0 && withLoad.length
        ? totalVolume(working) / (durationSec / 60)
        : null,
  };
}
