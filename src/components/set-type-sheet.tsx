import { Text, View } from 'react-native';

import { isWorkingSet, removalSetIds, type TypedSet } from '@/lib/set-groups';
import type { SetKind } from '@/lib/volume';
import { space, text } from '@/theme';

import { ListRow } from './list-row';
import { RowPlate, RowPlates } from './row-plate';
import { Sheet } from './sheet';

export function SetTypeSheet({
  open,
  onClose,
  sets,
  setId,
  onChoose,
  onPickDrop,
}: {
  open: boolean;
  onClose: () => void;
  sets: readonly TypedSet[];
  setId: string;
  onChoose: (kind: SetKind) => void;
  onPickDrop: () => void;
}) {
  const current = sets.find((s) => s.id === setId);
  const hasDrops = removalSetIds(sets, setId).length > 1;
  const parents = sets.filter((s) => isWorkingSet(s) && s.id !== setId);

  return (
    <Sheet open={open} onClose={onClose}>
      <Text style={text.h2}>Set type</Text>
      <View style={{ marginTop: space.within }}>
        <RowPlates>
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
            onPress={onPickDrop}
          >
            <ListRow title="Drop" meta="Linked to a working set" />
          </RowPlate>
        </RowPlates>
      </View>
      {parents.length === 0 ? (
        <Text style={[text.body, { marginTop: space.within }]}>
          Add a working set before linking a drop.
        </Text>
      ) : hasDrops ? (
        <Text style={[text.body, { marginTop: space.within }]}>
          Change or remove this set’s linked drops before changing its type.
        </Text>
      ) : null}
    </Sheet>
  );
}
