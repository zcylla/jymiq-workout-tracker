import type { Kg } from './units.ts';

export type E1rmFormula = 'epley' | 'brzycki';

/** Reps beyond this make both formulae unreliable (§6 research). */
export const E1RM_MAX_REPS = 12;

/**
 * Estimated one-rep max.
 *
 * Epley `w * (1 + reps/30)` and Brzycki `w * 36/(37 - reps)` agree under about
 * six reps and diverge above. Both are meaningless past ten to twelve, so this
 * returns null there rather than a number nobody should trust — the set log
 * renders that as an em dash.
 */
export function estimate1RM(weightKg: Kg, reps: number, formula: E1rmFormula = 'epley'): Kg | null {
  if (!Number.isFinite(weightKg) || weightKg <= 0) return null;
  if (!Number.isInteger(reps) || reps < 1 || reps > E1RM_MAX_REPS) return null;
  if (reps === 1) return weightKg;
  const raw = formula === 'epley' ? weightKg * (1 + reps / 30) : (weightKg * 36) / (37 - reps);
  return Math.round(raw * 100) / 100;
}

/** Inverse: the load that should be movable for a given rep count. */
export function loadForReps(oneRmKg: Kg, reps: number, formula: E1rmFormula = 'epley'): Kg {
  if (reps <= 1) return oneRmKg;
  const raw = formula === 'epley' ? oneRmKg / (1 + reps / 30) : (oneRmKg * (37 - reps)) / 36;
  return Math.round(raw * 100) / 100;
}

/** The "79% OF 1RM" line under the dial core. */
export function percentOf1RM(weightKg: Kg, oneRmKg: Kg): number {
  if (oneRmKg <= 0) return 0;
  return Math.round((weightKg / oneRmKg) * 100);
}
