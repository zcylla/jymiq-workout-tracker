import { ART_KEYS, exerciseStill, exerciseStillByKey } from './exercise-art';
import { matchArtKey } from '../lib/exercise-art-match';

const stillsByName = new Map<string, number | undefined>();

export function exerciseStillFor(id: string | null | undefined, name?: string): number | undefined {
  const still = id ? exerciseStill(id) : undefined;
  if (still !== undefined) return still;
  if (!name) return undefined;

  if (!stillsByName.has(name)) {
    const key = matchArtKey(name, ART_KEYS);
    stillsByName.set(name, key ? exerciseStillByKey(key) : undefined);
  }
  return stillsByName.get(name);
}
