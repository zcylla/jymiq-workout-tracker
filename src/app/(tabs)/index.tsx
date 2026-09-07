import { Link } from 'expo-router';
import { Text } from 'react-native';

import { Icon, ListRow, RowPlate, RowPlates, Screen, ScreenHeader, Section } from '@/components';
import { text } from '@/theme';

/**
 * Today. The real screen is Lab 45 W3 — a next-routine card, the week strip and
 * the recent-sessions rail — and it needs primitives Phase 2 did not build. This
 * is the shell's landing tab until then.
 */
export default function TodayScreen() {
  return (
    <Screen>
      <ScreenHeader title="Today" kicker="THU 4 SEP" right={<Icon name="gear" />} />

      <Section label="NEXT">
        <Text style={text.lead}>Lower B</Text>
        <Text style={text.prose}>5 lifts · ~60 min. Lab 45 W3 lands here.</Text>
      </Section>

      <Section label="DEV" plated={false}>
        <RowPlates>
          <Link href="/dev/kitchen-sink" asChild>
            <RowPlate onPress={() => {}}>
              <ListRow title="Kitchen sink" meta="every primitive, every state" />
            </RowPlate>
          </Link>
          <Link href="/dev/lab34-a1" asChild>
            <RowPlate onPress={() => {}}>
              <ListRow title="Lab 34 A1" meta="routines, from the primitives" />
            </RowPlate>
          </Link>
          <Link href="/dev/fonts" asChild>
            <RowPlate onPress={() => {}}>
              <ListRow title="Type ramp" meta="phase 1's gate" />
            </RowPlate>
          </Link>
          <Link href="/dev/db" asChild>
            <RowPlate onPress={() => {}}>
              <ListRow title="Database" meta="row counts per table" />
            </RowPlate>
          </Link>
        </RowPlates>
      </Section>
    </Screen>
  );
}
