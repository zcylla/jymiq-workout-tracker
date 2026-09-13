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

/** Eight hours is far past any real strength session, so a stored duration
 * above this means the session was left open, not that it was trained. */
export const SESSION_DURATION_CEILING_SEC = 8 * 3600;

/**
 * The duration to persist for a finished/abandoned session. The wall clock is
 * the truth when it is plausible; otherwise it falls back to the span up to
 * the last completed set, and failing that gives up rather than inventing one.
 */
export function resolveSessionDurationSec(
  startedAt: number,
  pausedMs: number,
  endedAt: number,
  lastCompletedAt: number | null,
): number | null {
  const wallClock = elapsedSec(startedAt, pausedMs, endedAt);
  if (wallClock <= SESSION_DURATION_CEILING_SEC) return wallClock;
  if (lastCompletedAt == null) return null;
  const toLastSet = elapsedSec(startedAt, pausedMs, lastCompletedAt);
  return toLastSet <= SESSION_DURATION_CEILING_SEC ? toLastSet : null;
}

/** `'—'` for a missing or poisoned duration, otherwise `formatDuration`. */
export function formatSessionDuration(sec: number | null): string {
  if (sec == null || sec > SESSION_DURATION_CEILING_SEC) return '—';
  return formatDuration(sec);
}

/** Always the minutes form, e.g. `64 MIN` — used by rail meta lines, which
 * never switch to the hour form `formatDuration` uses past 60 minutes. */
export function formatMinutes(sec: number): string {
  return `${Math.max(0, Math.round(sec / 60))} MIN`;
}

/** "Today"/"TODAY", or "Tue 2 Sep"/"TUE 2 SEP" for anything else. */
export function sessionDateLabel(
  atMs: number,
  opts: { upper?: boolean; now?: number } = {},
): string {
  const end = new Date(atMs);
  const now = new Date(opts.now ?? Date.now());
  const sameDay =
    end.getFullYear() === now.getFullYear() &&
    end.getMonth() === now.getMonth() &&
    end.getDate() === now.getDate();
  if (sameDay) return opts.upper ? 'TODAY' : 'Today';
  const weekday = end.toLocaleDateString('en-US', { weekday: 'short' });
  const month = end.toLocaleDateString('en-US', { month: 'short' });
  const label = `${weekday} ${end.getDate()} ${month}`;
  return opts.upper ? label.toUpperCase() : label;
}
