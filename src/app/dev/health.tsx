import { desc, eq } from 'drizzle-orm';
import { useState } from 'react';
import { Text } from 'react-native';

import { ListRow, RowPlate, RowPlates, Screen, ScreenHeader, Section } from '@/components';
import { db } from '@/data/db';
import {
  canReadHeartRate,
  listOwnWorkoutIds,
  probeHealth,
  type ProbeRow,
  readHeartRate,
} from '@/data/health/client';
import { syncWorkouts } from '@/data/health/export';
import { sessions } from '@/data/schema';
import { getSettings } from '@/data/settings';
import { heartRateForSession, type HeartRateSample } from '@/lib/health';
import { text } from '@/theme';

const DAYS = 30;

const localTime = (ms: number) => {
  const date = new Date(ms);
  return [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
};

const sampleTimes = (samples: HeartRateSample[]) => {
  if (samples.length === 0) return { first: 'none', last: 'none', latest: null };
  const first = samples.reduce((time, sample) => Math.min(time, sample.time), Infinity);
  const latest = samples.reduce((time, sample) => Math.max(time, sample.time), -Infinity);
  return { first: localTime(first), last: localTime(latest), latest };
};

async function diagnoseHeartRate(): Promise<string> {
  const lines: string[] = [];
  const report = async (label: string, work: () => string | Promise<string>) => {
    try {
      lines.push(`${label}: ${await work()}`);
    } catch (e) {
      lines.push(`${label}: error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  let session: typeof sessions.$inferSelect | undefined;
  await report('Session', () => {
    session = db
      .select()
      .from(sessions)
      .where(eq(sessions.status, 'completed'))
      .orderBy(desc(sessions.startedAt))
      .limit(1)
      .get();
    if (!session) return 'no completed session';
    const { id, startedAt, endedAt, avgHr, maxHr } = session;
    return [
      id.slice(0, 8),
      `startedAt ${localTime(startedAt)}`,
      `endedAt ${endedAt === null ? 'null' : localTime(endedAt)}`,
      `duration ${endedAt === null ? 'null' : `${(endedAt - startedAt) / 1000}s`}`,
      `stored avgHr ${avgHr ?? 'null'} / maxHr ${maxHr ?? 'null'}`,
    ].join(' · ');
  });
  await report('healthHeartRate', () => String(getSettings().healthHeartRate));
  await report('canReadHeartRate', async () => String(await canReadHeartRate()));
  if (!session) return lines.join('\n');

  const { startedAt, endedAt } = session;
  const requireEnd = () => {
    if (endedAt === null) throw new Error('completed session has no endedAt');
    return endedAt;
  };
  lines.push('Read windows below include native padding of 30 minutes on each side.');
  let narrow: HeartRateSample[] | undefined;
  await report('NARROW', async () => {
    const end = requireEnd();
    narrow = await readHeartRate(startedAt, end);
    const { first, last, latest } = sampleTimes(narrow);
    return `${narrow.length} samples · first ${first} · last ${last} · end gap ${latest === null ? 'n/a' : `${(end - latest) / 1000}s`}`;
  });
  await report('WIDE', async () => {
    const end = requireEnd();
    const wide = await readHeartRate(startedAt - 30 * 60000, end + 30 * 60000);
    const { first, last } = sampleTimes(wide);
    const inside = wide.filter((sample) => sample.time >= startedAt && sample.time <= end).length;
    return `${wide.length} samples · first ${first} · last ${last} · inside session ${inside} · latest overall ${last}`;
  });
  await report('heartRateForSession (NARROW)', () => {
    const end = requireEnd();
    if (!narrow) throw new Error('NARROW read failed');
    const stats = heartRateForSession(narrow, startedAt, end);
    return stats ? `avg ${stats.avg} / max ${stats.max}` : 'null';
  });
  return lines.join('\n');
}

export default function HealthProbe() {
  const [rows, setRows] = useState<ProbeRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const say = (work: () => Promise<string>) =>
    work()
      .then(setNote)
      .catch((e) => setNote(`error: ${e instanceof Error ? e.message : String(e)}`));

  const run = () => {
    if (busy) return;
    setBusy(true);
    probeHealth(DAYS)
      .then(setRows)
      .finally(() => setBusy(false));
  };

  return (
    <Screen>
      <ScreenHeader title="Health Connect" kicker="DEV" />
      <Section first label={`LAST ${DAYS} DAYS`} plated={false}>
        <RowPlates tinted>
          <RowPlate onPress={run}>
            <ListRow quiet title={busy ? 'Reading…' : 'Read what is there'} />
          </RowPlate>
          <RowPlate
            onPress={() =>
              say(async () => {
                await syncWorkouts();
                return 'sync finished';
              })
            }
          >
            <ListRow quiet title="Sync workouts now" />
          </RowPlate>
          <RowPlate onPress={() => say(async () => JSON.stringify(await listOwnWorkoutIds(0)))}>
            <ListRow quiet title="List own workout ids" />
          </RowPlate>
          <RowPlate onPress={() => say(diagnoseHeartRate)}>
            <ListRow quiet title="Diagnose heart rate" />
          </RowPlate>
        </RowPlates>
        {note ? <Text style={text.prose}>{note}</Text> : null}
      </Section>
      {rows?.map((row) => (
        <Section key={row.recordType} label={row.recordType.toUpperCase()} plated={false}>
          <RowPlates tinted>
            <RowPlate>
              <ListRow
                quiet
                title={row.error ?? `${row.count} records`}
                value={row.origins.map((o) => `${o.origin} ${o.count}`).join(' · ') || '—'}
              />
            </RowPlate>
          </RowPlates>
        </Section>
      ))}
    </Screen>
  );
}
