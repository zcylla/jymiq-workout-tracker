/**
 * The tape and ring scales (Lab 31/33). Plain functions with no closures so
 * they are safe to call from a worklet.
 */
export interface Scale {
  lo: number;
  hi: number;
  step: number;
  /** Every nth tick is a major rule. */
  major: number;
  /** Every nth tick carries a numeral. */
  label: number;
  /** Number of detents. */
  n: number;
}

export function makeScale(
  lo: number,
  hi: number,
  step: number,
  major: number,
  label: number,
): Scale {
  return { lo, hi, step, major, label, n: Math.round((hi - lo) / step) + 1 };
}

export function valueAt(s: Scale, index: number): number {
  'worklet';
  return Math.round((s.lo + index * s.step) * 1000) / 1000;
}

export function indexOf(s: Scale, value: number): number {
  'worklet';
  const i = Math.round((value - s.lo) / s.step);
  return i < 0 ? 0 : i > s.n - 1 ? s.n - 1 : i;
}

export function clampIndex(s: Scale, index: number): number {
  'worklet';
  return index < 0 ? 0 : index > s.n - 1 ? s.n - 1 : index;
}

/** Load 20–140 by 2.5: every detent is a weight you can actually load. */
export const LOAD_SCALE = makeScale(20, 140, 2.5, 4, 8);
export const REPS_SCALE = makeScale(1, 15, 1, 5, 5);
/** Whole points only — RIR = 10 − RPE maps cleanly and half points on a
 *  subjective scale are mostly false precision. */
export const RPE_SCALE = makeScale(1, 10, 1, 1, 1);
