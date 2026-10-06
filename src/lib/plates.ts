import { floorToStep, type Kg, toDisplay, type Unit } from './units.ts';

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

export interface LoadSolution {
  /** Descending, per side, in the unit the target was given in. */
  perSide: number[];
  achieved: number;
  /** target − achieved. Non-zero means unreachable — show it, do not hide it. */
  residual: number;
}

/** Plates available PER SIDE, by denomination, kept separately for each unit — never converted. */
export type PlateCounts = Record<Unit, Record<number, number>>;

export const PLATE_COUNT_MAX = 8;

export const PLATE_DENOMINATIONS: Record<Unit, readonly number[]> = {
  kg: [25, 20, 15, 10, 5, 2.5, 1.25],
  lb: [45, 35, 25, 10, 5, 2.5],
};

export const BAR_WEIGHTS: Record<Unit, readonly number[]> = {
  kg: [20, 15],
  lb: [45, 35],
};

export const DEFAULT_PLATE_COUNTS: PlateCounts = {
  kg: { 25: 4, 20: 4, 15: 2, 10: 2, 5: 2, 2.5: 2, 1.25: 2 },
  lb: { 45: 6, 35: 2, 25: 2, 10: 2, 5: 2, 2.5: 2 },
};

/** Competition coding (Lab 17/37), the default. Geometry is real: height is diameter. */
export const DEFAULT_INVENTORY: PlateInventory = {
  plates: PLATE_DENOMINATIONS.kg.map((kg) => ({ kg, count: DEFAULT_PLATE_COUNTS.kg[kg] })),
};

export const PLATE_COLORS: Record<'competition' | 'plain' | 'lb', Record<number, string>> = {
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
  lb: {
    45: '#2d6cb5',
    35: '#d9a92b',
    25: '#3f8f4f',
    10: '#e8e6e1',
    5: '#b3312a',
    2.5: '#c9c8c4',
  },
};

const UNIT = 0.25; // the finest plate that exists is 1.25 kg; every lb plate is a multiple too

/**
 * Closest loadable weight at or below the target, in plates.
 *
 * Unit-agnostic: target, bar and plate sizes only have to share one unit.
 *
 * Heaviest-first search with backtracking, not a greedy walk. Greedy is wrong on
 * real inventories: 25 a side from {20, 15, 10} takes the 20 and then strands 5,
 * where 15 + 10 is exact. Searching heaviest-first and backtracking gives both
 * correctness and the conventional loading order — 102.5 on a 20 kg bar comes
 * out 25 + 15 + 1.25, not 20 + 20 + 1.25, which is the same weight in more
 * plates than a lifter would reach for.
 */
export function solveLoad(
  target: number,
  bar: number,
  stock: readonly { size: number; count: number }[],
): LoadSolution {
  const perSideTarget = (target - bar) / 2;
  if (perSideTarget <= 0) {
    return { perSide: [], achieved: bar, residual: target - bar };
  }
  // Floor, not round: the contract is "at or below the target". Rounding up would
  // let a converted-from-pounds target load MORE than was asked for.
  const goal = Math.floor(perSideTarget / UNIT + 1e-9);
  const plates = stock
    .filter((p) => p.size > 0 && p.count > 0)
    .sort((a, b) => b.size - a.size)
    .map((p) => ({ units: Math.round(p.size / UNIT), size: p.size, count: p.count }));

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
    if (sum === goal || i >= plates.length) return;
    const key = i * (goal + 1) + sum;
    if (seen.has(key)) return;
    seen.add(key);
    const p = plates[i];
    const room = Math.min(p.count, Math.floor((goal - sum) / p.units));
    // Heaviest-first, most-of-it-first: the first exact hit is the conventional load.
    for (let take = room; take >= 0; take--) {
      for (let k = 0; k < take; k++) pick.push(p.size);
      visit(i + 1, sum + take * p.units);
      for (let k = 0; k < take; k++) pick.pop();
      if (bestSum === goal) return;
    }
  };
  visit(0, 0);

  const achieved = Math.round((bar + 2 * bestSum * UNIT) * 100) / 100;
  return {
    perSide: bestPick,
    achieved,
    residual: Math.round((target - achieved) * 100) / 100,
  };
}

export function solvePlates(
  targetKg: Kg,
  barKg: Kg,
  inv: PlateInventory = DEFAULT_INVENTORY,
): PlateSolution {
  const { perSide, achieved, residual } = solveLoad(
    targetKg,
    barKg,
    inv.plates.map((p) => ({ size: p.kg, count: p.count })),
  );
  return { perSide, achievedKg: achieved, residualKg: residual };
}

/**
 * A stored kilogram load in the display unit. Pounds are rounded to a hundredth:
 * `toKg` keeps three decimals, so 225 lb comes back as 224.9999 and would floor
 * to the plate below.
 */
export const loadInUnit = (loadKg: Kg, unit: Unit): number =>
  unit === 'kg' ? loadKg : Math.round(toDisplay(loadKg, unit) * 100) / 100;

/** What to put on one side of a bar of `bar` (in `unit`) for a stored load, from the owner's plates. */
export function solveInUnit(
  loadKg: Kg,
  unit: Unit,
  bar: number,
  counts: Record<number, number>,
): LoadSolution {
  return solveLoad(
    loadInUnit(loadKg, unit),
    bar,
    PLATE_DENOMINATIONS[unit].map((size) => ({ size, count: counts[size] ?? 0 })),
  );
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
