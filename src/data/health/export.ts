import { gte } from 'drizzle-orm';

import { db } from '@/data/db';
import { sessions } from '@/data/schema';
import { getSettings } from '@/data/settings';
import { DAY_MS, planWorkoutSync, workoutWindowStart } from '@/lib/health';

import { canSyncWorkouts, listOwnWorkoutIds, removeWorkouts, writeWorkouts } from './client';

export async function syncWorkouts(): Promise<void> {
  const since = getSettings().healthExportSince;
  if (since === null || !(await canSyncWorkouts())) return;
  const now = Date.now();
  const start = workoutWindowStart(since, now);
  const rows = db
    .select({
      id: sessions.id,
      name: sessions.name,
      status: sessions.status,
      startedAt: sessions.startedAt,
      endedAt: sessions.endedAt,
      totalSets: sessions.totalSets,
    })
    .from(sessions)
    .where(gte(sessions.startedAt, start - DAY_MS))
    .all();
  const plan = planWorkoutSync(rows, await listOwnWorkoutIds(start), since, now);
  if (plan.write.length) await writeWorkouts(plan.write);
  if (plan.remove.length) await removeWorkouts(plan.remove);
}
