import { router } from 'expo-router';

import {
  Icon,
  ListRow,
  RowPlate,
  RowPlates,
  Screen,
  ScreenHeader,
  Section,
  Toggle,
} from '@/components';
import { connectors } from '@/components/connectors';
import { useHealthStatus } from '@/data/health/use-health-status';
import { useHeartRateToggle } from '@/data/health/use-heart-rate-toggle';
import { useWorkoutExport } from '@/data/health/use-workout-export';
import { healthStatusLabel } from '@/lib/health';

export default function HealthConnectScreen() {
  const health = useHealthStatus();
  const workouts = useWorkoutExport();
  const heartRate = useHeartRateToggle();

  return (
    <Screen>
      <ScreenHeader
        title={connectors.healthConnect.title}
        onBack={() => router.back()}
        right={<Icon name={connectors.healthConnect.icon} size={24} />}
      />
      <Section first label="CONNECTION" plated={false}>
        <RowPlates tinted>
          <RowPlate onPress={health.press} disabled={health.status === 'unsupported'}>
            <ListRow
              quiet
              title="Status"
              value={health.status ? healthStatusLabel(health.status) : '—'}
            />
          </RowPlate>
        </RowPlates>
      </Section>
      <Section label="SEND TO HEALTH CONNECT" plated={false}>
        <RowPlates tinted>
          <RowPlate>
            <Toggle label="Finished workouts" on={workouts.on} onToggle={workouts.toggle} />
          </RowPlate>
        </RowPlates>
      </Section>
      <Section label="READ FROM HEALTH CONNECT" plated={false}>
        <RowPlates tinted>
          <RowPlate>
            <Toggle
              label="Heart rate"
              meta="Average and max on each workout"
              on={heartRate.on}
              onToggle={heartRate.toggle}
            />
          </RowPlate>
        </RowPlates>
      </Section>
    </Screen>
  );
}
