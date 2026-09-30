import { estimate1RM } from './e1rm.ts';
import { formatWeight, type Kg } from './units.ts';

/** This set's load against last time's, signed: "+2.5", "−2.5", or "±0" when it is the same. */
export function loadDelta(nowKg: Kg, thenKg: Kg): { text: string; sign: -1 | 0 | 1 } {
  const d = Math.round((nowKg - thenKg) * 100) / 100;
  if (d === 0) return { text: '±0', sign: 0 };
  return d > 0
    ? { text: `+${formatWeight(d)}`, sign: 1 }
    : { text: `−${formatWeight(-d)}`, sign: -1 };
}

/**
 * The live readout's e1RM: the best estimate among the sets already logged for
 * this exercise, or — before any is logged — the one the dialled load and reps imply.
 */
export function liveE1rm(
  logged: readonly { completedAt: number | null; e1rmKg: Kg | null }[],
  loadKg: Kg,
  reps: number,
): Kg | null {
  let best: Kg | null = null;
  for (const s of logged) {
    if (s.completedAt == null || s.e1rmKg == null) continue;
    if (best == null || s.e1rmKg > best) best = s.e1rmKg;
  }
  return best ?? estimate1RM(loadKg, reps);
}
