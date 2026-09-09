import { Pressable, Text, View } from 'react-native';

import { setSessionCursor } from '@/data/mutations/sessions';
import { color, hairline, type Ink, lh, mono, radius, sans, space, text, wash } from '@/theme';

import { Chevron } from './icon';
import { Sheet } from './sheet';

type SheetExercise = {
  id: string;
  name: string;
  setsTotal: number;
  setsDone: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  sessionName: string;
  sessionId: string;
  exercises: SheetExercise[];
  /** The screen's resolved current exercise. */
  currentSessionExerciseId: string | null;
};

function ExerciseRow({
  exercise,
  index,
  isCurrent,
  onPress,
}: {
  exercise: SheetExercise;
  index: number;
  isCurrent: boolean;
  onPress: () => void;
}) {
  const completed = exercise.setsDone >= exercise.setsTotal && exercise.setsTotal > 0;
  const state = isCurrent ? 'current' : completed ? 'done' : 'ahead';

  const indexColor: Ink =
    state === 'done' ? color.done : state === 'current' ? color.accent : color.dim;
  const nameColor: Ink = state === 'done' || state === 'ahead' ? color.mid : color.accent;
  const remaining = exercise.setsTotal - exercise.setsDone;
  const meta = completed ? 'DONE' : `${remaining} LEFT`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        height: 42,
        gap: 9,
        paddingHorizontal: 8,
        borderRadius: radius.row,
        backgroundColor: state === 'current' ? wash.accent : undefined,
        opacity: pressed ? 0.7 : state === 'ahead' ? 0.6 : 1,
      })}
    >
      <Text
        style={{ ...mono(500), fontSize: 11, lineHeight: lh(11), width: 22, color: indexColor }}
      >
        {String(index + 1).padStart(2, '0')}
      </Text>
      <View style={{ flex: 1 }}>
        <Text style={{ ...sans(400), fontSize: 14, color: nameColor }} numberOfLines={1}>
          {exercise.name}
        </Text>
      </View>
      <Text style={text.label}>{meta}</Text>
      <Chevron />
    </Pressable>
  );
}

/**
 * The EXERCISES sheet: one row per lift in the session. There is no
 * exercise-picker screen yet, so `Add exercise` is omitted rather than
 * shipping a button that goes nowhere — the library route only browses.
 */
export function ExercisesSheet({
  open,
  onClose,
  sessionName,
  sessionId,
  exercises,
  currentSessionExerciseId,
}: Props) {
  const done = exercises.filter((e) => e.setsTotal > 0 && e.setsDone >= e.setsTotal).length;

  const selectExercise = (id: string) => {
    setSessionCursor(sessionId, { sessionExerciseId: id, setId: null });
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.within }}>
        <Text style={[text.label, { flexShrink: 1 }]} numberOfLines={1}>
          {`EXERCISES · ${sessionName.toUpperCase()}`}
        </Text>
        <View style={{ flex: 1 }} />
        <Text style={[text.label, { flexShrink: 0 }]}>{`${done} OF ${exercises.length} DONE`}</Text>
      </View>
      <View
        style={{ height: 1, backgroundColor: hairline.onPlate, marginVertical: space.within }}
      />

      {exercises.map((e, i) => (
        <ExerciseRow
          key={e.id}
          exercise={e}
          index={i}
          isCurrent={e.id === currentSessionExerciseId}
          onPress={() => selectExercise(e.id)}
        />
      ))}
    </Sheet>
  );
}
