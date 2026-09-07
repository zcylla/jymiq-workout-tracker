import { newId } from '@/lib/id';

import { db } from '../db';
import {
  type Equipment,
  type ExerciseKind,
  type Muscle,
  exerciseMuscles,
  exercises,
} from '../schema';

export type NewCustomExercise = {
  name: string;
  equipment: Equipment;
  kind: ExerciseKind;
  /**
   * All stored as `prime`. The form does not ask for a prime/assist split, and
   * inventing one the user never made would be a guess in a column read as fact.
   */
  muscles: Muscle[];
  defaultRestSec?: number | null;
  trackRpe?: boolean;
};

/**
 * Two tables, one transaction: foreign keys are on and `exercise_muscles` has a
 * composite primary key, so a half-applied insert would leave an exercise with
 * no muscles and no way to tell that from one the user left blank.
 */
export function createCustomExercise(input: NewCustomExercise): string {
  const id = newId();
  const now = Date.now();

  db.transaction((tx) => {
    tx.insert(exercises)
      .values({
        id,
        name: input.name.trim(),
        equipment: input.equipment,
        kind: input.kind,
        isCustom: true,
        defaultRestSec: input.defaultRestSec ?? null,
        trackRpe: input.trackRpe ?? false,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    if (input.muscles.length) {
      tx.insert(exerciseMuscles)
        .values(input.muscles.map((muscle) => ({ exerciseId: id, muscle, role: 'prime' as const })))
        .run();
    }
  });

  return id;
}
