import { useState } from 'react';

import { ListRow, RowPlate, RowPlates, Screen, ScreenHeader, Section } from '@/components';
import { probeHealth, type ProbeRow } from '@/data/health/client';

const DAYS = 30;

export default function HealthProbe() {
  const [rows, setRows] = useState<ProbeRow[] | null>(null);
  const [busy, setBusy] = useState(false);

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
        </RowPlates>
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
