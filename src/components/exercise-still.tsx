import { Image } from 'expo-image';

import { exerciseStill } from '@/data/exercise-art';
import { color } from '@/theme';

type Props = {
  exerciseId?: string | null;
  size?: number;
};

/** The library still, tinted at render (the CC BY-SA source is never edited). No art draws nothing. */
export function ExerciseStill({ exerciseId, size = 32 }: Props) {
  const source = exerciseId ? exerciseStill(exerciseId) : undefined;
  if (source == null) return null;
  return (
    <Image
      source={source}
      style={{ width: size, height: size }}
      contentFit="contain"
      tintColor={color.mid}
      cachePolicy="memory-disk"
      transition={0}
    />
  );
}
