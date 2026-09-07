import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { chromeShadow, color, fabShadow, radius, text } from '@/theme';

/** The plane the bar occupies, so a `Screen` under it can clear its last row. */
export function useActionBarHeight() {
  const insets = useSafeAreaInsets();
  return BAR_HEIGHT + Math.max(insets.bottom + 8, 30);
}

const BAR_HEIGHT = 56;

/**
 * kit's `actionbar()`. A pushed screen has no tab bar, so its primary action
 * takes that plane — same geometry as the bar it replaces.
 */
export function ActionBar({
  primary,
  onPrimary,
  secondary,
  onSecondary,
}: {
  primary: string;
  onPrimary?: () => void;
  secondary?: string;
  onSecondary?: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
        marginHorizontal: 16,
        marginBottom: Math.max(insets.bottom + 8, 30),
      }}
    >
      {secondary ? (
        <Pressable
          onPress={onSecondary}
          style={({ pressed }) => [
            {
              minHeight: BAR_HEIGHT,
              paddingHorizontal: 18,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radius.bar,
              borderCurve: 'continuous',
              backgroundColor: color.raised,
              boxShadow: chromeShadow,
            },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={[text.pill, { color: color.hi }]}>{secondary}</Text>
        </Pressable>
      ) : null}

      <Pressable
        onPress={onPrimary}
        style={({ pressed }) => [
          {
            flex: 1,
            minHeight: BAR_HEIGHT,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: radius.bar,
            borderCurve: 'continuous',
            backgroundColor: color.accent,
            boxShadow: fabShadow,
          },
          pressed && { opacity: 0.85 },
        ]}
      >
        <Text style={text.action}>{primary}</Text>
      </Pressable>
    </View>
  );
}
