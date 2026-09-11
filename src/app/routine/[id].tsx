import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Text } from 'react-native';

import {
  ActionBar,
  Icon,
  ListRow,
  RowPlate,
  RowPlates,
  Screen,
  ScreenHeader,
  Section,
  StatTiles,
  type Tile,
  useActionBarHeight,
} from '@/components';
import { routineExercisesQuery, routineQuery } from '@/data/queries/routines';
import { startSession } from '@/data/mutations/sessions';
import { formatRest } from '@/lib/time';
import { formatWeight } from '@/lib/units';
import { text } from '@/theme';

/**
 * Lab 34 A2. A sibling of `(tabs)`, so the push loses the tab bar and the
 * primary action takes that plane.
 *
 * EST. TIME, VOLUME and the LAST THREE rail are all session-derived and land in
 * Phase 6. They are present and dim rather than hidden or invented (§0).
 */
export default function RoutineScreen() {
  const actionBar = useActionBarHeight();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: found } = useLiveQuery(
    useMemo(() => routineQuery(id), [id]),
    [id],
  );
  const { data: lifts } = useLiveQuery(
    useMemo(() => routineExercisesQuery(id), [id]),
    [id],
  );
  const routine = found?.[0];
  const rows = lifts ?? [];

  const start = () => {
    if (!routine || rows.length === 0) {
      Alert.alert(
        'Add an exercise first',
        'A routine needs at least one lift before it can start.',
      );
      return;
    }
    try {
      startSession({ routineId: routine.id });
      router.replace('/live');
    } catch {
      Alert.alert('A session is already running', 'Finish or discard it before starting another.');
    }
  };

  const sets = rows.reduce((n, l) => n + l.targetSets, 0);
  const tiles: Tile[] = [
    { label: 'EXERCISES', value: String(rows.length) },
    { label: 'SETS', value: String(sets) },
    { label: 'EST. TIME', value: '—', tone: 'lo' },
    { label: 'VOLUME', value: '—', tone: 'lo' },
  ];

  return (
    <>
      <Screen bottomInset={actionBar}>
        <ScreenHeader
          title={routine?.name ?? ''}
          kicker="ROUTINE"
          onBack={() => router.back()}
          right={<Icon name="dots" />}
        />

        <Section first pad={13}>
          <StatTiles items={tiles} surface="raised" />
        </Section>

        <Section label="EXERCISES" plated={false}>
          {rows.length ? (
            <RowPlates>
              {rows.map((lift, i) => (
                <RowPlate key={lift.id} onPress={() => router.push(`/exercise/${lift.exerciseId}`)}>
                  <ListRow
                    grip
                    chevron={false}
                    lead={String(i + 1).padStart(2, '0')}
                    quiet
                    title={lift.name}
                    meta={liftMeta(lift)}
                  />
                </RowPlate>
              ))}
            </RowPlates>
          ) : (
            <Text style={text.prose}>
              No lifts yet. Add them from the library, or copy them from another routine.
            </Text>
          )}
        </Section>

        <Section label="LAST THREE" plated={false}>
          <Text style={text.prose}>
            Nothing logged yet. Every session you run from this routine appears here.
          </Text>
        </Section>
      </Screen>
      <ActionBar
        primary={routine ? `Start ${routine.name}` : 'Start'}
        secondary="EDIT"
        onPrimary={start}
        onSecondary={() => router.push(`/routine/${id}/edit`)}
      />
    </>
  );
}

type Lift = Awaited<ReturnType<typeof routineExercisesQuery>>[number];

/** kit's `lift_row` meta: "5 × 8 @ 102.5 KG · REST 3:00". */
function liftMeta(lift: Lift): string {
  const parts = [
    lift.targetReps ? `${lift.targetSets} × ${lift.targetReps}` : `${lift.targetSets} SETS`,
  ];
  if (lift.targetWeightKg != null) parts[0] += ` @ ${formatWeight(lift.targetWeightKg)} KG`;
  if (lift.restSec != null) parts.push(`REST ${formatRest(lift.restSec)}`);
  return parts.join(' · ');
}
