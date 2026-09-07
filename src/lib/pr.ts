import type { Kg } from './units.ts';
import { weightKey } from './units.ts';
import type { SetKind } from './volume.ts';

export type PrCategory =
  | 'heaviest'
  | 'best_e1rm'
  | 'most_reps_at_weight'
  | 'best_set_volume'
  | 'best_session_volume';

/**
 * The five categories Hevy detects. Naming them beats counting them: "best
 * estimated 1RM, was 128" tells you something, "2 PRs" tells you nothing.
 *
 * The caller fetches the baseline; this module does no I/O.
 */
export interface PrBaseline {
  heaviestKg: number | null;
  bestE1rmKg: number | null;
  /** weightKey(kg) -> best reps ever done at exactly that weight. */
  bestRepsAtWeight: ReadonlyMap<number, number>;
  bestSetVolumeKg: number | null;
  bestSessionVolumeKg: number | null;
}

export interface PrCandidateSet {
  weightKg: Kg;
  reps: number;
  e1rmKg: Kg | null;
  kind: SetKind;
}

export interface PrHit {
  category: PrCategory;
  value: number;
  previous: number | null;
  weightKg?: Kg;
  reps?: number;
}

const beats = (value: number, previous: number | null) => previous == null || value > previous;

/**
 * Judges one just-completed set. Warm-ups and drop sets never set a record —
 * a drop set is lighter by construction and a warm-up is not an attempt.
 */
export function detectSetPrs(set: PrCandidateSet, base: PrBaseline): PrHit[] {
  if (set.kind === 'warmup' || set.kind === 'drop') return [];
  if (set.reps < 1 || set.weightKg <= 0) return [];

  const hits: PrHit[] = [];

  if (beats(set.weightKg, base.heaviestKg)) {
    hits.push({
      category: 'heaviest',
      value: set.weightKg,
      previous: base.heaviestKg,
      weightKg: set.weightKg,
      reps: set.reps,
    });
  }

  // A null e1RM (reps past the formula's range) skips the category rather than failing.
  if (set.e1rmKg != null && beats(set.e1rmKg, base.bestE1rmKg)) {
    hits.push({ category: 'best_e1rm', value: set.e1rmKg, previous: base.bestE1rmKg });
  }

  // Most reps at a weight only means something if you have lifted that weight
  // before. Without this guard every unfamiliar load fires a record — 90 x 5
  // would "beat" nothing on the way up to a 100 x 8 you have already done — and
  // a banner that fires constantly stops being a banner. It also keeps the
  // "WAS ..." line the design prints from ever being empty.
  const atWeight = base.bestRepsAtWeight.get(weightKey(set.weightKg)) ?? null;
  if (atWeight != null && beats(set.reps, atWeight)) {
    hits.push({
      category: 'most_reps_at_weight',
      value: set.reps,
      previous: atWeight,
      weightKg: set.weightKg,
      reps: set.reps,
    });
  }

  const setVolume = set.weightKg * set.reps;
  if (beats(setVolume, base.bestSetVolumeKg)) {
    hits.push({ category: 'best_set_volume', value: setVolume, previous: base.bestSetVolumeKg });
  }

  return hits;
}

/** Judged once per exercise when a session is completed. */
export function detectSessionVolumePr(exerciseVolumeKg: Kg, base: PrBaseline): PrHit | null {
  if (exerciseVolumeKg <= 0) return null;
  if (!beats(exerciseVolumeKg, base.bestSessionVolumeKg)) return null;
  return {
    category: 'best_session_volume',
    value: exerciseVolumeKg,
    previous: base.bestSessionVolumeKg,
  };
}

export const PR_LABELS: Record<PrCategory, string> = {
  heaviest: 'HEAVIEST',
  best_e1rm: 'BEST ESTIMATED 1RM',
  most_reps_at_weight: 'MOST REPS AT',
  best_set_volume: 'BEST SET VOLUME',
  best_session_volume: 'BEST SESSION VOLUME',
};
