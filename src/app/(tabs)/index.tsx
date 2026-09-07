import { Link, router } from 'expo-router';
import { Pressable, Text } from 'react-native';

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
      {/* Settings is not a tab (§0) — it is this gear. Until that screen exists
          the gear opens the one thing behind it that does: the account. */}
      <ScreenHeader
        title="Today"
        kicker="THU 4 SEP"
        right={
          <Pressable onPress={() => router.push('/sign-in')} hitSlop={12}>
            <Icon name="gear" />
          </Pressable>
        }
      />

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
          <Link href="/dev/lab33" asChild>
            <RowPlate onPress={() => {}}>
              <ListRow title="Lab 33" meta="live workout inputs" />
            </RowPlate>
          </Link>
          <Link href="/dev/fonts" asChild>
            <RowPlate onPress={() => {}}>
              <ListRow title="Type ramp" meta="phase 1's gate" />
            </RowPlate>
          </Link>
          <Link href="/dev/gestures" asChild>
            <RowPlate onPress={() => {}}>
              <ListRow title="Gestures" meta="phase 6's gate — the back-gesture conflict" />
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
