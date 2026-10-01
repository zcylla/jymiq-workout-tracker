import { restRemainingSec, timeLabel } from './time.ts';
import { type Unit, formatWeight } from './units.ts';

export interface LiveNotificationState {
  routineName: string | null;
  exerciseName: string | null;
  setNumber: number | null;
  setCount: number;
  weightKg: number | null;
  reps: number | null;
  unit: Unit;
  restUntil: number | null;
  completedSets: number;
  totalSets: number;
  nextSetNumber: number | null;
}

export function liveNotificationContent(state: LiveNotificationState & { nowMs: number }): {
  title: string;
  body: string;
} {
  const lines = [state.exerciseName ?? 'Workout in progress'];
  if (state.setNumber != null) {
    const load =
      state.weightKg == null || state.weightKg === 0
        ? 'Bodyweight'
        : `${formatWeight(state.weightKg, state.unit)} ${state.unit}`;
    lines.push(state.reps == null ? load : `${load} × ${state.reps} reps`);
  }
  if (state.restUntil != null) {
    lines.push(
      restRemainingSec(state.restUntil, state.nowMs) > 0
        ? `Rest until ${timeLabel(state.restUntil)}`
        : 'Rest over',
    );
  }
  return { title: state.routineName?.trim() || 'Workout', body: lines.join('\n') };
}

interface Session {
  name: string;
  currentSessionExerciseId: string | null;
  currentSetId: string | null;
  restUntil: number | null;
}

interface Exercise {
  id: string;
  name: string;
}

interface SetRow {
  id: string;
  sessionExerciseId: string;
  position: number;
  weightKg: number | null;
  reps: number | null;
  plannedWeightKg: number | null;
  plannedReps: number | null;
  completedAt: number | null;
}

export function liveNotificationState(
  session: Session,
  exercises: readonly Exercise[],
  allSets: readonly SetRow[],
  unit: Unit,
): LiveNotificationState {
  const exercise = exercises.find((e) => e.id === session.currentSessionExerciseId) ?? exercises[0];
  const exerciseIds = new Set(exercises.map((e) => e.id));
  const activeSets = allSets.filter((s) => exerciseIds.has(s.sessionExerciseId));
  const sets = activeSets.filter((s) => s.sessionExerciseId === exercise?.id);
  const set =
    sets.find((s) => s.id === session.currentSetId) ??
    sets.find((s) => s.completedAt == null) ??
    sets[0];
  const last = sets
    .filter((s) => s.completedAt != null)
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))[0];
  return {
    routineName: session.name,
    exerciseName: exercise?.name ?? null,
    setNumber: set?.position ?? null,
    setCount: sets.length,
    weightKg:
      set?.completedAt != null
        ? set.weightKg
        : (set?.weightKg ?? set?.plannedWeightKg ?? last?.weightKg ?? null),
    reps:
      set?.completedAt != null ? set.reps : (set?.reps ?? set?.plannedReps ?? last?.reps ?? null),
    unit,
    restUntil: session.restUntil,
    completedSets: activeSets.filter((s) => s.completedAt != null).length,
    totalSets: activeSets.length,
    nextSetNumber: set && set.completedAt == null ? set.position : null,
  };
}
