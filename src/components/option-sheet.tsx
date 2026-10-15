import { Text, View } from 'react-native';

import { color, mono, size, space, text } from '@/theme';

import { key } from './haptics';
import { RowPlate, RowPlates, useRowSelected } from './row-plate';
import { Sheet } from './sheet';

type Props<T extends string | number> = {
  open: boolean;
  title: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onPick: (value: T) => void;
  onClose: () => void;
};

/** A short fixed list, one tap to choose: the pick is the confirm. */
export function OptionSheet<T extends string | number>({
  open,
  title,
  options,
  value,
  onPick,
  onClose,
}: Props<T>) {
  return (
    <Sheet open={open} onClose={onClose}>
      <View style={{ gap: space.row }}>
        <Text style={[text.label, { marginBottom: 4 }]}>{title.toUpperCase()}</Text>
        <RowPlates>
          {options.map((option) => (
            <RowPlate
              key={option.value}
              selected={option.value === value}
              onPress={() => {
                key();
                onPick(option.value);
                onClose();
              }}
            >
              <OptionLabel label={option.label} />
            </RowPlate>
          ))}
        </RowPlates>
      </View>
    </Sheet>
  );
}

function OptionLabel({ label }: { label: string }) {
  const selected = useRowSelected();
  return (
    <View style={{ minHeight: size.hit, justifyContent: 'center' }}>
      <Text
        style={{
          ...mono(selected ? 600 : 500),
          fontSize: 15,
          color: selected ? color.accent : color.hi,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
