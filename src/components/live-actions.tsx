import { Pressable, Text, View } from 'react-native';

import { size, space, text } from '@/theme';

type Props = {
  onSwap: () => void;
  onHistory: () => void;
};

function Action({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={{ left: 8, right: 8 }}
      accessibilityRole="button"
      style={({ pressed }) => ({
        minHeight: size.hit,
        paddingHorizontal: space.within,
        justifyContent: 'center',
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Text style={text.label}>{label}</Text>
    </Pressable>
  );
}

/** The current lift's two secondary destinations, as text. */
export function LiveActions({ onSwap, onHistory }: Props) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: space.between }}>
      <Action label="SWAP" onPress={onSwap} />
      <Action label="HISTORY" onPress={onHistory} />
    </View>
  );
}
