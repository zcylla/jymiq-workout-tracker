import { estimate1RM } from './e1rm.ts';
import { DAILY_STRENGTH_LIBRARY } from './daily-strength-exercises.ts';
import { matchArtKey } from './exercise-art-match.ts';
import { buildExport, type ExportEnvelope } from './export.ts';
import { KNOWN_TABLES, parseBackup } from './import.ts';
import { detectSessionVolumePr, detectSetPrs, type PrBaseline } from './pr.ts';
import { toKg, weightKey } from './units.ts';
import { countWorkingSets, totalVolume } from './volume.ts';

type Row = Record<string, unknown>;
type SourceExercise = {
  id: string;
  name: string;
  equipment?: string;
  equipmentRequired?: { category: string }[];
  mechanicsType?: string;
  category?: string;
  instructions?: string;
  primaryMuscleGroups?: { name: string }[];
  secondaryMuscleGroups?: { name: string }[];
};
type SourceSet = {
  id: string;
  set: number;
  weight?: number;
  measurementUnit?: string;
  reps?: number;
  minReps?: number;
  maxReps?: number;
  restTime?: number;
  isComplete?: boolean;
  completedDate?: number;
  warmUp?: boolean;
  dropSet?: boolean;
  untilFailure?: boolean;
  rpe?: number;
  notes?: string;
};
type SourceLift = {
  id: string;
  position: number;
  exercise: SourceExercise;
  type: string;
  supersetExercises?: SourceLift[];
  workoutExerciseSets?: SourceSet[];
  workoutSessionSets?: SourceSet[];
};
type SourceWorkout = {
  id: string;
  name: string;
  modifiedDate?: number;
  exerciseList: SourceLift[];
};
type SourceSession = {
  id: string;
  name: string;
  startDate: number;
  endDate: number;
  isComplete: boolean;
  workout?: SourceWorkout;
  workoutSessionExercises: SourceLift[];
};
export type DailyStrengthArchive = Record<string, unknown[]>;

const muscles: Record<string, string> = {
  Quadriceps: 'quads',
  Hamstrings: 'hamstrings',
  Glutes: 'glutes',
  Calves: 'calves',
  Adductors: 'adductors',
  Chest: 'chest',
  'Middle Back': 'back',
  Lats: 'lats',
  Traps: 'traps',
  'Lower Back': 'lower_back',
  Shoulders: 'shoulders',
  Biceps: 'biceps',
  Triceps: 'triceps',
  Forearms: 'forearms',
  Abs: 'abs',
  Neck: 'neck',
};
const id = (table: string, sourceId: string) => {
  if (!sourceId) throw new Error(`Missing ${table} id`);
  return `daily-strength:${table}:${sourceId}`;
};
const number = (value: number | undefined, name: string): number | null => {
  if (value == null) return null;
  if (!Number.isFinite(value) || value < 0) throw new Error(`Invalid ${name}: ${value}`);
  return value;
};
const flatten = (lifts: SourceLift[]): SourceLift[] =>
  lifts.flatMap((lift) => {
    if (lift.type !== 'exercise' || !lift.exercise) throw new Error(`Unsupported lift ${lift.id}`);
    return [lift, ...flatten(lift.supersetExercises ?? [])];
  });
const equipment = (ex: SourceExercise): string => {
  const label =
    `${ex.equipment ?? ''} ${ex.equipmentRequired?.map((e) => e.category).join(' ') ?? ''}`.toLowerCase();
  if (label.includes('dumbbell')) return 'dumbbell';
  if (label.includes('barbell')) return 'barbell';
  if (label.includes('cable')) return 'cable';
  if (label.includes('machine')) return 'machine';
  if (label.includes('body') || ex.category === 'reps') return 'bodyweight';
  return 'other';
};

