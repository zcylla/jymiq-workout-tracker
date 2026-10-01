import type { Bucket, Granularity, Metric } from './exercise-progress.ts';
import { formatPrValue } from './pr.ts';
import { formatWeight, type Unit } from './units.ts';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export function progressTooltip(
  bucket: Bucket,
  metric: Metric,
  gran: Granularity,
  unit: Unit,
): { heading: string; lines: string[] } {
  const date = new Date(bucket.start);
  const monthYear = `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  const day = `${date.getDate()} ${monthYear}`;
  const heading =
    gran === 'year'
      ? String(date.getFullYear())
      : gran === 'day'
        ? day
        : gran === 'week'
          ? `WEEK OF ${day}`
          : monthYear;
  const suffix = unit.toUpperCase();
  const value =
    metric === 'e1rm'
      ? `BEST e1RM · ${bucket.e1rmKg === null ? '—' : `${formatPrValue('best_e1rm', bucket.e1rmKg, unit)} ${suffix}`}`
      : metric === 'weight'
        ? `TOP WEIGHT · ${formatWeight(bucket.weightKg, unit)} ${suffix}`
        : metric === 'volume'
          ? `TOTAL VOLUME · ${formatWeight(bucket.volumeKg, unit)} ${suffix}`
          : `BEST SET · ${bucket.reps} ${bucket.reps === 1 ? 'REP' : 'REPS'}`;
  return {
    heading,
    lines: [value, `${bucket.sessions} ${bucket.sessions === 1 ? 'SESSION' : 'SESSIONS'}`],
  };
}
