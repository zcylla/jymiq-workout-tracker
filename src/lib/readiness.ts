import { countWorkingSets, type SetKind } from './volume.ts';

export type Sleep = 'poor' | 'ok' | 'good';
export type Soreness = 'none' | 'some' | 'a_lot';
export type Energy = 'low' | 'ok' | 'good';

export interface Answers {
  sleep: Sleep;
  soreness: Soreness;
  energy: Energy;
}

/** A prime muscle of the next routine, trained in the last 48 hours. */
export interface RecentMuscle {
  muscle: string;
  sets: number;
  lastAt: number;
}

export interface RecentSetRow {
  muscle: string;
  kind: SetKind;
  weightKg: number | null;
  reps: number | null;
  completedAt: number | null;
  startedAt: number;
}

export type Readiness = 'GO' | 'EASY' | 'LIGHT' | 'REST';

const STEPS: readonly Readiness[] = ['GO', 'EASY', 'LIGHT', 'REST'];

/**
 * A chip, never a score: the step is how many of the three answers were bad.
 * No weights and no thresholds beyond the answers' own worst option.
 */
export function readinessStep(answers: Answers): Readiness {
  const bad =
    Number(answers.sleep === 'poor') +
    Number(answers.soreness === 'a_lot') +
    Number(answers.energy === 'low');
  return STEPS[bad] as Readiness;
}

/**
 * Prime muscles of the next routine that were worked in `rows` (the last 48
 * hours of sets), most sets first. Warm-ups and unperformed sets do not count.
 */
export function recentMuscles(
  rows: readonly RecentSetRow[],
  primeMuscles: readonly string[],
  now: number,
): RecentMuscle[] {
  const wanted = new Set(primeMuscles);
  const from = now - 48 * 3_600_000;
  const by = new Map<string, RecentSetRow[]>();
  for (const r of rows) {
    if (!wanted.has(r.muscle) || r.startedAt < from) continue;
    by.set(r.muscle, [...(by.get(r.muscle) ?? []), r]);
  }
  const out: RecentMuscle[] = [];
  for (const [muscle, rs] of by) {
    const sets = countWorkingSets(rs);
    if (sets === 0) continue;
    out.push({ muscle, sets, lastAt: Math.max(...rs.map((r) => r.startedAt)) });
  }
  return out.sort((a, b) => b.sets - a.sets);
}

/** Midnight at the start of `at`'s local day. */
export function dayStart(at: number): number {
  const d = new Date(at);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}
