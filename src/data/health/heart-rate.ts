import { and, eq, gte } from 'drizzle-orm';

import { db } from '@/data/db';
import { sessions } from '@/data/schema';
import { getSettings } from '@/data/settings';
import { heartRateForSession, HEART_RATE_RETRY_MS, sessionsNeedingHeartRate } from '@/lib/health';

import { canReadHeartRate, readHeartRate } from './client';

export async function syncHeartRate(): Promise<void> {
  if (!getSettings().healthHeartRate || !(await canReadHeartRate())) return;
  const now = Date.now();
  const rows = db
    .select({
      id: sessions.id,
      status: sessions.status,
      startedAt: sessions.startedAt,
      endedAt: sessions.endedAt,
      avgHr: sessions.avgHr,
    })
    .from(sessions)
    .where(and(eq(sessions.status, 'completed'), gte(sessions.endedAt, now - HEART_RATE_RETRY_MS)))
    .all();
  for (const s of sessionsNeedingHeartRate(rows, now)) {
    const stats = heartRateForSession(
      await readHeartRate(s.startedAt, s.endedAt!),
      s.startedAt,
      s.endedAt!,
    );
    if (stats) {
      db.update(sessions)
        .set({ avgHr: stats.avg, maxHr: stats.max })
        .where(eq(sessions.id, s.id))
        .run();
    }
  }
}
