import { type ReactNode, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { addSet, setSessionCursor } from '@/data/mutations/sessions';
import { useSettings } from '@/data/settings';
import { dropParent, isWorkingSet, setTypeLabel } from '@/lib/set-groups';
import { formatWeight, type Unit } from '@/lib/units';
import type { SetKind } from '@/lib/volume';
import { color, size, space, text } from '@/theme';

import { Chevron } from './icon';
import { ReorderList } from './reorder-list';
import { RowPlate } from './row-plate';
import { Sheet } from './sheet';
import { SwipeRow } from './swipe-row';

type SheetSet = {
  id: string;
  position: number;
  kind: SetKind;
  weightKg: number | null;
  reps: number | null;
  rpe: number | null;
  completedAt: number | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  exerciseName: string;
  sessionId: string;
  sessionExerciseId: string;
  sets: SheetSet[];
  currentSetId: string | null;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  onDelete?: (setId: string) => void;
  onAddDrop: () => void;
};

const ROW_HEIGHT = size.hit;

function SetRow({
  set,
  typeLabel,
  linked,
  isCurrent,
  handle,
  onPress,
  unit,
}: {
  set: SheetSet;
  typeLabel: string;
  linked: boolean;
  isCurrent: boolean;
  handle: ReactNode;
  onPress: () => void;
  unit: Unit;
}) {
  const done = set.completedAt != null;
  const indexColor = isCurrent ? color.accent : done ? color.done : color.dim;
  const valueColor = isCurrent ? color.accent : done ? color.hi : color.mid;
  const values = `${set.weightKg == null ? '—' : formatWeight(set.weightKg, unit)} × ${set.reps ?? '—'}`;
  return (
    <View style={{ paddingLeft: linked ? space.within : 0 }}>
      <RowPlate selected={isCurrent}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`Set ${set.position}, ${typeLabel}, ${values} ${unit}${done ? ', logged' : ''}. Edit set`}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            height: ROW_HEIGHT,
            gap: space.row,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          {handle}
          <Text style={[text.numSm, { color: indexColor }]}>
            {String(set.position).padStart(2, '0')}
          </Text>
          {set.kind === 'working' ? null : (
            <Text style={[text.meta, { color: color.lo }]}>{typeLabel.toUpperCase()}</Text>
          )}
          <View style={{ flex: 1 }} />
          <Text style={[text.numSm, { color: valueColor }]} numberOfLines={1}>
            {values}
            {set.rpe == null ? '' : ` @${set.rpe}`}
          </Text>
          {isCurrent ? null : <Chevron />}
        </Pressable>
      </RowPlate>
    </View>
  );
}

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
  onAddDrop,
}: Props) {
  const { weightUnit } = useSettings();
  const [reorderEpoch, setReorderEpoch] = useState(0);
  const done = sets.filter((s) => s.completedAt != null).length;
  const selectSet = (id: string) => {
    setSessionCursor(sessionId, { setId: id });
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.within,
          marginBottom: space.within,
        }}
      >
        <Text style={[text.label, { flex: 1 }]} numberOfLines={1}>
          {exerciseName.toUpperCase()}
        </Text>
        <Text style={text.label}>{`${done}/${sets.length}`}</Text>
      </View>
      <ReorderList
        key={reorderEpoch}
        quiet
        items={sets}
        rowHeight={ROW_HEIGHT}
        gap={space.row}
        onReorder={
          onReorder
            ? (from, to) => {
                onReorder(from, to);
                setReorderEpoch((value) => value + 1);
              }
            : undefined
        }
        renderRow={(s, _i, handle) => (
          <SwipeRow
            key={s.id}
            surface={color.raised}
            onDelete={onDelete ? () => onDelete(s.id) : undefined}
          >
            <SetRow
              set={s}
              typeLabel={setTypeLabel(sets, s.id)}
              linked={dropParent(sets, s.id) != null}
              isCurrent={s.id === currentSetId}
              handle={handle}
              onPress={() => selectSet(s.id)}
              unit={weightUnit}
            />
          </SwipeRow>
        )}
      />
      <View style={{ flexDirection: 'row', gap: space.row, marginTop: space.within }}>
        {[
          {
            label: '+ Warmup',
            disabled: false,
            onPress: () => selectSet(addSet(sessionExerciseId, 'warmup')),
          },
          {
            label: '+ Working',
            disabled: false,
            onPress: () => selectSet(addSet(sessionExerciseId)),
          },
          { label: '+ Drop', disabled: !sets.some(isWorkingSet), onPress: onAddDrop },
        ].map((add) => (
          <View key={add.label} style={{ flex: 1 }}>
            <RowPlate disabled={add.disabled} onPress={add.onPress}>
              <View style={{ minHeight: size.hit, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={text.rowName}>{add.label}</Text>
              </View>
            </RowPlate>
          </View>
        ))}
      </View>
    </Sheet>
  );
}
