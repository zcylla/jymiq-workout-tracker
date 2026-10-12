import { clampIndex, type Scale } from './scale.ts';

/** How far past the half-way line, in detents, a held scrub must go before it changes detent. */
export const SCRUB_HYSTERESIS = 0.15;

export const SNAP_BELOW_DPS = 3;
export const FREE_ABOVE_DPS = 12;
export const GLIDE_SECONDS = 0.45;
export const SNAP_SECONDS = 0.04;
export const DRAG_MAGNET = 0.6;
export const LAND_WITHIN_DETENTS = 0.02;

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

export function freedom(v: number): number {
  'worklet';
  const t = Math.min(
    Math.max((Math.abs(v) - SNAP_BELOW_DPS) / (FREE_ABOVE_DPS - SNAP_BELOW_DPS), 0),
    1,
  );
  return t * t * (3 - 2 * t);
}

export function magnet(s: Scale, raw: number, current: number, v: number): number {
  'worklet';
  const at = Math.min(Math.max(raw, 0), s.n - 1);
  const k = DRAG_MAGNET * (1 - freedom(v));
  const hysteresis = Math.min(SCRUB_HYSTERESIS, (0.5 * k) / (1 - k));
  const held = Math.abs(at - current) > 0.5 + hysteresis ? clampIndex(s, Math.round(at)) : current;
  return at + k * (held - at);
}

export function release(s: Scale, pos: number, v: number) {
  'worklet';
  const free = freedom(v);
  const target = clampIndex(s, Math.round(pos + v * GLIDE_SECONDS * free));
  const tau = Math.max(SNAP_SECONDS, GLIDE_SECONDS * free);
  const gap = target - pos;
  const stiffness = 1 / (tau * tau);
  return {
    target,
    config: {
      mass: 1,
      stiffness,
      damping: 2 * Math.sqrt(stiffness),
      velocity: gap / tau,
      overshootClamping: true,
      energyThreshold: (LAND_WITHIN_DETENTS / Math.max(Math.abs(gap), LAND_WITHIN_DETENTS)) ** 2,
    },
  };
}
