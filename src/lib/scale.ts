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
  /** Ascending detent values for a scale whose step changes; `lo`, `hi` and `step` describe the ends. */
  stops?: readonly number[];
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

export function makeStopsScale(stops: readonly number[]): Scale {
  return {
    lo: stops[0],
    hi: stops[stops.length - 1],
    step: stops[1] - stops[0],
    major: 1,
    label: 1,
    n: stops.length,
    stops,
  };
}

export function valueAt(s: Scale, index: number): number {
  'worklet';
  if (s.stops) return s.stops[index < 0 ? 0 : index > s.n - 1 ? s.n - 1 : index];
  return Math.round((s.lo + index * s.step) * 1000) / 1000;
}

export function indexOf(s: Scale, value: number): number {
  'worklet';
  if (s.stops) {
    let best = 0;
    for (let i = 1; i < s.n; i++) {
      if (Math.abs(s.stops[i] - value) < Math.abs(s.stops[best] - value)) best = i;
    }
    return best;
  }
  const i = Math.round((value - s.lo) / s.step);
  return i < 0 ? 0 : i > s.n - 1 ? s.n - 1 : i;
}

export function clampIndex(s: Scale, index: number): number {
  'worklet';
  return index < 0 ? 0 : index > s.n - 1 ? s.n - 1 : index;
}

/**
 * The load steps Settings offers, in kilograms. The live screen is kilograms
 * whatever the display unit, so these are not converted.
 */
export const LOAD_STEPS_KG = [1, 1.25, 2.5, 5] as const;

/**
 * Load 20–140 by `step`: every detent is a weight you can actually load. The
 * ends are multiples of every offered step, so the span never moves, and a rule
 * lands every 10 kg and a numeral every 20 whatever the step.
 */
export const loadScale = (step: number) => makeScale(20, 140, step, 10 / step, 20 / step);
export const LOAD_SCALE = loadScale(2.5);
export const REPS_SCALE = makeScale(1, 15, 1, 5, 5);
/**
 * A routine's targets are typed, never dialled, so these bound what a keypad may
 * write rather than what a tape can show. The load is in whatever unit the user
 * trains in; `toKg` turns it into what is stored.
 */
export const TARGET_SETS_SCALE = makeScale(1, 20, 1, 5, 5);
export const TARGET_REPS_SCALE = makeScale(1, 100, 1, 10, 10);
export const TARGET_LOAD_SCALE = makeScale(0.25, 999, 0.25, 4, 4);
/** Pounds show one decimal, so a quarter-pound step would be accepted and then read back rounded. */
const TARGET_LOAD_SCALE_LB = makeScale(0.5, 999, 0.5, 4, 4);
export const targetLoadScale = (unit: 'kg' | 'lb') =>
  unit === 'kg' ? TARGET_LOAD_SCALE : TARGET_LOAD_SCALE_LB;
/** Whole points only — RIR = 10 − RPE maps cleanly and half points on a
 *  subjective scale are mostly false precision. */
export const WEEKLY_GOAL_SCALE = makeScale(1, 7, 1, 1, 1);
export const RPE_SCALE = makeScale(1, 10, 1, 1, 1);

/**
 * Rest, in seconds: 5 s detents to 2:00, 15 s to 5:00, 30 s to 10:00. Fine where
 * a rest is decided by feel, coarse where a few seconds no longer matter.
 */
const restStops: number[] = [];
for (let sec = 15; sec <= 120; sec += 5) restStops.push(sec);
for (let sec = 135; sec <= 300; sec += 15) restStops.push(sec);
for (let sec = 330; sec <= 600; sec += 30) restStops.push(sec);
export const REST_SCALE = makeStopsScale(restStops);

export const snapTo = (s: Scale, value: number): number => valueAt(s, indexOf(s, value));

/** `value + delta` snapped to a detent; a tie resolves in the direction of travel, and a step always moves. */
export function stepBy(s: Scale, value: number, delta: number): number {
  const target = value + delta;
  const from = indexOf(s, value);
  let to = indexOf(s, target);
  if (delta > 0 && to < s.n - 1 && valueAt(s, to) < target) {
    if (valueAt(s, to + 1) - target === target - valueAt(s, to)) to += 1;
  }
  if (to === from) to = clampIndex(s, from + (delta > 0 ? 1 : -1));
  return valueAt(s, to);
}
