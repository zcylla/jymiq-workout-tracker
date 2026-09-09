import type { Scale } from './scale.ts';
import { roundToStep } from './units.ts';

/**
 * Turns the digits typed into the numeric keypad into a value snapped to the
 * scale's step and clamped into range. Null means nothing sane was entered —
 * the confirm button stays disabled rather than writing garbage.
 */
export function resolveKeypadValue(entered: string, scale: Scale): number | null {
  if (entered === '' || entered === '.') return null;
  const n = Number(entered);
  if (!Number.isFinite(n)) return null;
  return Math.min(scale.hi, Math.max(scale.lo, roundToStep(n, scale.step)));
}
