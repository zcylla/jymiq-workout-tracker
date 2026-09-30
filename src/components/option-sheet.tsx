import { Pressable, Text, View } from 'react-native';

import { color, hairline, mono, radius, size, text, wash } from '@/theme';

import { key } from './haptics';
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
      <View style={{ gap: 8 }}>
        <Text style={[text.label, { marginBottom: 4 }]}>{title.toUpperCase()}</Text>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => {
                key();
                onPick(option.value);
                onClose();
              }}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={({ pressed }) => ({
                minHeight: size.hit,
                justifyContent: 'center',
                paddingHorizontal: 16,
                borderRadius: radius.row,
                borderCurve: 'continuous',
                backgroundColor: selected ? color.accent : wash.field,
                borderWidth: selected ? 0 : 1,
                borderColor: hairline.onPlate,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                style={{
                  ...mono(selected ? 600 : 500),
                  fontSize: 15,
                  color: selected ? color.ink : color.hi,
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}
