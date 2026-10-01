import { Link, router } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import {
  Icon,
  Listed,
  ListRow,
  RowPlate,
  RowPlates,
  Screen,
  ScreenHeader,
  Section,
  useTabBarHeight,
} from '@/components';
import { useRows } from '@/data/live';
import { routineListQuery } from '@/data/queries/routines';

/** Lab 34 A1. The Session tab's landing view. */
export default function RoutinesScreen() {
  const routines = useRows(
    useMemo(() => routineListQuery(), []),
    [],
  );
  const tabBar = useTabBarHeight();

  return (
    <Screen bottomInset={tabBar}>
      <ScreenHeader
        title="Routines"
        right={
          <View style={{ flexDirection: 'row', gap: 18 }}>
            <Link href="/routine/new">
              <Icon name="plus" />
            </Link>
            <Link href="/session/library">
              <Icon name="search" />
            </Link>
          </View>
        }
      />

      <Section first plated={false}>
        <RowPlates>
          {routines?.map((r, i) => (
            <Listed key={r.id} index={i}>
              <RowPlate onPress={() => router.push(`/routine/${r.id}`)}>
                <ListRow title={r.name} />
              </RowPlate>
            </Listed>
          ))}
          {routines?.length === 0 ? (
            <RowPlate onPress={() => router.push('/routine/new')}>
              <ListRow title="Build a routine" />
            </RowPlate>
          ) : null}
        </RowPlates>
      </Section>

      <Section plated={false}>
        <RowPlates>
          <Link href="/session/programs" asChild>
            <RowPlate onPress={() => {}}>
              <ListRow title="Programs" />
            </RowPlate>
          </Link>
          <Link href="/session/library" asChild>
            <RowPlate onPress={() => {}}>
              <ListRow title="Library" />
            </RowPlate>
          </Link>
        </RowPlates>
      </Section>
    </Screen>
  );
}
