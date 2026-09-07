import { Pressable, Text, View } from 'react-native';

import { color, radius, size, text, wash } from '@/theme';

/**
 * kit's `toggle()`. The switch is drawn at 44x26, under the touch floor on its
 * own, so the whole row is the target rather than the knob.
 */
export function Toggle({
  label,
  meta,
  on,
  onToggle,
}: {
  label: string;
  meta?: string;
  on: boolean;
  onToggle?: (next: boolean) => void;
}) {
  return (
    <Pressable
      onPress={() => onToggle?.(!on)}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 7,
        minHeight: size.hit,
      }}
    >
      <View style={{ gap: 3, flexShrink: 1 }}>
        <Text style={text.rowName}>{label}</Text>
        {meta ? <Text style={text.meta}>{meta}</Text> : null}
      </View>
      <View style={{ flex: 1 }} />
      <View
        style={{
          width: 44,
          height: 26,
          borderRadius: radius.full,
          padding: 3,
          flexDirection: 'row',
          justifyContent: on ? 'flex-end' : 'flex-start',
          backgroundColor: on ? color.accent : wash.off,
        }}
      >
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: radius.full,
            backgroundColor: on ? color.ink : color.lo,
          }}
        />
      </View>
    </Pressable>
  );
}
