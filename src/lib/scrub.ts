import { clampIndex, type Scale } from './scale.ts';

/** How far past the half-way line, in detents, a held scrub must go before it changes detent. */
export const SCRUB_HYSTERESIS = 0.15;

/**
 * The detent a held scrub sits on. Same direction as the tape: dragging up
 * (negative `translationY`) raises the index. `current` only moves once the
 * finger is more than half a row plus `SCRUB_HYSTERESIS` away from it, so a
 * finger resting on a boundary does not flicker between two detents. The
 * detents crossed are `result - current`.
 */
export function scrubIndex(
  s: Scale,
  start: number,
  translationY: number,
  row: number,
  current: number,
): number {
  'worklet';
  const raw = Math.min(Math.max(start - translationY / row, 0), s.n - 1);
  if (Math.abs(raw - current) <= 0.5 + SCRUB_HYSTERESIS) return current;
  return clampIndex(s, Math.round(raw));
}
