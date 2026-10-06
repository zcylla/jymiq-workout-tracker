import {
  DEFAULT_PLATE_COUNTS,
  PLATE_COUNT_MAX,
  PLATE_DENOMINATIONS,
  type PlateCounts,
} from './plates.ts';
import { LOAD_STEPS_KG, REST_SCALE, snapTo } from './scale.ts';
import type { Unit } from './units.ts';

/**
 * The parameters you argued about once and then forget (Lab 37 D4).
 *
 * §0 keeps Settings off the tab bar — it is a gear in the Today header, because
 * you open it twice a year. What is here is only what the app can actually act
 * on; a switch that toggles nothing is worse than a missing switch, and this
 * codebase has shipped that mistake before.
 */
export interface Settings {
  /** Kilograms are what the database stores, always. This is display only. */
  weightUnit: Unit;
  restCompoundSec: number;
  restIsolationSec: number;
  /**
   * Show the RPE parameter on the live screen even for exercises that do not
   * ask for it. §0: RPE arrives *unset*, never pre-filled at 8, and most people
   * will never turn this on.
   */
  trackRpe: boolean;
  /** Otherwise long-press does it, and a tap arms the tape (Lab 32). */
  tapOpensKeypad: boolean;
  /** Sessions a week, 1-7. The SESSIONS meter's denominator when no program is running; null is unset. */
  weeklyGoal: number | null;
  /**
   * The live load tape's step, in kilograms and only kilograms: the live screen
   * does not follow the display unit, so there is nothing to convert.
   */
  weightIncrementKg: number;
  /** Sets a newly added exercise starts with, in a routine or a live session. */
  defaultSets: number;
  /** Hold the screen awake while a session is live. */
  keepScreenOn: boolean;
  /**
   * An ongoing notification while a live session runs. Null until the first launch
   * has asked for notification permission; that answer becomes the value.
   */
  liveNotification: boolean | null;
  /** Plates the owner has PER SIDE, by denomination, kept per unit. Zero means "I don't have it". */
  plateCounts: PlateCounts;
}

/**
 * The defaults are today's hardcoded behaviour, exactly. Opening Settings for
 * the first time must change nothing.
 */
export const DEFAULT_SETTINGS: Settings = {
  weightUnit: 'kg',
  restCompoundSec: 180,
  restIsolationSec: 90,
  trackRpe: false,
  tapOpensKeypad: false,
  weeklyGoal: null,
  weightIncrementKg: 2.5,
  defaultSets: 3,
  keepScreenOn: false,
  liveNotification: null,
  plateCounts: DEFAULT_PLATE_COUNTS,
};

export const DEFAULT_SETS_MAX = 10;

const isStep = (n: unknown): n is (typeof LOAD_STEPS_KG)[number] =>
  LOAD_STEPS_KG.some((step) => step === n);
const isSetCount = (n: unknown): n is number =>
  typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= DEFAULT_SETS_MAX;
const isRest = (n: unknown): n is number => typeof n === 'number' && n >= 0 && n <= 3600;

const isPlateCount = (n: unknown): n is number =>
  typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= PLATE_COUNT_MAX;

const isGoal = (n: unknown): n is number =>
  Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 7;

const asRecord = (v: unknown): Record<string, unknown> =>
  typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {};

function coercePlateCounts(raw: unknown): PlateCounts {
  const stored = asRecord(raw);
  const counts: PlateCounts = { kg: {}, lb: {} };
  for (const unit of ['kg', 'lb'] as const) {
    const bag = asRecord(stored[unit]);
    for (const size of PLATE_DENOMINATIONS[unit])
      counts[unit][size] = isPlateCount(bag[size]) ? bag[size] : DEFAULT_PLATE_COUNTS[unit][size];
  }
  return counts;
}

/**
 * Tolerant on purpose: settings are read at launch from a store an older build
 * may have written, and a single unreadable key must not take the app down or
 * silently reset the other four. Anything unrecognised falls back to its own
 * default and the rest survive.
 */
export function coerceSettings(raw: unknown): Settings {
  if (typeof raw !== 'object' || raw === null) return DEFAULT_SETTINGS;
  const o = raw as Record<string, unknown>;
  return {
    weightUnit: o.weightUnit === 'lb' ? 'lb' : 'kg',
    restCompoundSec: isRest(o.restCompoundSec)
      ? snapTo(REST_SCALE, o.restCompoundSec)
      : DEFAULT_SETTINGS.restCompoundSec,
    restIsolationSec: isRest(o.restIsolationSec)
      ? snapTo(REST_SCALE, o.restIsolationSec)
      : DEFAULT_SETTINGS.restIsolationSec,
    trackRpe: o.trackRpe === true,
    tapOpensKeypad: o.tapOpensKeypad === true,
    weeklyGoal: isGoal(o.weeklyGoal) ? o.weeklyGoal : null,
    weightIncrementKg: isStep(o.weightIncrementKg)
      ? o.weightIncrementKg
      : DEFAULT_SETTINGS.weightIncrementKg,
    defaultSets: isSetCount(o.defaultSets) ? o.defaultSets : DEFAULT_SETTINGS.defaultSets,
    keepScreenOn: o.keepScreenOn === true,
    liveNotification: typeof o.liveNotification === 'boolean' ? o.liveNotification : null,
    plateCounts: coercePlateCounts(o.plateCounts),
  };
}