export function libraryIdsFromSeed(seedSql: string): string[] {
  const ids = seedSql.split('--> statement-breakpoint').flatMap((statement) => {
    if (!/^INSERT OR IGNORE INTO `exercises` /m.test(statement)) return [];
    const rows = [...statement.matchAll(/^\('([a-z0-9-]+)',/gm)].map((m) => m[1]);
    if (!rows.length) throw new Error('Could not read exercise ids from the library seed');
    return rows;
  });
  if (!ids.length || new Set(ids).size !== ids.length)
    throw new Error('Library seed exercise ids are empty or duplicated');
  return ids;
}

function libraryIdFor(name: string, libraryIds: readonly string[]): string | null {
  if (!libraryIds.length) return null;
  if (!Object.hasOwn(DAILY_STRENGTH_LIBRARY, name)) return matchArtKey(name, libraryIds);
  const mapped = DAILY_STRENGTH_LIBRARY[name];
  if (mapped != null && !libraryIds.includes(mapped))
    throw new Error(`Mapped library exercise ${mapped} for ${name} is not in the library`);
  return mapped;
}

export function convertDailyStrength(
  archive: DailyStrengthArchive,
  current: ExportEnvelope,
  options: {
    sourceOnly?: boolean;
    weeklyOrder?: boolean;
    now?: number;
    libraryIds?: readonly string[];
  } = {},
) {
  const parsed = parseBackup(JSON.stringify(current));
  if (!parsed.ok || parsed.backup.unknownTables.length)
    throw new Error('Invalid Jymiq base backup');
  if (options.weeklyOrder && !options.sourceOnly)
    throw new Error('Weekly order requires source-only mode to replace the existing program');
  const now = options.now ?? Date.now();
  const builtIn = (current.tables.exercises ?? []).filter((row) => (row as Row).isCustom === false);
  const builtInIds = new Set(builtIn.map((row) => (row as Row).id));
  const base = options.sourceOnly
    ? buildExport(
        {
          exercises: builtIn,
          exercise_muscles: (current.tables.exercise_muscles ?? []).filter((row) =>
            builtInIds.has((row as Row).exerciseId),
          ),
        },
        { now, appVersion: current.appVersion },
      )
    : current;
  for (const name of ['WorkoutSession.json', 'Workout.json', 'UserPreferences.json']) {
    if (!Array.isArray(archive[name])) throw new Error(`Missing ${name}`);
  }
  const sourceSessions = archive['WorkoutSession.json'] as SourceSession[];
  if (!sourceSessions.length) throw new Error('No sessions in source backup');
  const prefs = archive['UserPreferences.json'] as {
    currentSchedules?: { id: string; name: string; workouts: SourceWorkout[] }[];
  }[];
  const active = new Set(
    prefs.flatMap((p) => (p.currentSchedules ?? []).flatMap((s) => s.workouts.map((w) => w.id))),
  );
  const workouts = new Map<string, SourceWorkout>();
  for (const s of sourceSessions) if (s.workout) workouts.set(s.workout.id, s.workout);
  for (const p of prefs)
    for (const s of p.currentSchedules ?? []) for (const w of s.workouts) workouts.set(w.id, w);
  for (const w of archive['Workout.json'] as SourceWorkout[])
    if (workouts.has(w.id)) workouts.set(w.id, w);
  const imported = Object.fromEntries(KNOWN_TABLES.map((t) => [t, [] as Row[]]));
  const report = {
    sourceSessions: sourceSessions.length,
    sourceSets: 0,
    completedSets: 0,
    completionTimesInferredFromSessionEnd: 0,
    weightsConvertedFromPounds: 0,
    matchedExercises: 0,
    unmatchedExercises: [] as string[],
    libraryMatches: [] as { name: string; libraryId: string }[],
    droppedExerciseInstructions: 0,
    droppedExerciseNotes: 0,
    unsupportedMuscles: [] as string[],
    skippedCatalogWorkouts: archive['Workout.json'].length - workouts.size,
    limitations: [
      'Only routines referenced by history or the current schedule are imported; historical routines are archived.',
      options.weeklyOrder
        ? 'The current schedule is explicitly assigned in source order, Monday first; remaining days are rest.'
        : 'Schedules have no weekday assignments and are not converted into weekly programs.',
      'Set notes and rep ranges are retained in exercise/routine notes; routine per-set targets are reduced to the first set.',
      'Settings, reminders, equipment/plate catalogs, media and source statistics are not imported.',
      'Records are recomputed with Jymiq rules, and e1RM is estimated only for 1–12 reps.',
      'Matched exercises use library metadata; source exercise instructions and notes are dropped and counted separately.',
      'Weights are converted once from the explicit source unit to Jymiq kilograms; display pounds in Settings.',
    ],
  };
  const timestamp = Math.min(...sourceSessions.map((s) => s.startDate));
  if (!Number.isFinite(timestamp) || timestamp <= 0) throw new Error('Invalid source timestamps');
  if (options.weeklyOrder) {
    const schedules = prefs.flatMap((p) => p.currentSchedules ?? []);
    if (schedules.length !== 1)
      throw new Error('Weekly order requires exactly one current schedule');
    const schedule = schedules[0];
    if (schedule.workouts.length < 1 || schedule.workouts.length > 7)
      throw new Error('Weekly order requires one to seven routines');
    const programId = id('program', schedule.id);
    imported.programs.push({
      id: programId,
      name: schedule.name,
      note: null,
      status: 'active',
      startedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    for (const [weekday, routine] of schedule.workouts.entries()) {
      imported.program_days.push({ programId, weekday, routineId: id('routine', routine.id) });
    }
  }
  const sourceExercises = new Map<string, SourceExercise>();
  const exerciseIds = new Map<string, string>();
  const register = (lift: SourceLift) => {
    const ex = lift.exercise;
    if (ex.category !== 'weight_and_reps' && ex.category !== 'reps')
      throw new Error(`Unsupported exercise category: ${ex.name} (${ex.category})`);
    sourceExercises.set(ex.id, ex);
  };
  for (const w of workouts.values()) for (const lift of flatten(w.exerciseList)) register(lift);
  for (const s of sourceSessions)
    for (const lift of flatten(s.workoutSessionExercises)) register(lift);
  for (const ex of sourceExercises.values())
    exerciseIds.set(
      ex.id,
      libraryIdFor(ex.name, options.libraryIds ?? []) ?? id('exercise', ex.id),
    );
  for (const w of workouts.values()) {
    const updatedAt = w.modifiedDate || timestamp;
    imported.routines.push({
      id: id('routine', w.id),
      name: w.name,
      note: null,
      position: imported.routines.length,
      archivedAt: active.has(w.id) ? null : timestamp,
      createdAt: timestamp,
      updatedAt,
    });
    for (const [position, lift] of flatten(w.exerciseList).entries()) {
      const targets = lift.workoutExerciseSets ?? [];
      const target = targets[0];
      imported.routine_exercises.push({
        id: id('routine-exercise', `${w.id}:${lift.id}`),
        routineId: id('routine', w.id),
        exerciseId: exerciseIds.get(lift.exercise.id)!,
        position,
        targetSets: Math.max(1, targets.length),
        targetReps: target?.minReps ?? target?.maxReps ?? null,
        targetWeightKg: null,
        restSec: target?.restTime ?? null,
        note: targets.length ? `Daily Strength targets: ${JSON.stringify(targets)}` : null,
      });
    }
  }
  const sourceSessionIds = new Set<string>();
  for (const s of sourceSessions) {
    if (
      !Number.isFinite(s.startDate) ||
      s.startDate <= 0 ||
      !Number.isFinite(s.endDate) ||
      s.endDate < s.startDate
    )
      throw new Error(`Invalid dates for session ${s.id}`);
    const sessionId = id('session', s.id);
    if (sourceSessionIds.has(sessionId)) throw new Error(`Duplicate session ${s.id}`);
    sourceSessionIds.add(sessionId);
    const sessionSets = [];
    for (const [position, lift] of flatten(s.workoutSessionExercises).entries()) {
      const sxId = id('session-exercise', lift.id);
      const sourceSets = lift.workoutSessionSets ?? [];
      const notes = sourceSets.filter((t) => t.notes).map((t) => `Set ${t.set}: ${t.notes}`);
      imported.session_exercises.push({
        id: sxId,
        sessionId,
        exerciseId: exerciseIds.get(lift.exercise.id)!,
        routineExerciseId: null,
        position,
        plannedSets: sourceSets.length,
        plannedReps: null,
        plannedWeightKg: null,
        restSec: sourceSets[0]?.restTime ?? 180,
        addedMidSession: false,
        removedAt: null,
        note: notes.length ? notes.join('\n') : null,
      });
      for (const [setIndex, t] of sourceSets.entries()) {
        report.sourceSets++;
        let weightKg = number(t.weight, 'weight');
        if (weightKg != null) {
          if (t.measurementUnit === 'lbs' || t.measurementUnit === 'lb') {
            weightKg = toKg(weightKg, 'lb');
            report.weightsConvertedFromPounds++;
          } else if (t.measurementUnit !== 'kg' && t.measurementUnit !== 'kgs')
            throw new Error(`Unknown weight unit: ${t.measurementUnit}`);
        }
        const reps = number(t.reps, 'reps');
        if (reps != null && !Number.isInteger(reps)) throw new Error(`Invalid reps for ${t.id}`);
        const completedAt = t.isComplete ? t.completedDate || s.endDate : null;
        if (completedAt != null && (!Number.isFinite(completedAt) || completedAt <= 0))
          throw new Error(`Invalid completion date for ${t.id}`);
        if (t.isComplete) {
          report.completedSets++;
          if (!t.completedDate) report.completionTimesInferredFromSessionEnd++;
        }
        const rpe = number(t.rpe, 'RPE');
        if (rpe != null && rpe > 10) throw new Error(`Invalid RPE for ${t.id}`);
        const set = {
          id: id('set', t.id),
          sessionExerciseId: sxId,
          position: setIndex + 1,
          kind: t.warmUp
            ? ('warmup' as const)
            : t.dropSet
              ? ('drop' as const)
              : t.untilFailure
                ? ('failure' as const)
                : ('working' as const),
          plannedWeightKg: null,
          plannedReps: t.minReps ?? t.maxReps ?? null,
          weightKg,
          reps,
          rpe,
          completedAt,
          e1rmKg:
            completedAt != null && weightKg != null && reps != null
              ? estimate1RM(weightKg, reps)
              : null,
          createdAt: s.startDate,
          updatedAt: completedAt ?? s.endDate,
        };
        sessionSets.push(set);
        imported.sets.push(set);
      }
    }
    imported.sessions.push({
      id: sessionId,
      routineId: s.workout ? id('routine', s.workout.id) : null,
      name: s.name,
      status: s.isComplete ? 'completed' : 'abandoned',
      startedAt: s.startDate,
      endedAt: s.endDate,
      pausedMs: 0,
      note: null,
      restUntil: null,
      currentSessionExerciseId: null,
      currentSetId: null,
      totalVolumeKg: totalVolume(sessionSets),
      totalSets: countWorkingSets(sessionSets),
      durationSec: Math.round((s.endDate - s.startDate) / 1000),
    });
  }
  const notes = archive['ExerciseNotes.json'] as
    | { exercise: SourceExercise; notes: string }[]
    | undefined;
  for (const ex of sourceExercises.values()) {
    const extra = notes?.find((n) => n.exercise.id === ex.id)?.notes;
    const exerciseId = exerciseIds.get(ex.id)!;
    if (exerciseId !== id('exercise', ex.id)) {
      report.matchedExercises++;
      report.libraryMatches.push({ name: ex.name, libraryId: exerciseId });
      if (ex.instructions) report.droppedExerciseInstructions++;
      report.droppedExerciseNotes +=
        notes?.filter((n) => n.exercise.id === ex.id && n.notes).length ?? 0;
      continue;
    }
    report.unmatchedExercises.push(ex.name);
    imported.exercises.push({
      id: exerciseId,
      name: ex.name,
      equipment: equipment(ex),
      kind: ex.mechanicsType === 'compound' ? 'compound' : 'isolation',
      isCustom: true,
      isFavorite: false,
      barWeightKg: null,
      defaultRestSec: null,
      trackRpe: false,
      description: [ex.instructions, extra].filter(Boolean).join('\n\n') || null,
      cues: null,
      mistakes: null,
      archivedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    const mapped = new Set<string>();
    for (const [role, groups] of [
      ['prime', ex.primaryMuscleGroups],
      ['assist', ex.secondaryMuscleGroups],
    ] as const) {
      for (const group of groups ?? []) {
        const muscle = muscles[group.name];
        if (!muscle) {
          if (!report.unsupportedMuscles.includes(group.name))
            report.unsupportedMuscles.push(group.name);
          continue;
        }
        if (mapped.has(muscle)) continue;
        mapped.add(muscle);
        imported.exercise_muscles.push({ exerciseId, muscle, role });
      }
    }
  }
  const tables: Record<string, Row[]> = {};
  for (const table of KNOWN_TABLES) {
    const key = (r: Row) =>
      table === 'exercise_muscles'
        ? `${r.exerciseId}:${r.muscle}`
        : table === 'program_days'
          ? `${r.programId}:${r.weekday}`
          : String(r.id);
    const rows = new Map((base.tables[table] ?? []).map((r) => [key(r as Row), r as Row]));
    const seen = new Set<string>();
    for (const row of imported[table]) {
      const k = key(row);
      if (seen.has(k)) throw new Error(`Duplicate source ${table}: ${k}`);
      seen.add(k);
      if (rows.has(k)) {
        const previous = rows.get(k)!;
        if (
          Object.keys(previous).length !== Object.keys(row).length ||
          Object.entries(row).some(
            ([field, value]) => JSON.stringify(previous[field]) !== JSON.stringify(value),
          )
        )
          throw new Error(`Existing imported row differs: ${table} ${k}`);
      } else rows.set(k, row);
    }
    tables[table] = [...rows.values()];
  }
  const setRows = tables.sets as unknown as (Parameters<typeof totalVolume>[0][number] & {
    id: string;
    sessionExerciseId: string;
    e1rmKg: number | null;
  })[];
  const baselines = new Map<string, PrBaseline>();
  const sxById = new Map(tables.session_exercises.map((sx) => [sx.id, sx]));
  const setsBySession = new Map<unknown, typeof setRows>();
  for (const t of setRows) {
    const sx = sxById.get(t.sessionExerciseId);
    if (!sx) throw new Error(`Missing parent for set ${t.id}`);
    const group = setsBySession.get(sx.sessionId) ?? [];
    group.push(t);
    setsBySession.set(sx.sessionId, group);
  }
  const existingPrs = new Set(tables.personal_records.map((r) => r.id));
  for (const s of [...tables.sessions].sort((a, b) => Number(a.startedAt) - Number(b.startedAt))) {
    const volumes = new Map<string, number>();
    const addRecord = (
      exerciseId: string,
      hit: {
        category: string;
        value: number;
        previous: number | null;
        weightKg?: number;
        reps?: number;
      },
      setId: string | null,
      at: number,
    ) => {
      if (!sourceSessionIds.has(String(s.id))) return;
      const recordId = `${s.id}:${setId ?? exerciseId}:${hit.category}`;
      if (existingPrs.has(recordId)) return;
      tables.personal_records.push({
        id: recordId,
        exerciseId,
        category: hit.category,
        value: hit.value,
        weightKg: hit.weightKg ?? null,
        reps: hit.reps ?? null,
        previousValue: hit.previous,
        setId,
        sessionId: s.id,
        achievedAt: at,
      });
      existingPrs.add(recordId);
    };
    for (const t of (setsBySession.get(s.id) ?? []).sort(
      (a, b) => (a.completedAt ?? Infinity) - (b.completedAt ?? Infinity),
    )) {
      if (t.completedAt == null) continue;
      const exerciseId = String(sxById.get(t.sessionExerciseId)!.exerciseId);
      const baseline = baselines.get(exerciseId) ?? {
        heaviestKg: null,
        bestE1rmKg: null,
        bestRepsAtWeight: new Map<number, number>(),
        bestSetVolumeKg: null,
        bestSessionVolumeKg: null,
      };
      baselines.set(exerciseId, baseline);
      volumes.set(exerciseId, (volumes.get(exerciseId) ?? 0) + totalVolume([t]));
      if (t.weightKg == null || t.reps == null) continue;
      for (const hit of detectSetPrs({ ...t, weightKg: t.weightKg, reps: t.reps }, baseline)) {
        addRecord(exerciseId, hit, t.id, t.completedAt);
        if (hit.category === 'heaviest') baseline.heaviestKg = hit.value;
        if (hit.category === 'best_e1rm') baseline.bestE1rmKg = hit.value;
        if (hit.category === 'best_set_volume') baseline.bestSetVolumeKg = hit.value;
      }
      if (t.kind !== 'warmup' && t.kind !== 'drop' && t.weightKg > 0 && t.reps > 0) {
        const key = weightKey(t.weightKg);
        (baseline.bestRepsAtWeight as Map<number, number>).set(
          key,
          Math.max(t.reps, baseline.bestRepsAtWeight.get(key) ?? 0),
        );
      }
    }
    for (const [exerciseId, volume] of volumes) {
      const baseline = baselines.get(exerciseId)!;
      const hit = detectSessionVolumePr(volume, baseline);
      if (hit) {
        addRecord(exerciseId, hit, null, Number(s.endedAt));
        baseline.bestSessionVolumeKg = hit.value;
      }
    }
  }
  return { backup: buildExport(tables, { now: Date.now(), appVersion: base.appVersion }), report };
}
