import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { color, size, text } from '@/theme';

import { Icon } from './icon';

type Props = {
  title: string;
  /** The mono label above the title. */
  kicker?: string;
  /** An action on the title's line — a search or gear icon, usually. */
  right?: ReactNode;
  /** Given, the header becomes a pushed screen's: back affordance on its own line. */
  onBack?: () => void;
};

/**
 * kit's `head()` and `back_head()`. Editorial — the title carries the screen and
 * nothing is ruled off. A pushed screen puts the back affordance on its own
 * 44pt line above the title, because it loses the tab bar and the title has to
 * stay where the eye already is.
 */
export function ScreenHeader({ title, kicker, right, onBack }: Props) {
  const heading = (
    <View style={{ gap: 5 }}>
      {kicker ? <Text style={text.label}>{kicker}</Text> : null}
      <Text style={text.h1}>{title}</Text>
    </View>
  );

  if (onBack) {
    return (
      <View style={{ paddingTop: 6, paddingBottom: 2, gap: 9 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: size.hit }}>
          <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
            <Icon name="back" tone={color.mid} />
          </Pressable>
          <View style={{ flex: 1 }} />
          {right}
        </View>
        {heading}
      </View>
    );
  }

  return (
    <View style={{ paddingTop: 10, paddingBottom: 2, gap: 5 }}>
      {kicker ? <Text style={text.label}>{kicker}</Text> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={text.h1}>{title}</Text>
        <View style={{ flex: 1 }} />
        {right}
      </View>
    </View>
  );
}
