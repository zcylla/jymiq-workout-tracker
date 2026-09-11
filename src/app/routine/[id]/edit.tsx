import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Text } from 'react-native';

import {
  ActionBar,
  Field,
  ListRow,
  RowPlate,
  RowPlates,
  Screen,
  ScreenHeader,
  Section,
  useActionBarHeight,
} from '@/components';
import { removeRoutineExercise, updateRoutine } from '@/data/mutations/routines';
import { routineExercisesQuery, routineQuery } from '@/data/queries/routines';
import { formatRest } from '@/lib/time';
import { formatWeight } from '@/lib/units';
import { text } from '@/theme';

export default function EditRoutineScreen() {
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

  if (!routine) {
    return (
      <Screen>
        <ScreenHeader title="Edit routine" kicker="PLAN" onBack={() => router.back()} />
      </Screen>
    );
  }

  return <RoutineForm key={routine.id} routine={routine} rows={rows} />;
}

function RoutineForm({ routine, rows }: { routine: Routine; rows: Lift[] }) {
  const actionBar = useActionBarHeight();
  const [name, setName] = useState(routine.name);
  const [note, setNote] = useState(routine.note ?? '');

  const save = () => {
    if (!name.trim()) return;
    updateRoutine(routine.id, { name, note });
    router.back();
  };

  const remove = (liftId: string, liftName: string) =>
    Alert.alert(`Remove ${liftName}?`, 'It stays in your exercise library.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeRoutineExercise(liftId) },
    ]);

  return (
    <>
      <Screen bottomInset={actionBar}>
        <ScreenHeader title="Edit routine" kicker="PLAN" onBack={() => router.back()} />
        <Section first plated={false}>
          <RowPlates>
            <RowPlate>
              <Field label="NAME" value={name} onChangeText={setName} prompt="Upper A" />
            </RowPlate>
            <RowPlate>
              <Field label="NOTE" value={note} onChangeText={setNote} prompt="Optional" />
            </RowPlate>
          </RowPlates>
        </Section>

        <Section label="EXERCISES" plated={false}>
          <RowPlates>
            {rows.map((lift, index) => (
              <RowPlate key={lift.id} onPress={() => remove(lift.id, lift.name)}>
                <ListRow
                  lead={String(index + 1).padStart(2, '0')}
                  title={lift.name}
                  meta={liftMeta(lift)}
                  valueLabel="REMOVE"
                />
              </RowPlate>
            ))}
            <RowPlate
              onPress={() =>
                router.push({ pathname: '/session/library', params: { routineId: routine.id } })
              }
            >
              <ListRow title="Add exercise" meta="search the library" />
            </RowPlate>
          </RowPlates>
          {rows.length ? (
            <Text style={text.prose}>Tap an exercise to remove it from this routine.</Text>
          ) : null}
        </Section>
      </Screen>
      <ActionBar
        primary="Save routine"
        onPrimary={save}
        secondary="CANCEL"
        onSecondary={() => router.back()}
      />
    </>
  );
}

type Lift = Awaited<ReturnType<typeof routineExercisesQuery>>[number];
type Routine = Awaited<ReturnType<typeof routineQuery>>[number];

function liftMeta(lift: Lift): string {
  const parts = [
    lift.targetReps ? `${lift.targetSets} × ${lift.targetReps}` : `${lift.targetSets} SETS`,
  ];
  if (lift.targetWeightKg != null) parts[0] += ` @ ${formatWeight(lift.targetWeightKg)} KG`;
  if (lift.restSec != null) parts.push(`REST ${formatRest(lift.restSec)}`);
  return parts.join(' · ');
}
