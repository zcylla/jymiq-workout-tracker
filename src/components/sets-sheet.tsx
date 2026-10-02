import { type ReactNode, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { addSet, setSessionCursor } from '@/data/mutations/sessions';
import { useSettings } from '@/data/settings';
import { dropParent, isWorkingSet, setTypeLabel } from '@/lib/set-groups';
import { formatWeight, type Unit } from '@/lib/units';
import type { SetKind } from '@/lib/volume';
import { color, size, space, text } from '@/theme';

import { Chevron, Icon } from './icon';
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
  onType: (setId: string) => void;
  onAddDrop: () => void;
};

const ROW_HEIGHT = 72;

function SetRow({
  set,
  typeLabel,
  linked,
  isCurrent,
  handle,
  onPress,
  onType,
  unit,
}: {
  set: SheetSet;
  typeLabel: string;
  linked: boolean;
  isCurrent: boolean;
  handle: ReactNode;
  onPress: () => void;
  onType: () => void;
  unit: Unit;
}) {
  const done = set.completedAt != null;
  const indexColor = isCurrent ? color.accent : done ? color.done : color.dim;
  const values = `${set.weightKg == null ? '—' : formatWeight(set.weightKg, unit)} ${unit.toUpperCase()} × ${set.reps ?? '—'}${set.rpe == null ? '' : ` · RPE ${set.rpe}`}`;
  return (
    <View style={{ paddingLeft: linked ? space.within : 0 }}>
      <RowPlate selected={isCurrent}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', height: ROW_HEIGHT, gap: space.row }}
        >
          {handle}
          <Text style={[text.numSm, { color: indexColor }]}>
            {String(set.position).padStart(2, '0')}
          </Text>
          <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`Set ${set.position}, ${typeLabel}, ${values}${done ? ', logged' : ''}. Edit set`}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: size.hit,
              justifyContent: 'center',
              gap: 4,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text
              style={[text.rowName, { color: isCurrent ? color.accent : color.hi }]}
              numberOfLines={1}
            >
              {typeLabel}
            </Text>
            <Text style={text.numSm} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {values}
            </Text>
          </Pressable>
          <Pressable
            onPress={onType}
            accessibilityRole="button"
            accessibilityLabel={`Change type of set ${set.position}`}
            style={{
              width: size.hit,
              height: size.hit,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="dots" tone={color.mid} />
          </Pressable>
          <Chevron />
        </View>
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
  onType,
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
              onType={() => onType(s.id)}
              unit={weightUnit}
            />
          </SwipeRow>
        )}
      />
      <View style={{ gap: space.row, marginTop: space.within }}>
        <RowPlate onPress={() => selectSet(addSet(sessionExerciseId, 'warmup'))}>
          <View style={{ minHeight: size.hit, justifyContent: 'center' }}>
            <Text style={text.rowName}>+ Warmup</Text>
          </View>
        </RowPlate>
        <View style={{ flexDirection: 'row', gap: space.row }}>
          <View style={{ flex: 1 }}>
            <RowPlate onPress={() => selectSet(addSet(sessionExerciseId))}>
              <View style={{ minHeight: size.hit, justifyContent: 'center' }}>
                <Text style={text.rowName}>+ Working</Text>
              </View>
            </RowPlate>
          </View>
          <View style={{ flex: 1 }}>
            <RowPlate disabled={!sets.some(isWorkingSet)} onPress={onAddDrop}>
              <View style={{ minHeight: size.hit, justifyContent: 'center' }}>
                <Text style={text.rowName}>+ Drop</Text>
              </View>
            </RowPlate>
          </View>
        </View>
      </View>
    </Sheet>
  );
}
