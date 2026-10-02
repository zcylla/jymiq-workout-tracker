import { useState } from 'react';
import { Text, View } from 'react-native';

import { dropParent, isWorkingSet, removalSetIds, type TypedSet } from '@/lib/set-groups';
import { formatWeight, type Unit } from '@/lib/units';
import type { SetKind } from '@/lib/volume';
import { space, text } from '@/theme';

import { ListRow } from './list-row';
import { RowPlate, RowPlates } from './row-plate';
import { Sheet } from './sheet';

type SheetSet = TypedSet & { weightKg: number | null; reps: number | null };

export function SetTypeSheet({
  open,
  onClose,
  sets,
  setId,
  addingDrop = false,
  unit,
  onChoose,
}: {
  open: boolean;
  onClose: () => void;
  sets: readonly SheetSet[];
  setId: string;
  addingDrop?: boolean;
  unit: Unit;
  onChoose: (kind: SetKind, parentId?: string) => void;
}) {
  const [choosingParent, setChoosingParent] = useState(addingDrop);
  const current = sets.find((s) => s.id === setId);
  const hasDrops = removalSetIds(sets, setId).length > 1;
  const parents = sets.filter((s) => isWorkingSet(s) && (addingDrop || s.id !== setId));
  const parentId = dropParent(sets, setId)?.id ?? (current && isWorkingSet(current) ? setId : null);

  return (
    <Sheet open={open} onClose={onClose}>
      <Text style={text.h2}>{choosingParent ? 'Link drop to a working set' : 'Set type'}</Text>
      <View style={{ marginTop: space.within }}>
        <RowPlates>
          {choosingParent ? (
            parents.map((parent) => (
              <RowPlate
                key={parent.id}
                selected={parent.id === parentId}
                onPress={() => onChoose('drop', parent.id)}
              >
                <ListRow
                  title={`Set ${sets.findIndex((s) => s.id === parent.id) + 1}`}
                  meta={`${parent.weightKg == null ? '—' : formatWeight(parent.weightKg, unit)} ${unit.toUpperCase()} × ${parent.reps ?? '—'}`}
                />
              </RowPlate>
            ))
          ) : (
            <>
              <RowPlate
                selected={current?.kind === 'warmup'}
                disabled={hasDrops}
                onPress={() => onChoose('warmup')}
              >
                <ListRow title="Warmup" meta="Preparation before working sets" chevron={false} />
              </RowPlate>
              <RowPlate selected={current?.kind === 'working'} onPress={() => onChoose('working')}>
                <ListRow title="Working" meta="Your regular training set" chevron={false} />
              </RowPlate>
              <RowPlate
                selected={current?.kind === 'drop'}
                disabled={hasDrops || parents.length === 0}
                onPress={() => setChoosingParent(true)}
              >
                <ListRow title="Drop" meta="Linked to a working set" />
              </RowPlate>
            </>
          )}
        </RowPlates>
      </View>
      {parents.length === 0 ? (
        <Text style={[text.body, { marginTop: space.within }]}>
          Add a working set before linking a drop.
        </Text>
      ) : hasDrops && !addingDrop ? (
        <Text style={[text.body, { marginTop: space.within }]}>
          Change or remove this set’s linked drops before changing its type.
        </Text>
      ) : null}
      {choosingParent && !addingDrop ? (
        <View style={{ marginTop: space.within }}>
          <RowPlate onPress={() => setChoosingParent(false)}>
            <ListRow title="Back to set types" />
          </RowPlate>
        </View>
      ) : null}
    </Sheet>
  );
}
