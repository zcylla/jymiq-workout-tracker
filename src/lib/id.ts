/**
 * Ids for rows the user creates. The built-in library uses slugs; anything added
 * on the device needs its own.
 *
 * `crypto.randomUUID` is not dependable on Hermes and `expo-crypto` is not a
 * dependency, so this is a sortable time-prefixed id instead: the timestamp
 * keeps insertion order readable in a debugger, and the random tail makes a
 * collision within the same millisecond vanishingly unlikely for one user.
 */
export function newId(now: number = Date.now(), random: () => number = Math.random): string {
  const time = Math.floor(now).toString(36).padStart(9, '0');
  const tail = Math.floor(random() * 0x100000000)
    .toString(36)
    .padStart(7, '0');
  return `${time}-${tail}`;
}
