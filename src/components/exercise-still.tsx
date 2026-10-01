import { Image } from 'expo-image';

import { exerciseStillFor } from '@/data/exercise-image';
import { color } from '@/theme';

type Props = {
  exerciseId?: string | null;
  name?: string;
  size?: number;
};

/** The library still, tinted at render (the CC BY-SA source is never edited). No art draws nothing. */
export function ExerciseStill({ exerciseId, name, size = 32 }: Props) {
  const source = exerciseStillFor(exerciseId, name);
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
