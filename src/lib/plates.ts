import { floorToStep, type Kg } from './units.ts';

export interface PlateInventory {
  /** Kilograms per plate, and how many are available PER SIDE. */
  readonly plates: readonly { kg: number; count: number }[];
}

export interface PlateSolution {
  /** Descending, per side: [25, 15, 1.25] */
  perSide: number[];
  achievedKg: Kg;
  /** target − achieved. Non-zero means unreachable — show it, do not hide it. */
  residualKg: Kg;
}

/** Competition coding (Lab 17/37), the default. Geometry is real: height is diameter. */
export const DEFAULT_INVENTORY: PlateInventory = {
  plates: [
    { kg: 25, count: 4 },
    { kg: 20, count: 4 },
    { kg: 15, count: 2 },
    { kg: 10, count: 2 },
    { kg: 5, count: 2 },
    { kg: 2.5, count: 2 },
    { kg: 1.25, count: 2 },
  ],
};

export const PLATE_COLORS: Record<'competition' | 'plain', Record<number, string>> = {
  competition: {
    25: '#c0392b',
    20: '#2d6cb5',
    15: '#d9a92b',
    10: '#3f8f4f',
    5: '#e8e6e1',
    2.5: '#b3312a',
    1.25: '#c9c8c4',
  },
  plain: {
    25: '#8c8677',
    20: '#8c8677',
    15: '#7d7666',
    10: '#7d7666',
    5: '#5a5449',
    2.5: '#5a5449',
    1.25: '#a8a091',
  },
};

const UNIT = 0.25; // the finest plate that exists is 1.25 kg

/**
 * Closest loadable weight at or below the target, in plates.
 *
 * Heaviest-first search with backtracking, not a greedy walk. Greedy is wrong on
 * real inventories: 25 a side from {20, 15, 10} takes the 20 and then strands 5,
 * where 15 + 10 is exact. Searching heaviest-first and backtracking gives both
 * correctness and the conventional loading order — 102.5 on a 20 kg bar comes
 * out 25 + 15 + 1.25, not 20 + 20 + 1.25, which is the same weight in more
 * plates than a lifter would reach for.
 */
export function solvePlates(
  targetKg: Kg,
  barKg: Kg,
  inv: PlateInventory = DEFAULT_INVENTORY,
): PlateSolution {
  const perSideTarget = (targetKg - barKg) / 2;
  if (perSideTarget <= 0) {
    return { perSide: [], achievedKg: barKg, residualKg: targetKg - barKg };
  }
  // Floor, not round: the contract is "at or below the target". Rounding up would
  // let a converted-from-pounds target load MORE than was asked for.
  const target = Math.floor(perSideTarget / UNIT + 1e-9);
  const plates = [...inv.plates]
    .filter((p) => p.kg > 0 && p.count > 0)
    .sort((a, b) => b.kg - a.kg)
    .map((p) => ({ units: Math.round(p.kg / UNIT), kg: p.kg, count: p.count }));

  let bestSum = 0;
  let bestPick: number[] = [];
  const pick: number[] = [];
  // The inventory is user-configurable, so the branching factor is not ours to
  // trust. Visiting each (plate index, sum) once bounds the search to
  // types x target instead of the product of the counts.
  const seen = new Set<number>();

  const visit = (i: number, sum: number) => {
    if (sum > bestSum) {
      bestSum = sum;
      bestPick = [...pick];
    }
    if (sum === target || i >= plates.length) return;
    const key = i * (target + 1) + sum;
    if (seen.has(key)) return;
    seen.add(key);
    const p = plates[i];
    const room = Math.min(p.count, Math.floor((target - sum) / p.units));
    // Heaviest-first, most-of-it-first: the first exact hit is the conventional load.
    for (let take = room; take >= 0; take--) {
      for (let k = 0; k < take; k++) pick.push(p.kg);
      visit(i + 1, sum + take * p.units);
      for (let k = 0; k < take; k++) pick.pop();
      if (bestSum === target) return;
    }
  };
  visit(0, 0);

  const achievedKg = Math.round((barKg + 2 * bestSum * UNIT) * 100) / 100;
  return {
    perSide: bestPick,
    achievedKg,
    residualKg: Math.round((targetKg - achievedKg) * 100) / 100,
  };
}

/** Nearest weight the bar can actually hold, for snapping a dialled value. */
export function nearestLoadable(
  targetKg: Kg,
  barKg: Kg,
  inv: PlateInventory = DEFAULT_INVENTORY,
): Kg {
  return solvePlates(targetKg, barKg, inv).achievedKg;
}

export interface WarmupStep {
  weightKg: Kg;
  reps: number;
  percent: number;
}

/**
 * The ramp from the research: 40% × 5, 60% × 3, 75% × 2, 85% × 1.
 * Weights round DOWN to the increment — a warm-up must never out-weigh itself —
 * and steps at or below the bar are dropped, as are repeats.
 */
export function warmupRamp(
  workKg: Kg,
  opts: {
    ramp?: readonly number[];
    reps?: readonly number[];
    barKg?: Kg;
    incrementKg?: number;
  } = {},
): WarmupStep[] {
  const ramp = opts.ramp ?? [0.4, 0.6, 0.75, 0.85];
  const reps = opts.reps ?? [5, 3, 2, 1];
  const bar = opts.barKg ?? 20;
  const inc = opts.incrementKg ?? 2.5;
  const out: WarmupStep[] = [];
  ramp.forEach((pct, i) => {
    const raw = floorToStep(workKg * pct, inc);
    if (raw <= bar) return;
    if (out.length && out[out.length - 1].weightKg === raw) return;
    out.push({ weightKg: raw, reps: reps[i] ?? reps[reps.length - 1], percent: pct });
  });
  return out;
}
