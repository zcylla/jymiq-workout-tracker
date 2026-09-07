/** Session clocks. Elapsed time is always derived from wall clock, never counted. */
export function elapsedSec(startedAt: number, pausedMs = 0, now = Date.now()): number {
  return Math.max(0, Math.floor((now - startedAt - pausedMs) / 1000));
}

const pad = (n: number) => (n < 10 ? `0${n}` : String(n));

/** "00:31:17" — the live header. */
export function formatClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

/** "1H 04" — the recap tile. */
export function formatDuration(sec: number): string {
  const m = Math.max(0, Math.round(sec / 60));
  return m >= 60 ? `${Math.floor(m / 60)}H ${pad(m % 60)}` : `${m} MIN`;
}

/** "2:30" — the rest countdown. */
export function formatRest(sec: number): string {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
}

/** Seconds left on a rest timer whose truth is a wall-clock target. */
export function restRemainingSec(restUntil: number | null, now = Date.now()): number {
  if (restUntil == null) return 0;
  return Math.max(0, Math.ceil((restUntil - now) / 1000));
}
