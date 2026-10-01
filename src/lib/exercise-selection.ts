export function toggleExerciseSelection(
  selection: readonly string[],
  exerciseId: string,
): string[] {
  return selection.includes(exerciseId)
    ? selection.filter((id) => id !== exerciseId)
    : [...selection, exerciseId];
}
