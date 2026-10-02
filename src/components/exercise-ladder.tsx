import { useEffect } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { closestExerciseRung } from '@/lib/exercise-ladder';
import { color, motion, radius, size, text } from '@/theme';

const LADDER_EDGE = 10;
const HOLD_MS = 350;
const POP = { duration: 180, dampingRatio: 0.85 };

type Rung = { id: string; name: string; done: boolean };
type Props = {
  rungs: Rung[];
  currentId: string;
  dimmed: boolean;
  onPress: () => void;
  onSelect: (id: string) => void;
};

function ExerciseRung({
  rung,
  index,
  current,
  selectedSV,
  scrubbingSV,
  labelWidth,
}: {
  rung: Rung;
  index: number;
  current: boolean;
  selectedSV: SharedValue<number>;
  scrubbingSV: SharedValue<boolean>;
  labelWidth: number;
}) {
  const reducedMotion = useReducedMotion();
  const restingColor = current ? color.accent : rung.done ? color.done : color.dim;
  const popStyle = useAnimatedStyle(() => {
    const selected = scrubbingSV.get() && selectedSV.get() === index;
    return {
      transform: [
        { translateX: reducedMotion ? 0 : withSpring(selected ? 6 : 0, POP) },
        { scale: reducedMotion ? 1 : withSpring(selected ? 1.12 : 1, POP) },
      ],
    };
  });
  const numberStyle = useAnimatedStyle(() => ({
    color: scrubbingSV.get() ? (selectedSV.get() === index ? color.hi : color.dim) : restingColor,
  }));
  const labelStyle = useAnimatedStyle(() => {
    const selected = selectedSV.get() === index;
    return {
      opacity: scrubbingSV.get() ? 1 : 0,
      backgroundColor: selected ? color.accent : color.raised,
      color: selected ? color.ink : color.mid,
    };
  });

  return (
    <View style={{ minHeight: 25, justifyContent: 'center', paddingVertical: 4 }}>
      <Animated.View pointerEvents="none" style={popStyle}>
        <Animated.Text style={[text.meta, numberStyle]}>{index + 1}</Animated.Text>
        <Animated.Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[
            text.meta,
            {
              position: 'absolute',
              left: 30,
              top: -4,
              width: labelWidth,
              paddingHorizontal: 9,
              paddingVertical: 4,
              borderRadius: radius.pill,
            },
            labelStyle,
          ]}
        >
          {rung.name}
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

export function ExerciseLadder({ rungs, currentId, dimmed, onPress, onSelect }: Props) {
  const { width } = useWindowDimensions();
  const rowHeightSV = useSharedValue(0);
  const selectedSV = useSharedValue(-1);
  const scrubbingSV = useSharedValue(false);
  const count = rungs.length;
  const currentIndex = rungs.findIndex((rung) => rung.id === currentId);
  const rungOrder = rungs.map((rung) => rung.id).join(',');

  useEffect(() => {
    scrubbingSV.set(false);
    selectedSV.set(-1);
  }, [dimmed, currentId, rungOrder, scrubbingSV, selectedSV]);

  const select = (index: number) => {
    const rung = rungs[index];
    if (!dimmed && rung && rung.id !== currentId) onSelect(rung.id);
  };

  const scrub = Gesture.Pan()
    .enabled(!dimmed && count > 0)
    .activateAfterLongPress(HOLD_MS)
    .maxPointers(1)
    .shouldCancelWhenOutside(false)
    .onStart((event) => {
      selectedSV.set(closestExerciseRung(event.y, rowHeightSV.get(), count));
      scrubbingSV.set(true);
    })
    .onUpdate((event) => {
      if (!scrubbingSV.get()) return;
      const index = closestExerciseRung(event.y, rowHeightSV.get(), count);
      if (selectedSV.get() !== index) selectedSV.set(index);
    })
    .onEnd((_event, success) => {
      if (success && scrubbingSV.get() && selectedSV.get() >= 0) {
        scheduleOnRN(select, selectedSV.get());
      }
    })
    .onFinalize(() => {
      scrubbingSV.set(false);
      selectedSV.set(-1);
    });
  const tap = Gesture.Tap().onEnd((_event, success) => {
    if (success) scheduleOnRN(onPress);
  });

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: LADDER_EDGE,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        opacity: dimmed ? 0.28 : 1,
        transitionProperty: 'opacity',
        transitionDuration: motion.base,
      }}
    >
      <GestureDetector gesture={Gesture.Exclusive(scrub, tap)}>
        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`Exercises, ${currentIndex + 1} of ${count}, ${rungs[currentIndex]?.name ?? ''}`}
          accessibilityHint="Tap to open the exercise list. Hold and slide, then release to select an exercise."
          accessibilityActions={[
            { name: 'activate', label: 'Open exercise list' },
            ...(!dimmed
              ? [
                  { name: 'increment', label: 'Next exercise' },
                  { name: 'decrement', label: 'Previous exercise' },
                ]
              : []),
          ]}
          onAccessibilityTap={onPress}
          onAccessibilityAction={({ nativeEvent }) => {
            if (nativeEvent.actionName === 'activate') onPress();
            else if (nativeEvent.actionName === 'increment') select(currentIndex + 1);
            else if (nativeEvent.actionName === 'decrement') select(currentIndex - 1);
          }}
          onLayout={({ nativeEvent }) => {
            rowHeightSV.set(count > 0 ? nativeEvent.layout.height / count : 0);
          }}
          style={{ width: size.hit, minHeight: size.hit }}
        >
          {rungs.map((rung, index) => (
            <ExerciseRung
              key={rung.id}
              rung={rung}
              index={index}
              current={rung.id === currentId}
              selectedSV={selectedSV}
              scrubbingSV={scrubbingSV}
              labelWidth={Math.min(230, Math.max(0, width - LADDER_EDGE - 64))}
            />
          ))}
        </View>
      </GestureDetector>
    </Animated.View>
  );
}
