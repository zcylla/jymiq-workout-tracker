import { REST_SCALE, snapTo } from './scale.ts';
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
};

const isRest = (n: unknown): n is number => typeof n === 'number' && n >= 0 && n <= 3600;

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
  };
}
