import { Link } from 'expo-router';
import { useMemo } from 'react';
import { Text } from 'react-native';

import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import {
  Icon,
  ListRow,
  RowPlate,
  RowPlates,
  Screen,
  ScreenHeader,
  Section,
  useTabBarHeight,
} from '@/components';
import { routineListQuery } from '@/data/queries/routines';
import { text } from '@/theme';

/** Lab 34 A1. The Session tab's landing view. */
export default function RoutinesScreen() {
  const query = useMemo(() => routineListQuery(), []);
  const { data: routines } = useLiveQuery(query);
  const tabBar = useTabBarHeight();

  return (
    <Screen bottomInset={tabBar}>
      <ScreenHeader
        title="Routines"
        kicker="PLAN"
        right={
          <Link href="/session/library">
            <Icon name="search" />
          </Link>
        }
      />

      <Section label="YOUR ROUTINES" plated={false}>
        {routines?.length ? (
          <RowPlates>
            {routines.map((r) => (
              <RowPlate key={r.id}>
                <ListRow title={r.name} meta={r.note ?? undefined} />
              </RowPlate>
            ))}
          </RowPlates>
        ) : (
          // §0: the empty state is a short sentence plus a set of actions —
          // never an apology, never an illustration.
          <Text style={text.prose}>
            No routines yet. Build one from the library, or start from a template.
          </Text>
        )}
      </Section>

      <Section label="EXERCISES" plated={false}>
        <RowPlates>
          <Link href="/session/library" asChild>
            <RowPlate onPress={() => {}}>
              <ListRow title="Library" meta="every exercise, searchable" />
            </RowPlate>
          </Link>
        </RowPlates>
      </Section>
    </Screen>
  );
}
