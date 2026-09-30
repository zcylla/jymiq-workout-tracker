import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { addSet, setSessionCursor } from '@/data/mutations/sessions';
import { formatWeight, type Unit } from '@/lib/units';
import { useSettings } from '@/data/settings';
import { color, hairline, type Ink, radius, size, space, text, wash } from '@/theme';

import { useGlass } from './glass';

import { Chevron } from './icon';
import { HANDLE_WIDTH, ReorderList } from './reorder-list';
import { Sheet } from './sheet';
import { SwipeRow } from './swipe-row';

type SheetSet = {
  id: string;
  position: number;
  weightKg: number | null;
  reps: number | null;
  rpe: number | null;
  e1rmKg: number | null;
  completedAt: number | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  exerciseName: string;
  sessionId: string;
  sessionExerciseId: string;
  sets: SheetSet[];
  /** The screen's resolved current set — not necessarily `session.currentSetId`
   *  verbatim, since the screen falls back to the first open set. */
  currentSetId: string | null;
  /** Drop on a new slot. Omitted, rows have no grip. */
  onReorder?: (fromIndex: number, toIndex: number) => void;
  /** Swipe left past the threshold, with the set's id. Omitted, the swipe is inert. */
  onDelete?: (setId: string) => void;
};

const dash = (v: string | null) => v ?? '—';

/** kit's mono value column — right-aligned, a fixed width so four numbers line up. */
function Col({ w, color: c, children }: { w: number; color: Ink; children: string }) {
  return <Text style={{ ...text.numSm, width: w, textAlign: 'right', color: c }}>{children}</Text>;
}

function SetRow({
  set,
  isCurrent,
  handle,
  onPress,
  unit,
}: {
  set: SheetSet;
  isCurrent: boolean;
  handle: ReactNode;
  onPress: () => void;
  unit: Unit;
}) {
  const done = set.completedAt != null;
  const state = isCurrent ? 'current' : done ? 'done' : 'ahead';

  const indexColor = state === 'done' ? color.done : state === 'current' ? color.accent : color.dim;
  const weightColor = state === 'done' ? color.hi : state === 'current' ? color.accent : color.mid;
  const repsColor = state === 'done' ? color.mid : state === 'current' ? color.accent : color.mid;
  const rpeColor = state === 'done' ? color.mid : color.dim;
  const e1rmColor = state === 'done' ? color.accent : color.dim;

  const weightText = dash(set.weightKg == null ? null : formatWeight(set.weightKg, unit));
  const repsText = dash(set.reps == null ? null : `×${set.reps}`);
  const rpeText = state === 'done' ? dash(set.rpe == null ? null : String(set.rpe)) : '—';
  const e1rmText =
    state === 'done' ? dash(set.e1rmKg == null ? null : formatWeight(set.e1rmKg, unit)) : '—';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          height: size.hit,
          gap: 4,
          paddingHorizontal: 8,
          borderRadius: radius.row,
          borderBottomWidth: 0.5,
          borderBottomColor: hairline.onPlate,
          opacity: pressed ? 0.7 : state === 'ahead' ? 0.5 : 1,
        },
      ]}
    >
      {handle ? (
        <View style={{ backgroundColor: wash.field, borderRadius: radius.row }}>{handle}</View>
      ) : null}
      <Text style={{ ...text.numSm, width: 20, color: indexColor }}>
        {String(set.position).padStart(2, '0')}
      </Text>
      <View style={{ flex: 1 }} />
      <Col w={48} color={weightColor}>
        {weightText}
      </Col>
      <Col w={28} color={repsColor}>
        {repsText}
      </Col>
      <Col w={28} color={rpeColor}>
        {rpeText}
      </Col>
      <Col w={42} color={e1rmColor}>
        {e1rmText}
      </Col>
      <View style={{ width: 16, alignItems: 'flex-end' }}>
        {state === 'current' ? null : <Chevron />}
      </View>
    </Pressable>
  );
}

/**
 * The SETS sheet: one row per set on the current exercise. Tapping a row
 * moves the cursor there — there is deliberately no edit button, since you
 * edit a set with the ring on the live screen itself.
 *
 * The grip and the left swipe are drawn only when `onReorder` / `onDelete` are
 * passed — an inert control is worse than an absent one.
 */
export function SetsSheet({
  open,
  onClose,
  exerciseName,
  sessionId,
  sessionExerciseId,
  sets,
  currentSetId,
  onReorder,
  onDelete,
}: Props) {
  const { weightUnit } = useSettings();
  const { recipe } = useGlass('chrome');
  const done = sets.filter((s) => s.completedAt != null).length;

  const selectSet = (id: string) => {
    setSessionCursor(sessionId, { setId: id });
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.within }}>
        <Text style={[text.label, { flexShrink: 1 }]} numberOfLines={1}>
          {exerciseName.toUpperCase()}
        </Text>
        <View style={{ flex: 1 }} />
        <Text style={[text.label, { flexShrink: 0 }]}>{`${done}/${sets.length}`}</Text>
      </View>
      <View
        style={{ height: 1, backgroundColor: hairline.onPlate, marginVertical: space.within }}
      />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 18,
          gap: 4,
          paddingHorizontal: 8,
        }}
      >
        {onReorder ? <View style={{ width: HANDLE_WIDTH }} /> : null}
        <Text style={text.label} numberOfLines={1}>
          SET
        </Text>
        <View style={{ flex: 1 }} />
        <Text style={[text.label, { width: 48, textAlign: 'right' }]}>
          {weightUnit.toUpperCase()}
        </Text>
        <Text style={[text.label, { width: 28, textAlign: 'right' }]}>REP</Text>
        <Text style={[text.label, { width: 28, textAlign: 'right' }]}>RPE</Text>
        <Text style={[text.label, { width: 42, textAlign: 'right' }]}>e1RM</Text>
        <View style={{ width: 16 }} />
      </View>

      <ReorderList
        items={sets}
        rowHeight={size.hit}
        onReorder={onReorder}
        renderRow={(s, _i, handle) => (
          <SwipeRow
            key={s.id}
            surface={recipe?.fill.backgroundColor ?? color.panel}
            onDelete={onDelete ? () => onDelete(s.id) : undefined}
          >
            <SetRow
              unit={weightUnit}
              set={s}
              isCurrent={s.id === currentSetId}
              handle={handle}
              onPress={() => selectSet(s.id)}
            />
          </SwipeRow>
        )}
      />

      <Pressable
        onPress={() => addSet(sessionExerciseId)}
        style={({ pressed }) => ({
          minHeight: 44,
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
        <Text style={text.rowName}>+ Set</Text>
      </Pressable>
    </Sheet>
  );
}
