import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';

import { restProgress, type RestSweep, updateRestSweep } from '@/lib/rest';
import { formatRest } from '@/lib/time';
import { color, hairline, size, text } from '@/theme';

import { AnimatedPressable, usePressFeel } from './press';
import { Waiting } from './waiting';

type Props = {
  /** The wall-clock target, the only truth; the countdown is derived from it. */
  restUntil: number;
  loggedSets: number;
  /** Whole seconds left, from the screen's one clock. */
  leftSec: number;
  onExtend: () => void;
  onSkip: () => void;
};

let lastSweep: RestSweep | null = null;

function TextButton({ label, onPress }: { label: string; onPress: () => void }) {
  const press = usePressFeel();
  return (
    <AnimatedPressable
      onPress={onPress}
      {...press.handlers}
      accessibilityRole="button"
      style={[
        { minHeight: size.hit, minWidth: size.hit, alignItems: 'center', justifyContent: 'center' },
        press.style,
      ]}
    >
      <Text style={text.body}>{label}</Text>
    </AnimatedPressable>
  );
}

/**
 * Lab 06 tile 04: a linear sweep driven from the timestamp, so a backgrounded
 * app cannot drift it. The line is the share of this rest still to go; +30s
 * grows the span rather than restarting it.
 */
export function RestTimer({ restUntil, loggedSets, leftSec, onExtend, onSkip }: Props) {
  const [start] = useState(() => {
    const nowMs = Date.now();
    const sweep = updateRestSweep(lastSweep, restUntil, loggedSets, nowMs);
    return { sweep, progress: restProgress(sweep, nowMs) };
  });
  const progressSV = useSharedValue(start.progress);
  const sweepSV = useSharedValue<RestSweep | null>(start.sweep);

  useEffect(() => {
    const nowMs = Date.now();
    lastSweep = updateRestSweep(lastSweep, restUntil, loggedSets, nowMs);
    sweepSV.set(lastSweep);
    progressSV.set(restProgress(lastSweep, nowMs));
  }, [restUntil, loggedSets, progressSV, sweepSV]);

  useFrameCallback(() => {
    progressSV.set(restProgress(sweepSV.get(), Date.now()));
  });

  // scaleX, not width: a width change is a layout pass every frame, a transform is not.
  const fill = useAnimatedStyle(() => ({ transform: [{ scaleX: progressSV.get() }] }));

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Waiting>
          <Text style={[text.num, { color: color.accent }]}>REST {formatRest(leftSec)}</Text>
        </Waiting>
        <View style={{ flex: 1 }} />
        <TextButton label="+30s" onPress={onExtend} />
        <TextButton
          label="Skip"
          onPress={() => {
            lastSweep = null;
            onSkip();
          }}
        />
      </View>
      <View style={{ height: 2, backgroundColor: hairline.onGround }}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              transformOrigin: 'left',
              backgroundColor: color.accent,
            },
            fill,
          ]}
        />
      </View>
    </View>
  );
}
