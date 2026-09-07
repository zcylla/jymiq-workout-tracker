import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import {
  ActionBar,
  Chip,
  Field,
  RowPlate,
  RowPlates,
  Screen,
  ScreenHeader,
  Section,
  Toggle,
  useActionBarHeight,
} from '@/components';
import { createCustomExercise } from '@/data/mutations/exercises';
import { MUSCLES, type Equipment, type ExerciseKind, type Muscle } from '@/data/schema';
import { formatRest } from '@/lib/time';
import { space } from '@/theme';

const EQUIPMENT: Equipment[] = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'other'];
const KINDS: ExerciseKind[] = ['compound', 'isolation'];
const RESTS: (number | null)[] = [null, 60, 90, 120, 180, 300];

/** Which field's picker is open. Only one at a time — the plate grows in place. */
type Picker = 'equipment' | 'kind' | 'rest' | null;

/**
 * Lab 35 B3. The first write path: a form that does not look like one — label
 * over value, 44pt, no boxes, each on the row plate that a borderless field
 * cannot draw for itself.
 *
 * Two departures from the board, both because the board drew a column that does
 * not exist: its "count toward leg volume" and "warm-up ramp" toggles have no
 * home in the schema and are gone rather than faked, and TYPE is here because
 * `kind` is NOT NULL and drives the default rest.
 */
export default function NewExerciseScreen() {
  const actionBar = useActionBarHeight();
  const [name, setName] = useState('');
  const [equipment, setEquipment] = useState<Equipment>('barbell');
  const [kind, setKind] = useState<ExerciseKind>('compound');
  const [restSec, setRestSec] = useState<number | null>(null);
  const [muscles, setMuscles] = useState<Muscle[]>([]);
  const [trackRpe, setTrackRpe] = useState(false);
  const [picker, setPicker] = useState<Picker>(null);

  const toggleFor = (p: Exclude<Picker, null>) => () => setPicker(picker === p ? null : p);

  const create = () => {
    if (!name.trim()) return;
    const id = createCustomExercise({
      name,
      equipment,
      kind,
      muscles,
      defaultRestSec: restSec,
      trackRpe,
    });
    router.replace(`/exercise/${id}`);
  };

  return (
    <>
      <Screen bottomInset={actionBar}>
        <ScreenHeader title="New exercise" kicker="CUSTOM" onBack={() => router.back()} />

        <Section first plated={false}>
          <RowPlates>
            <RowPlate>
              <Field label="NAME" value={name} onChangeText={setName} prompt="Pause Front Squat" />
            </RowPlate>

            <RowPlate>
              <Field
                label="EQUIPMENT"
                value={equipment.toUpperCase()}
                onPress={toggleFor('equipment')}
              />
              {picker === 'equipment' ? (
                <Options
                  values={EQUIPMENT}
                  labelOf={(e) => e.toUpperCase()}
                  isOn={(e) => e === equipment}
                  onPick={setEquipment}
                />
              ) : null}
            </RowPlate>

            <RowPlate>
              <Field label="TYPE" value={kind.toUpperCase()} onPress={toggleFor('kind')} />
              {picker === 'kind' ? (
                <Options
                  values={KINDS}
                  labelOf={(k) => k.toUpperCase()}
                  isOn={(k) => k === kind}
                  onPick={setKind}
                />
              ) : null}
            </RowPlate>

            <RowPlate>
              <Field label="DEFAULT REST" value={restLabel(restSec)} onPress={toggleFor('rest')} />
              {picker === 'rest' ? (
                <Options
                  values={RESTS}
                  labelOf={restLabel}
                  isOn={(r) => r === restSec}
                  onPick={setRestSec}
                />
              ) : null}
            </RowPlate>
          </RowPlates>
        </Section>

        <Section label="MUSCLES WORKED" plated={false}>
          <Wrap>
            {MUSCLES.map((m) => (
              <Chip
                key={m}
                label={m.replace('_', ' ').toUpperCase()}
                on={muscles.includes(m)}
                onPress={() =>
                  setMuscles((prev) =>
                    prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m],
                  )
                }
              />
            ))}
          </Wrap>
        </Section>

        <Section label="TRACKING" plated={false}>
          <RowPlates>
            <RowPlate>
              <Toggle
                label="Track RPE"
                meta="OFF BY DEFAULT · SEE SETTINGS"
                on={trackRpe}
                onToggle={setTrackRpe}
              />
            </RowPlate>
          </RowPlates>
        </Section>
      </Screen>
      <ActionBar
        primary="Create exercise"
        onPrimary={create}
        secondary="CANCEL"
        onSecondary={() => router.back()}
      />
    </>
  );
}

/** A chip grid inside the row plate the field belongs to — the plate grows. */
function Options<T>({
  values,
  labelOf,
  isOn,
  onPick,
}: {
  values: T[];
  labelOf: (v: T) => string;
  isOn: (v: T) => boolean;
  onPick: (v: T) => void;
}) {
  return (
    <View style={{ paddingBottom: 11 }}>
      <Wrap>
        {values.map((v) => (
          <Chip key={labelOf(v)} label={labelOf(v)} on={isOn(v)} onPress={() => onPick(v)} />
        ))}
      </Wrap>
    </View>
  );
}

/** The board's muscle grid wraps rather than scrolls: it is the whole vocabulary. */
function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.row - 1 }}>{children}</View>
  );
}

const restLabel = (sec: number | null) => (sec == null ? 'DEFAULT' : formatRest(sec));
