export function closestExerciseRung(y: number, rowHeight: number, count: number): number {
  'worklet';
  if (count <= 0 || rowHeight <= 0) return -1;
  return Math.max(0, Math.min(count - 1, Math.floor(y / rowHeight)));
}
