import type { MuscleRow } from './landmarks.ts';

export interface LiftSession {
  sessionId: string;
  at: number;
  bestE1rmKg: number;
}

export interface LiftHistory {
  name: string;
  sessions: LiftSession[];
}

export interface Lift {
  name: string;
  stalled: boolean;
}

/** Chronological bests. Needs three; the newest must beat the best of the two before it. */
export function isStalled(bests: readonly number[]): boolean {
  if (bests.length < 3) return false;
  const [a, b, c] = bests.slice(-3) as [number, number, number];
  return c <= Math.max(a, b);
}

/**
 * Lifts trained since `weekFrom` that have enough history to judge. A lift
 * with fewer than three sessions cannot stall, so it is left out entirely.
 */
export function liftsThisWeek(histories: readonly LiftHistory[], weekFrom: number): Lift[] {
  const out: Lift[] = [];
  for (const h of histories) {
    const bySession = new Map<string, LiftSession>();
    for (const s of h.sessions) {
      const seen = bySession.get(s.sessionId);
      if (!seen) bySession.set(s.sessionId, { ...s });
      else seen.bestE1rmKg = Math.max(seen.bestE1rmKg, s.bestE1rmKg);
    }
    const sorted = [...bySession.values()].sort((a, b) => a.at - b.at);
    const last = sorted[sorted.length - 1];
    if (!last || last.at < weekFrom || sorted.length < 3) continue;
    out.push({ name: h.name, stalled: isStalled(sorted.map((s) => s.bestE1rmKg)) });
  }
  return out;
}

const list = (xs: readonly string[]): string =>
  xs.length < 2 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;

const MIN_SESSIONS = 3;

export function deloadCall(input: {
  totalSessions: number;
  muscles: readonly MuscleRow[];
  lifts: readonly Lift[];
}): { lead: string; reason: string } {
  if (input.totalSessions < MIN_SESSIONS) {
    return {
      lead: 'Too early to call.',
      reason: 'A deload call needs a few sessions of history to compare against.',
    };
  }

  const hard = input.muscles
    .filter((m) => m.landmark && m.sets > m.landmark.high)
    .map((m) => m.name);
  const stalled = input.lifts.filter((l) => l.stalled).map((l) => l.name);
  const climbing = input.lifts.filter((l) => !l.stalled).map((l) => l.name);

  if (hard.length && stalled.length) {
    return {
      lead: 'Deload next week.',
      reason: `Volume is in the hard range for ${list(hard)}, and ${list(stalled)} stopped climbing.`,
    };
  }
  if (hard.length) {
    const lifts = climbing.length
      ? `${list(climbing)} ${climbing.length === 1 ? 'keeps' : 'keep'} climbing`
      : 'no lift shows a stall yet';
    return {
      lead: 'Not yet.',
      reason: `Volume is in the hard range for ${list(hard)}, but ${lifts}. Deload when both are true.`,
    };
  }
  if (stalled.length) {
    return {
      lead: 'Not yet.',
      reason: `${list(stalled)} stopped climbing, but volume is still within range. Deload when both are true.`,
    };
  }
  // Neither condition holds — but "your lifts are progressing" is a claim, and
  // it needs a lift that was judged. With nothing logged this week, or nothing
  // with three sessions of history, say that instead of asserting progress.
  if (climbing.length) {
    return {
      lead: 'Not yet.',
      reason: `Volume is within range and ${list(climbing)} ${climbing.length === 1 ? 'keeps' : 'keep'} climbing.`,
    };
  }
  if (input.muscles.some((m) => m.sets > 0)) {
    return {
      lead: 'Not yet.',
      reason: 'Volume is within range. No lift has three sessions of history to judge yet.',
    };
  }
  return {
    lead: 'Nothing to call yet.',
    reason: 'No sets logged this week. The call updates as soon as one is.',
  };
}
