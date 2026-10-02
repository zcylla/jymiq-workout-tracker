import { estimate1RM } from './e1rm.ts';
import { detectSessionVolumePr, detectSetPrs, type PrBaseline, type PrHit } from './pr.ts';
import { resolveSessionDurationSec } from './time.ts';
import { weightKey } from './units.ts';
import { countWorkingSets, type SessionStatus, type SetLike, totalVolume } from './volume.ts';

type EditableSet = SetLike & { rpe: number | null; e1rmKg: number | null };
export type SetPatch = Partial<Pick<EditableSet, 'weightKg' | 'reps' | 'rpe' | 'kind'>>;

export function editedSetValues(
  row: EditableSet,
  patch: SetPatch,
): SetPatch & { e1rmKg?: number | null } {
  if (row.completedAt == null) return patch;
  const next = { ...row, ...patch };
  if (
    next.weightKg == null ||
    !Number.isFinite(next.weightKg) ||
    next.weightKg < 0 ||
    next.reps == null ||
    !Number.isInteger(next.reps) ||
    next.reps < 1
  ) {
    throw new Error('A logged set must keep a valid load and reps.');
  }
  return patch.weightKg !== undefined || patch.reps !== undefined
    ? { ...patch, e1rmKg: estimate1RM(next.weightKg, next.reps) }
    : patch;
}

export function editedSessionTotals(
  session: { startedAt: number; pausedMs: number; endedAt: number | null },
  rows: readonly SetLike[],
): { totalVolumeKg: number; totalSets: number; durationSec?: number | null } {
  const last = rows.reduce<number | null>(
    (latest, row) =>
      row.completedAt == null ? latest : Math.max(latest ?? row.completedAt, row.completedAt),
    null,
  );
  return {
    totalVolumeKg: totalVolume(rows),
    totalSets: countWorkingSets(rows),
    ...(session.endedAt == null
      ? {}
      : {
          durationSec: resolveSessionDurationSec(
            session.startedAt,
            session.pausedMs,
            session.endedAt,
            last,
          ),
        }),
  };
}

export type RecordSet = EditableSet & { id: string; sessionId: string };
type RecordSession = { id: string; status: SessionStatus; endedAt: number | null };
type ReplayedRecord = {
  category: PrHit['category'];
  value: number;
  previousValue: number | null;
  weightKg: number | null;
  reps: number | null;
  setId: string | null;
  sessionId: string;
  achievedAt: number;
};

export function replayExerciseRecords(
  rows: readonly RecordSet[],
  sessions: readonly RecordSession[],
): ReplayedRecord[] {
  const base: PrBaseline = {
    heaviestKg: null,
    bestE1rmKg: null,
    bestRepsAtWeight: new Map<number, number>(),
    bestSetVolumeKg: null,
    bestSessionVolumeKg: null,
  };
  const volumes = new Map<string, number>();
  const records: ReplayedRecord[] = [];
  const events = [
    ...rows
      .filter((r) => r.completedAt != null)
      .map((row) => ({ at: row.completedAt!, row, session: null })),
    ...sessions
      .filter((s) => s.status === 'completed' && s.endedAt != null)
      .map((session) => ({ at: session.endedAt!, row: null, session })),
  ].sort((a, b) => a.at - b.at || Number(a.row == null) - Number(b.row == null));
  const add = (hit: PrHit, setId: string | null, sessionId: string, achievedAt: number) => {
    records.push({
      category: hit.category,
      value: hit.value,
      previousValue: hit.previous,
      weightKg: hit.weightKg ?? null,
      reps: hit.reps ?? null,
      setId,
      sessionId,
      achievedAt,
    });
  };
  for (const event of events) {
    const row = event.row;
    if (!row) {
      const sessionId = event.session!.id;
      const previous = [...volumes].filter(([id]) => id !== sessionId).map(([, volume]) => volume);
      base.bestSessionVolumeKg = previous.length ? Math.max(...previous) : null;
      const hit = detectSessionVolumePr(volumes.get(sessionId) ?? 0, base);
      if (hit) add(hit, null, sessionId, event.at);
      continue;
    }
    volumes.set(row.sessionId, (volumes.get(row.sessionId) ?? 0) + totalVolume([row]));
    if (row.weightKg == null || row.reps == null) continue;
    for (const hit of detectSetPrs({ ...row, weightKg: row.weightKg, reps: row.reps }, base)) {
      add(hit, row.id, row.sessionId, event.at);
    }
    if (row.kind === 'warmup' || row.kind === 'drop') continue;
    base.heaviestKg = Math.max(base.heaviestKg ?? row.weightKg, row.weightKg);
    if (row.e1rmKg != null) base.bestE1rmKg = Math.max(base.bestE1rmKg ?? row.e1rmKg, row.e1rmKg);
    base.bestSetVolumeKg = Math.max(base.bestSetVolumeKg ?? 0, row.weightKg * row.reps);
    const key = weightKey(row.weightKg);
    (base.bestRepsAtWeight as Map<number, number>).set(
      key,
      Math.max(row.reps, base.bestRepsAtWeight.get(key) ?? 0),
    );
  }
  return records;
}
