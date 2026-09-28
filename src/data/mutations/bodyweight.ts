import { newId } from '@/lib/id';

import { db } from '../db';
import { bodyWeights } from '../schema';

/**
 * Append a weigh-in. The range is the trust boundary: this takes typed text
 * that has been through a unit conversion, and a stray digit would otherwise
 * skew every average and the chart's whole y range.
 */
export function logBodyweight(weightKg: number, at: number = Date.now()): string {
  if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 350) {
    throw new Error('Weight out of range');
  }
  const id = newId();
  db.insert(bodyWeights)
    .values({ id, measuredAt: at, weightKg, createdAt: at, updatedAt: at })
    .run();
  return id;
}
