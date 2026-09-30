import { eq } from 'drizzle-orm';

import { isBodyweightKg } from '@/lib/bodyweight';
import { newId } from '@/lib/id';

import { db } from '../db';
import { bodyWeights } from '../schema';

/**
 * Append a weigh-in. The range is the trust boundary: this takes typed text
 * that has been through a unit conversion, and a stray digit would otherwise
 * skew every average and the chart's whole y range.
 */
export function logBodyweight(weightKg: number, at: number = Date.now()): string {
  if (!isBodyweightKg(weightKg)) throw new Error('Weight out of range');
  const id = newId();
  db.insert(bodyWeights)
    .values({ id, measuredAt: at, weightKg, createdAt: at, updatedAt: at })
    .run();
  return id;
}

/** Corrects one reading's weight. Its day stays: the day it was taken is part of what it says. */
export function updateBodyweight(id: string, weightKg: number): void {
  if (!isBodyweightKg(weightKg)) throw new Error('Weight out of range');
  db.update(bodyWeights)
    .set({ weightKg, updatedAt: Date.now() })
    .where(eq(bodyWeights.id, id))
    .run();
}

/** A hard delete: the `body_weights` delete trigger queues the row for the cloud. */
export function deleteBodyweight(id: string): void {
  db.delete(bodyWeights).where(eq(bodyWeights.id, id)).run();
}
