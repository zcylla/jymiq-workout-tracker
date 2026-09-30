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

const MIN_SESSIONS = 3;

export type DeloadState = 'DELOAD' | 'HOLD' | 'NOT YET';

/**
 * Both conditions (a muscle past its hard landmark and a stalled lift) is a
 * deload; one of them is a hold; neither is not yet. Null when there is
 * nothing to judge: too little history, or no sets this week.
 */
export function deloadCall(input: {
  totalSessions: number;
  muscles: readonly MuscleRow[];
  lifts: readonly Lift[];
}): DeloadState | null {
  if (input.totalSessions < MIN_SESSIONS) return null;
  if (!input.muscles.some((m) => m.sets > 0)) return null;

  const hard = input.muscles.some((m) => m.landmark && m.sets > m.landmark.high);
  const stalled = input.lifts.some((l) => l.stalled);

  if (hard && stalled) return 'DELOAD';
  return hard || stalled ? 'HOLD' : 'NOT YET';
}
