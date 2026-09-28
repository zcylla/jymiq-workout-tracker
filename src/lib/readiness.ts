import { daysSince } from './bodyweight.ts';
import { muscleName } from './landmarks.ts';
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

const list = (xs: readonly string[]): string =>
  xs.length < 2 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;

const LEADS = [
  'Train as planned.',
  'Train as planned, and ease off if the warm-ups feel slow.',
  'Go lighter today.',
  'Consider resting today.',
] as const;

const MAX_NAMED = 3;

const dayPhrase = (at: number, now: number): string => {
  const d = daysSince(at, now);
  return d <= 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`;
};

const capitalise = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

function recentSentence(recent: readonly RecentMuscle[], now: number): string {
  const sorted = [...recent].sort((a, b) => b.sets - a.sets);
  const shown = sorted.slice(0, MAX_NAMED);
  const more = sorted.length - shown.length;
  const extra = more > 0 ? [`${more} more`] : [];
  const names = shown.map((m) => muscleName(m.muscle).toLowerCase());
  const phrases = shown.map((m) => dayPhrase(m.lastAt, now));
  const total = shown.length + more;

  if (phrases.every((p) => p === phrases[0])) {
    const counts = list(shown.map((m) => String(m.sets)));
    const noun = shown.length === 1 && shown[0]?.sets === 1 ? 'set' : 'sets';
    return `${capitalise(list([...names, ...extra]))} ${total === 1 ? 'was' : 'were'} trained ${phrases[0]} — ${counts} working ${noun}.`;
  }

  const parts = shown.map((m, i) =>
    i === 0
      ? `${capitalise(names[i] as string)} ${m.sets === 1 ? 'was' : 'were'} trained ${phrases[i]} (${m.sets} working ${m.sets === 1 ? 'set' : 'sets'})`
      : `${names[i]} ${phrases[i]} (${m.sets})`,
  );
  return `${list([...parts, ...extra])}.`;
}

/**
 * A sentence, never a score: the lead follows from how many answers were bad,
 * and the reason only states facts the user gave or the log holds.
 */
export function readinessCall(input: {
  answers: Answers;
  routineName: string | null;
  recent: readonly RecentMuscle[];
  now: number;
}): { lead: string; reason: string } {
  const { answers, routineName, recent, now } = input;
  const bad: string[] = [];
  if (answers.sleep === 'poor') bad.push('sleep was poor');
  if (answers.soreness === 'a_lot') bad.push('soreness is high');
  if (answers.energy === 'low') bad.push('energy is low');

  const sentences: string[] = [];
  if (bad.length) sentences.push(`You said ${list(bad)}.`);
  if (routineName !== null) {
    sentences.push(
      recent.length
        ? recentSentence(recent, now)
        : `Nothing ${routineName} works was trained in the last two days.`,
    );
  }
  if (!sentences.length) sentences.push('Nothing you said points the other way.');

  return { lead: LEADS[bad.length] as string, reason: sentences.join(' ') };
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
