import { Pressable, Text, View } from 'react-native';

import { addSet, setSessionCursor } from '@/data/mutations/sessions';
import { formatWeight } from '@/lib/units';
import { color, hairline, type Ink, lh, ls, mono, radius, sans, space, text, wash } from '@/theme';

import { Chevron } from './icon';
import { Sheet } from './sheet';

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
};

const dash = (v: string | null) => v ?? '—';
const idx = mono(500);
const val = mono(400);

/** kit's mono value column — right-aligned, a fixed width so four numbers line up. */
function Col({ w, color: c, children }: { w: number; color: Ink; children: string }) {
  return (
    <Text
      style={{ ...val, fontSize: 13, lineHeight: lh(13), width: w, textAlign: 'right', color: c }}
    >
      {children}
    </Text>
  );
}

function SetRow({
  set,
  isCurrent,
  onPress,
}: {
  set: SheetSet;
  isCurrent: boolean;
  onPress: () => void;
}) {
  const done = set.completedAt != null;
  const state = isCurrent ? 'current' : done ? 'done' : 'ahead';

  const indexColor = state === 'done' ? color.done : state === 'current' ? color.accent : color.dim;
  const weightColor = state === 'done' ? color.hi : state === 'current' ? color.accent : color.mid;
  const repsColor = state === 'done' ? color.mid : state === 'current' ? color.accent : color.mid;
  const rpeColor = state === 'done' ? color.mid : color.dim;
  const e1rmColor = state === 'done' ? color.accent : color.dim;

  const weightText = dash(set.weightKg == null ? null : formatWeight(set.weightKg));
  const repsText = dash(set.reps == null ? null : `×${set.reps}`);
  const rpeText = state === 'done' ? dash(set.rpe == null ? null : String(set.rpe)) : '—';
  const e1rmText =
    state === 'done' ? dash(set.e1rmKg == null ? null : formatWeight(set.e1rmKg)) : '—';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          height: 38,
          gap: 9,
          paddingHorizontal: 8,
          borderRadius: radius.row,
          backgroundColor: state === 'current' ? wash.accent : undefined,
          opacity: pressed ? 0.7 : state === 'ahead' ? 0.5 : 1,
        },
      ]}
    >
      <Text style={{ ...idx, fontSize: 11, lineHeight: lh(11), width: 22, color: indexColor }}>
        {String(set.position).padStart(2, '0')}
      </Text>
      <View style={{ flex: 1 }} />
      <Col w={50} color={weightColor}>
        {weightText}
      </Col>
      <Col w={30} color={repsColor}>
        {repsText}
      </Col>
      <Col w={36} color={rpeColor}>
        {rpeText}
      </Col>
      <Col w={44} color={e1rmColor}>
        {e1rmText}
      </Col>
      <View style={{ width: 26, alignItems: 'flex-end' }}>
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
 * Reordering is out of scope here: `reorderSets` exists but nothing in this
 * sheet draws a grip or calls it, so it stays unused on purpose.
 */
export function SetsSheet({
  open,
  onClose,
  exerciseName,
  sessionId,
  sessionExerciseId,
  sets,
  currentSetId,
}: Props) {
  const done = sets.filter((s) => s.completedAt != null).length;

  const selectSet = (id: string) => {
    setSessionCursor(sessionId, { setId: id });
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.within }}>
        <Text style={[text.label, { flexShrink: 1 }]} numberOfLines={1}>
          {`SETS · ${exerciseName.toUpperCase()}`}
        </Text>
        <View style={{ flex: 1 }} />
        <Text style={[text.label, { flexShrink: 0 }]}>{`${done} OF ${sets.length} DONE`}</Text>
      </View>
      <View
        style={{ height: 1, backgroundColor: hairline.onPlate, marginVertical: space.within }}
      />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 18,
          gap: 9,
          paddingHorizontal: 8,
        }}
      >
        <Text style={text.label} numberOfLines={1}>
          SET
        </Text>
        <View style={{ flex: 1 }} />
        <Text style={[text.label, { width: 50, textAlign: 'right' }]}>KG</Text>
        <Text style={[text.label, { width: 30, textAlign: 'right' }]}>REP</Text>
        <Text style={[text.label, { width: 36, textAlign: 'right' }]}>RPE</Text>
        <Text style={[text.label, { width: 44, textAlign: 'right' }]}>e1RM</Text>
        <View style={{ width: 26 }} />
      </View>

      {sets.map((s) => (
        <SetRow
          key={s.id}
          set={s}
          isCurrent={s.id === currentSetId}
          onPress={() => selectSet(s.id)}
        />
      ))}

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
        <Text style={{ ...sans(500), fontSize: 14, letterSpacing: ls(-0.01, 14), color: color.hi }}>
          Add set
        </Text>
      </Pressable>
    </Sheet>
  );
}
