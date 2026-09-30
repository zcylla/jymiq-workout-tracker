import { useEffect } from 'react';
import { Easing, useSharedValue, withTiming } from 'react-native-reanimated';

import { motion } from '@/theme';

/** A shared value that eases to `target` over `motion.base`, starting from `from` on mount. */
export function useTween(target: number, from = 0) {
  const valueSV = useSharedValue(from);
  useEffect(() => {
    valueSV.set(withTiming(target, { duration: motion.base, easing: Easing.out(Easing.cubic) }));
  }, [target, valueSV]);
  return valueSV;
}
