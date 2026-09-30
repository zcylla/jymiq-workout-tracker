import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';

import { formatClock } from '@/lib/time';
import { size, space, text } from '@/theme';

import { pop } from './haptics';
import { RestTimer } from './rest-timer';
import { Section } from './section';

/** A pop this late is a backgrounded app catching up, not the end of a rest. */
const LATE_MS = 1500;

type Props = {
  elapsedSec: number;
  restUntil: number | null;
  restLeftSec: number;
  onExtendRest: () => void;
  onSkipRest: () => void;
  onFinish: () => void;
};

export function LiveFooter({
  elapsedSec,
  restUntil,
  restLeftSec,
  onExtendRest,
  onSkipRest,
  onFinish,
}: Props) {
  // The pop lives here, not in the timer: the timer unmounts on the clock's next
  // tick, which can beat a timeout set for the same instant.
  useEffect(() => {
    if (restUntil == null) return;
    const wait = restUntil - Date.now();
    if (wait <= 0) return;
    const id = setTimeout(() => {
      if (Date.now() - restUntil < LATE_MS) pop();
    }, wait);
    return () => clearTimeout(id);
  }, [restUntil]);

  return (
    <Section plated={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.within }}>
        {restUntil != null && restLeftSec > 0 ? (
          <RestTimer
            restUntil={restUntil}
            leftSec={restLeftSec}
            onExtend={onExtendRest}
            onSkip={onSkipRest}
          />
        ) : (
          <Text style={text.num}>{formatClock(elapsedSec)}</Text>
        )}
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
