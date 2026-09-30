import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { color, motion, text } from '@/theme';

const LADDER_EDGE = 10;

type Props = {
  rungs: { id: string; done: boolean }[];
  currentId: string;
  dimmed: boolean;
  onPress: () => void;
};

/** K3: the ladder sits in the system's back-gesture dead band, which is
 *  safe only because it is tap-only — a tap there is always delivered,
 *  a horizontal drag never would be. */
export function ExerciseLadder({ rungs, currentId, dimmed, onPress }: Props) {
  return (
    <Animated.View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: LADDER_EDGE,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        gap: 11,
        opacity: dimmed ? 0.28 : 1,
        transitionProperty: 'opacity',
        transitionDuration: motion.base,
      }}
    >
      {rungs.map((r, i) => (
        <Pressable
          key={r.id}
          hitSlop={{ left: 10, right: 14, top: 4, bottom: 4 }}
          onPress={onPress}
        >
          <Animated.Text
            style={[
              text.meta,
              {
                color: r.id === currentId ? color.accent : r.done ? color.done : color.dim,
                transitionProperty: 'color',
                transitionDuration: motion.base,
              },
            ]}
          >
            {i + 1}
          </Animated.Text>
        </Pressable>
      ))}
    </Animated.View>
  );
}
