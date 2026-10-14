import { useState } from 'react';
import { Text } from 'react-native';

import { ListRow, RowPlate, RowPlates, Screen, ScreenHeader, Section } from '@/components';
import { listOwnWorkoutIds, probeHealth, type ProbeRow } from '@/data/health/client';
import { syncWorkouts } from '@/data/health/export';
import { text } from '@/theme';

const DAYS = 30;

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
