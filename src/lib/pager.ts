/**
 * The live pager's release maths. Worklet-safe: plain functions, no closures.
 * Pager convention: a finger moving left asks for the next set, up for the next exercise.
 */
export type Swipe = 'nextSet' | 'prevSet' | 'nextExercise' | 'prevExercise';

/** Past this fraction of the pager's width a release commits. */
export const COMMIT_FRACTION = 0.3;
/** A release faster than this (pt/s) commits in its own direction and cancels against it. */
export const FLING_VELOCITY = 500;
/** Android's back gesture owns up to ~40dp of each edge at the widest sensitivity. */
export const EDGE_BAND = 40;

export function swipeIntent(
  axis: 'x' | 'y',
  translation: number,
  velocity: number,
  extent: number,
): Swipe | null {
  'worklet';
  if (Math.abs(velocity) > FLING_VELOCITY) {
    if (Math.sign(velocity) !== Math.sign(translation)) return null;
  } else if (Math.abs(translation) < extent * COMMIT_FRACTION) {
    return null;
  }
  return heading(axis, translation);
}

/** The swipe a drag in progress is heading for, so the page knows whether there is anywhere to go. */
export function heading(axis: 'x' | 'y', translation: number): Swipe {
  'worklet';
  if (axis === 'x') return translation < 0 ? 'nextSet' : 'prevSet';
  return translation < 0 ? 'nextExercise' : 'prevExercise';
}

/** Travel past an end: approaches `extent * 0.55` and never reaches it. */
export function rubberBand(translation: number, extent: number): number {
  'worklet';
  const pull = Math.abs(translation);
  return Math.sign(translation) * extent * 0.55 * (1 - 1 / ((pull * 0.55) / extent + 1));
}

export function inEdgeBand(x: number, width: number): boolean {
  'worklet';
  return x < EDGE_BAND || x > width - EDGE_BAND;
}
