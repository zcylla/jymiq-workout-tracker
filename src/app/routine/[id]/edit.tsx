import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text } from 'react-native';

import {
  ExerciseStill,
  ActionBar,
  Field,
  ListRow,
  RowPlate,
  RowPlates,
  Screen,
  ScreenHeader,
  Section,
  useActionBarHeight,
  useDialog,
} from '@/components';
import { removeRoutineExercise, updateRoutine } from '@/data/mutations/routines';
import { routineExercisesQuery, routineQuery } from '@/data/queries/routines';
import { useSettings } from '@/data/settings';
import { formatRest } from '@/lib/time';
import { formatWeight, type Unit } from '@/lib/units';
import { color, text } from '@/theme';

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
        <ScreenHeader title="Edit routine" onBack={() => router.back()} />
      </Screen>
    );
  }

  return <RoutineForm key={routine.id} routine={routine} rows={rows} />;
}

function RoutineForm({ routine, rows }: { routine: Routine; rows: Lift[] }) {
  const actionBar = useActionBarHeight();
  const show = useDialog();
  const settings = useSettings();
  const [name, setName] = useState(routine.name);
  const [note, setNote] = useState(routine.note ?? '');

  const save = () => {
    if (!name.trim()) return;
    updateRoutine(routine.id, { name, note });
    router.back();
  };

  const remove = (liftId: string, liftName: string) =>
    show({
      title: `Remove ${liftName}?`,
      actions: [
        { label: 'Remove', tone: 'destructive', onPress: () => removeRoutineExercise(liftId) },
        { label: 'Cancel', tone: 'cancel' },
      ],
    });

  return (
    <>
      <Screen bottomInset={actionBar}>
        <ScreenHeader title="Edit routine" onBack={() => router.back()} />
        <Section first plated={false}>
          <RowPlates>
            <RowPlate>
              <Field label="NAME" value={name} onChangeText={setName} prompt="Upper A" />
            </RowPlate>
            <RowPlate>
              <Field label="NOTE" value={note} onChangeText={setNote} />
            </RowPlate>
          </RowPlates>
        </Section>

        <Section label="EXERCISES" plated={false}>
          <RowPlates>
            {rows.map((lift) => (
              <RowPlate key={lift.id} onPress={() => remove(lift.id, lift.name)}>
                <ListRow
                  thumb={<ExerciseStill exerciseId={lift.exerciseId} size={44} />}
                  title={lift.name}
                  meta={liftMeta(lift, settings.weightUnit)}
                  chevron={false}
                  right={<Text style={[text.numRow, { color: color.live }]}>−</Text>}
                />
              </RowPlate>
            ))}
            <RowPlate
              onPress={() =>
                router.push({ pathname: '/session/library', params: { routineId: routine.id } })
              }
            >
              <ListRow title="Add exercise" />
            </RowPlate>
          </RowPlates>
        </Section>
      </Screen>
      <ActionBar
        primary="Save"
        onPrimary={save}
        secondary="CANCEL"
        onSecondary={() => router.back()}
      />
    </>
  );
}

type Lift = Awaited<ReturnType<typeof routineExercisesQuery>>[number];
type Routine = Awaited<ReturnType<typeof routineQuery>>[number];

function liftMeta(lift: Lift, unit: Unit): string {
  const parts = [
    lift.targetReps ? `${lift.targetSets} × ${lift.targetReps}` : `${lift.targetSets} SETS`,
  ];
  if (lift.targetWeightKg != null) {
    parts[0] += ` @ ${formatWeight(lift.targetWeightKg, unit)} ${unit.toUpperCase()}`;
  }
  if (lift.restSec != null) parts.push(`REST ${formatRest(lift.restSec)}`);
  return parts.join(' · ');
}
