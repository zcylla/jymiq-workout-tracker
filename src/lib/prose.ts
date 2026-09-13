/**
 * exercises-dataset publishes `instructions.en` as a paragraph and
 * `instruction_steps.en` as the same paragraph split on sentences, so the seed
 * stores one text in two columns: 94 of the 94 rows that carry both are
 * verbatim identical. The exercise screen would print the procedure twice and
 * never say what the lift is.
 *
 * The board wants two different registers there — orientation prose, then
 * coaching cues — so when the two are the same text only the cues are drawn.
 */

/** Compare on letters and digits alone: sentence splitting moves punctuation. */
function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** True when `steps` joined say nothing `description` does not already say. */
export function sameProse(description: string | null, steps: readonly string[]): boolean {
  if (!description || steps.length === 0) return false;
  const a = normalise(description);
  return a.length > 0 && a === normalise(steps.join(' '));
}
