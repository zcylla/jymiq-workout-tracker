import { Text, View } from 'react-native';

import { formatMinutes, isPlausibleDuration, sessionDateLabel } from '@/lib/time';
import { formatWeight, type Unit } from '@/lib/units';
import { formatTonnage } from '@/lib/volume';
import { text } from '@/theme';

import { Pill } from './pill';

/**
 * lab34.py:88-97's LAST THREE rail body, and lab43's RECENT rail: a two-line
 * stack per session — date, PR pill, tonnage over a mono meta line.
 *
 * Shared because Today's rail spans routines and routine detail's does not,
 * which is the only difference between them: Today passes the routine's name
 * and gets it as the first thing on the meta line.
 */
export function SessionRow({
  startedAt,
  name,
  durationSec,
  totalSets,
  totalVolumeKg,
  topSet,
  hasRecord = false,
  unit,
}: {
  startedAt: number;
  /** Which routine this was. Omitted on a screen that is already one routine. */
  name?: string | null;
  durationSec: number | null;
  totalSets: number | null;
  totalVolumeKg: number | null;
  topSet?: { weightKg: number | null; reps: number | null } | null;
  hasRecord?: boolean;
  /** The display unit; totals are stored in kg. */
  unit: Unit;
}) {
  const meta: string[] = [];
  if (name) meta.push(name.toUpperCase());
  if (isPlausibleDuration(durationSec)) meta.push(formatMinutes(durationSec));
  meta.push(`${totalSets ?? 0} SETS`);
  if (topSet?.weightKg != null)
    meta.push(`TOP ${formatWeight(topSet.weightKg, unit)} × ${topSet.reps}`);

  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
        <Text style={text.num}>{sessionDateLabel(startedAt)}</Text>
        {hasRecord ? <Pill label="PR" /> : null}
        <View style={{ flex: 1 }} />
        {totalVolumeKg != null ? (
          <Text style={text.numSm}>{formatTonnage(totalVolumeKg, unit)}</Text>
        ) : null}
      </View>
      <Text style={text.meta}>{meta.join(' · ')}</Text>
    </>
  );
}
