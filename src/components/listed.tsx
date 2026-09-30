import type { ReactNode } from 'react';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { motion } from '@/theme';

const STAGGER = 30;
const STAGGERED = 8;

/** Entrance and reflow for one row of a list. Past the first eight rows nothing staggers in. */
export function listMotion(index: number) {
  return {
    entering: index < STAGGERED ? FadeIn.delay(index * STAGGER).duration(motion.base) : undefined,
    layout: LinearTransition.duration(motion.base),
  };
}

export function Listed({ index, children }: { index: number; children: ReactNode }) {
  return <Animated.View {...listMotion(index)}>{children}</Animated.View>;
}
