import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import {
  ExerciseStill,
  ActionBar,
  DurationSheet,
  Field,
  ListRow,
  NumberSheet,
  RowPlate,
  RowPlates,
  Screen,
  ScreenHeader,
  Section,
  useActionBarHeight,
  useDialog,
} from '@/components';
import {
  removeRoutineExercise,
  updateRoutine,
  updateRoutineExercise,
} from '@/data/mutations/routines';
import { routineExercisesQuery, routineQuery } from '@/data/queries/routines';
import { useSettings } from '@/data/settings';
import { resolveKeypadValue } from '@/lib/keypad';
import { TARGET_REPS_SCALE, TARGET_SETS_SCALE, targetLoadScale } from '@/lib/scale';
import { formatRest } from '@/lib/time';
import { formatWeight, toKg, type Unit } from '@/lib/units';
import { color, size, space, text } from '@/theme';

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
  const [expanded, setExpanded] = useState<string | null>(null);
  const [edit, setEdit] = useState<Edit | null>(null);
  const unit = settings.weightUnit;

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
              <RowPlate
                key={lift.id}
                onPress={() => setExpanded(expanded === lift.id ? null : lift.id)}
              >
                <ListRow
                  thumb={<ExerciseStill exerciseId={lift.exerciseId} size={44} />}
                  title={lift.name}
                  meta={liftMeta(lift, unit)}
                  chevron={false}
                  right={
                    <Pressable
                      onPress={() => remove(lift.id, lift.name)}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${lift.name}`}
                      style={{
                        width: size.hit,
                        height: size.hit,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={[text.numRow, { color: color.live }]}>−</Text>
                    </Pressable>
                  }
                />
                {expanded === lift.id ? (
                  <Targets
                    lift={lift}
                    unit={unit}
                    onEdit={(target) => setEdit({ lift, target, open: true })}
                  />
                ) : null}
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
      {edit && edit.target !== 'rest' ? (
        <NumberSheet
          key={`${edit.lift.id}-${edit.target}-${edit.open}`}
          open={edit.open}
          onClose={() => setEdit({ ...edit, open: false })}
          {...numberEditor(edit.lift, edit.target, unit)}
        />
      ) : null}
      {edit ? (
        <DurationSheet
          open={edit.target === 'rest' && edit.open}
          title={`Rest · ${edit.lift.name}`}
          value={edit.lift.restSec}
          onConfirm={(restSec) => updateRoutineExercise(edit.lift.id, { restSec })}
          onClear={() => updateRoutineExercise(edit.lift.id, { restSec: null })}
          onClose={() => setEdit({ ...edit, open: false })}
        />
      ) : null}
    </>
  );
}

type Lift = Awaited<ReturnType<typeof routineExercisesQuery>>[number];
type Routine = Awaited<ReturnType<typeof routineQuery>>[number];

type Target = 'sets' | 'reps' | 'weight' | 'rest';
type Edit = { lift: Lift; target: Target; open: boolean };

function Targets({
  lift,
  unit,
  onEdit,
}: {
  lift: Lift;
  unit: Unit;
  onEdit: (target: Target) => void;
}) {
  const reps = lift.targetReps == null ? '—' : String(lift.targetReps);
  const weight = lift.targetWeightKg == null ? '—' : formatWeight(lift.targetWeightKg, unit);
  const rest = lift.restSec == null ? 'Default' : formatRest(lift.restSec);

  return (
    <View style={{ gap: space.within, paddingBottom: space.within }}>
      <View style={{ flexDirection: 'row', gap: space.within }}>
        <View style={{ flex: 1 }}>
          <Field label="SETS" value={String(lift.targetSets)} onPress={() => onEdit('sets')} />
        </View>
        <View style={{ flex: 1 }}>
          <Field
            label="REPS"
            value={reps}
            placeholder={lift.targetReps == null}
            onPress={() => onEdit('reps')}
          />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: space.within }}>
        <View style={{ flex: 1 }}>
          <Field
            label={`WEIGHT · ${unit.toUpperCase()}`}
            value={weight}
            placeholder={lift.targetWeightKg == null}
            onPress={() => onEdit('weight')}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Field
            label="REST"
            value={rest}
            placeholder={lift.restSec == null}
            onPress={() => onEdit('rest')}
          />
        </View>
      </View>
    </View>
  );
}

function numberEditor(lift: Lift, target: Exclude<Target, 'rest'>, unit: Unit) {
  const save = (patch: Parameters<typeof updateRoutineExercise>[1]) =>
    updateRoutineExercise(lift.id, patch);

  if (target === 'sets') {
    return {
      label: 'SETS',
      unit: 'SETS',
      was: String(lift.targetSets),
      resolve: (entered: string) => resolveKeypadValue(entered, TARGET_SETS_SCALE),
      onConfirm: (targetSets: number) => save({ targetSets }),
    };
  }
  if (target === 'reps') {
    return {
      label: 'REPS',
      unit: 'REPS',
      was: lift.targetReps == null ? '—' : String(lift.targetReps),
      resolve: (entered: string) => resolveKeypadValue(entered, TARGET_REPS_SCALE),
      onConfirm: (targetReps: number) => save({ targetReps }),
      onClear: () => save({ targetReps: null }),
    };
  }
  return {
    label: 'WEIGHT',
    unit: unit.toUpperCase(),
    was: lift.targetWeightKg == null ? '—' : formatWeight(lift.targetWeightKg, unit),
    resolve: (entered: string) => resolveKeypadValue(entered, targetLoadScale(unit)),
    onConfirm: (value: number) => save({ targetWeightKg: toKg(value, unit) }),
    onClear: () => save({ targetWeightKg: null }),
  };
}

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
