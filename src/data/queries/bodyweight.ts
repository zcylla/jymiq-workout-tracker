import { asc } from 'drizzle-orm';

import { db } from '../db';
import { bodyWeights } from '../schema';

/** Every weigh-in, oldest first. The screen reduces it to one value per day. */
export function bodyWeightsQuery() {
  return db
    .select({ measuredAt: bodyWeights.measuredAt, weightKg: bodyWeights.weightKg })
    .from(bodyWeights)
    .orderBy(asc(bodyWeights.measuredAt));
}
