import { formatWeight, type Kg, type Unit } from './units.ts';
import { type SetKind, wasPerformed } from './volume.ts';

export interface LogRow {
  id: string;
  sessionId: string;
  startedAt: number;
  /** Where the lift sat in its session, for a session that did it twice. */
  exercisePosition: number;
  position: number;
  kind: SetKind;
  weightKg: Kg | null;
  reps: number | null;
  rpe: number | null;
  completedAt: number | null;
  /** The exercise row's, not the set's: a removed lift takes its sets with it. */
  removedAt: number | null;
}

export interface LogEntry<T extends LogRow> {
  sessionId: string;
  startedAt: number;
  sets: T[];
}

const DASH = '—';

/** One event per session, newest first, each with only the sets that were logged. */
export function groupExerciseLog<T extends LogRow>(rows: readonly T[]): LogEntry<T>[] {
  const bySession = new Map<string, LogEntry<T>>();
  for (const r of rows) {
    if (r.removedAt != null || !wasPerformed(r)) continue;
    const entry = bySession.get(r.sessionId) ?? {
      sessionId: r.sessionId,
      startedAt: r.startedAt,
      sets: [],
    };
    entry.sets.push(r);
    bySession.set(r.sessionId, entry);
  }
  const entries = [...bySession.values()];
  for (const e of entries) {
    e.sets.sort((a, b) => a.exercisePosition - b.exercisePosition || a.position - b.position);
  }
  return entries.sort((a, b) => b.startedAt - a.startedAt);
}

/** "135 × 8", or "145 × 4 · RPE 9". */
export function formatLogSet(s: Pick<LogRow, 'weightKg' | 'reps' | 'rpe'>, unit: Unit): string {
  const weight = s.weightKg != null ? formatWeight(s.weightKg, unit) : DASH;
  const line = `${weight} × ${s.reps ?? DASH}`;
  return s.rpe != null ? `${line} · RPE ${s.rpe}` : line;
}
