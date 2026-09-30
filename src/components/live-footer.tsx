import { Pressable, Text, View } from 'react-native';

import { formatClock, formatRest } from '@/lib/time';
import { color, size, space, text } from '@/theme';

import { Section } from './section';

type Props = {
  elapsedSec: number;
  restLeftSec: number;
  onClearRest: () => void;
  onFinish: () => void;
};

export function LiveFooter({ elapsedSec, restLeftSec, onClearRest, onFinish }: Props) {
  return (
    <Section plated={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.within }}>
        <Text style={text.num}>{formatClock(elapsedSec)}</Text>
        <View style={{ flex: 1 }} />
        {restLeftSec > 0 ? (
          <Pressable onPress={onClearRest} hitSlop={12}>
            <Text style={[text.num, { color: color.accent }]}>REST {formatRest(restLeftSec)}</Text>
          </Pressable>
        ) : null}
      </View>
      <Pressable
        onPress={onFinish}
        hitSlop={8}
        style={{ minHeight: size.hit, justifyContent: 'center' }}
      >
        <Text style={text.body}>Finish</Text>
      </Pressable>
    </Section>
  );
}
