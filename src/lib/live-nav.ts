export interface NavExercise {
  /** Skipped exercises are stepped over, never landed on. */
  removed: boolean;
  /** Ordered sets; `logged` is `completedAt != null`. */
  sets: readonly { logged: boolean }[];
}

export interface NavCursor {
  exerciseIndex: number;
  setIndex: number;
}

function landing(exercises: readonly NavExercise[], exerciseIndex: number): NavCursor {
  const first = exercises[exerciseIndex].sets.findIndex((s) => !s.logged);
  return { exerciseIndex, setIndex: Math.max(first, 0) };
}

function stepSet(exercises: readonly NavExercise[], cursor: NavCursor, by: 1 | -1): NavCursor {
  const ex = exercises[cursor.exerciseIndex];
  if (!ex) return cursor;
  const setIndex = cursor.setIndex + by;
  if (setIndex < 0 || setIndex >= ex.sets.length) return cursor;
  return { exerciseIndex: cursor.exerciseIndex, setIndex };
}

function stepExercise(exercises: readonly NavExercise[], cursor: NavCursor, by: 1 | -1): NavCursor {
  for (let i = cursor.exerciseIndex + by; i >= 0 && i < exercises.length; i += by) {
    if (!exercises[i].removed) return landing(exercises, i);
  }
  return cursor;
}

/**
 * Each of these returns the very same cursor object when there is nowhere to go,
 * so a caller can test `next === cursor` to play the edge bounce. Sets clamp at
 * the ends of their exercise: they never roll into the neighbour.
 */
export const nextSet = (exercises: readonly NavExercise[], cursor: NavCursor) =>
  stepSet(exercises, cursor, 1);
export const prevSet = (exercises: readonly NavExercise[], cursor: NavCursor) =>
  stepSet(exercises, cursor, -1);
export const nextExercise = (exercises: readonly NavExercise[], cursor: NavCursor) =>
  stepExercise(exercises, cursor, 1);
export const prevExercise = (exercises: readonly NavExercise[], cursor: NavCursor) =>
  stepExercise(exercises, cursor, -1);
