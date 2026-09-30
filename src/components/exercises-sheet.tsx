import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { setSessionCursor } from '@/data/mutations/sessions';
import { exerciseStill } from '@/data/exercise-art';
import {
  color,
  hairline,
  type Ink,
  lh,
  ls,
  mono,
  radius,
  sans,
  size,
  space,
  text,
  wash,
} from '@/theme';

import { Chevron } from './icon';
import { ReorderList } from './reorder-list';
import { Sheet } from './sheet';
import { SwipeRow } from './swipe-row';

type SheetExercise = {
  id: string;
  name: string;
  setsTotal: number;
  setsDone: number;
  /** The library exercise's id, which keys its still. No id, or no art for it, draws nothing. */
  exerciseId?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  sessionName: string;
  sessionId: string;
  exercises: SheetExercise[];
  /** The screen's resolved current exercise. */
  currentSessionExerciseId: string | null;
  /** Drop on a new slot. Omitted, rows have no grip. */
  onReorder?: (fromIndex: number, toIndex: number) => void;
  /** Swipe left past the threshold, with the session exercise's id. Omitted, the swipe is inert. */
  onDelete?: (id: string) => void;
  /** Swipe right past the threshold, with the session exercise's id. Omitted, the swipe is inert. */
  onReplace?: (id: string) => void;
  /** The footer button. Omitted, no footer. */
  onAdd?: () => void;
};

const STILL = 32;

function ExerciseRow({
  exercise,
  index,
  isCurrent,
  handle,
  onPress,
}: {
  exercise: SheetExercise;
  index: number;
  isCurrent: boolean;
  handle: ReactNode;
  onPress: () => void;
}) {
  const completed = exercise.setsDone >= exercise.setsTotal && exercise.setsTotal > 0;
  const state = isCurrent ? 'current' : completed ? 'done' : 'ahead';

  const indexColor: Ink =
    state === 'done' ? color.done : state === 'current' ? color.accent : color.dim;
  const nameColor: Ink = state === 'done' || state === 'ahead' ? color.mid : color.accent;
  const remaining = exercise.setsTotal - exercise.setsDone;
  const meta = completed ? '' : String(remaining);
  const still = exercise.exerciseId ? exerciseStill(exercise.exerciseId) : undefined;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        height: size.hit,
        gap: 9,
        paddingHorizontal: 8,
        borderRadius: radius.row,
        backgroundColor: state === 'current' ? wash.accent : undefined,
        opacity: pressed ? 0.7 : state === 'ahead' ? 0.6 : 1,
      })}
    >
      {handle}
      <Text
        style={{ ...mono(500), fontSize: 11, lineHeight: lh(11), width: 22, color: indexColor }}
      >
        {String(index + 1).padStart(2, '0')}
      </Text>
      {still != null ? (
        <Image
          source={still}
          style={{ width: STILL, height: STILL }}
          contentFit="contain"
          tintColor={color.mid}
          cachePolicy="memory-disk"
          transition={0}
        />
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={{ ...sans(400), fontSize: 14, color: nameColor }} numberOfLines={1}>
          {exercise.name}
        </Text>
      </View>
      {meta ? <Text style={text.label}>{meta}</Text> : null}
      <Chevron />
    </Pressable>
  );
}

/**
 * The EXERCISES sheet: one row per lift in the session. A row navigates, its
 * grip reorders, a left swipe deletes, a right swipe swaps. Each affordance
 * is drawn only when its callback is passed — an inert control is worse than
 * an absent one.
 */
export function ExercisesSheet({
  open,
  onClose,
  sessionName,
  sessionId,
  exercises,
  currentSessionExerciseId,
  onReorder,
  onDelete,
  onReplace,
  onAdd,
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
          {sessionName.toUpperCase()}
        </Text>
        <View style={{ flex: 1 }} />
        <Text style={[text.label, { flexShrink: 0 }]}>{`${done}/${exercises.length}`}</Text>
      </View>
      <View
        style={{ height: 1, backgroundColor: hairline.onPlate, marginVertical: space.within }}
      />

      <ReorderList
        items={exercises}
        rowHeight={size.hit}
        onReorder={onReorder}
        renderRow={(e, i, handle) => (
          <SwipeRow
            key={e.id}
            onDelete={onDelete ? () => onDelete(e.id) : undefined}
            onSwap={onReplace ? () => onReplace(e.id) : undefined}
          >
            <ExerciseRow
              exercise={e}
              index={i}
              isCurrent={e.id === currentSessionExerciseId}
              handle={handle}
              onPress={() => selectExercise(e.id)}
            />
          </SwipeRow>
        )}
      />

      {onAdd ? (
        <Pressable
          onPress={onAdd}
          style={({ pressed }) => ({
            minHeight: size.hit,
            marginTop: space.within,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: radius.row,
            borderCurve: 'continuous',
            backgroundColor: wash.field,
            borderWidth: 1,
            borderColor: hairline.onPlate,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text
            style={{ ...sans(500), fontSize: 14, letterSpacing: ls(-0.01, 14), color: color.hi }}
          >
            Add exercise
          </Text>
        </Pressable>
      ) : null}
    </Sheet>
  );
}
