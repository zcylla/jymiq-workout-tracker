import { Pressable, View } from 'react-native';

import { LOAD_SCALE, REPS_SCALE, RPE_SCALE } from '@/lib/scale';
import { formatWeight } from '@/lib/units';
import { percentOf1RM } from '@/lib/e1rm';
import { size, space } from '@/theme';

import { LoadRing } from './load-ring';
import { ParamSelector, type WorkoutParameter } from './param-selector';
import { Tape } from './tape';

const TAPE_GUTTER = 62;

/** The scale, unit and column each parameter drives. Load never leaves the ring. */
const TAPES = {
  load: { scale: LOAD_SCALE, unit: 'KG' },
  reps: { scale: REPS_SCALE, unit: 'REPS' },
  rpe: { scale: RPE_SCALE, unit: 'RPE' },
} as const;

type Props = {
  editing: WorkoutParameter | null;
  load: number;
  reps: number;
  rpe: number | null;
  oneRm: number | null;
  showRpe: boolean;
  onEdit: (parameter: WorkoutParameter) => void;
  onDetent: (value: number) => void;
  onSelect: (parameter: WorkoutParameter) => void;
  onLongPress: (parameter: WorkoutParameter) => void;
};

export function LiveInstrument({
  editing,
  load,
  reps,
  rpe,
  oneRm,
  showRpe,
  onEdit,
  onDetent,
  onSelect,
  onLongPress,
}: Props) {
  const params: WorkoutParameter[] = showRpe ? ['load', 'reps', 'rpe'] : ['load', 'reps'];
  const rpeText = rpe == null ? '—' : String(rpe);

  // The ring is the load gauge in every state and never re-scales — what you
  // are editing is said by the selector, not by the middle of the dial.
  const core = {
    label: 'LOAD',
    value: formatWeight(load),
    subline: oneRm ? `KG · ${percentOf1RM(load, oneRm)}%` : 'KG',
    editing: editing !== null,
    chips: editing
      ? undefined
      : [
          { value: String(reps), unit: 'REPS' },
          ...(showRpe ? [{ value: rpeText, unit: 'RPE' }] : []),
        ],
  };

  return (
    <View style={{ paddingTop: space.between, gap: 8 }}>
      <View style={{ paddingRight: editing ? TAPE_GUTTER : 0, alignItems: 'center' }}>
        <Pressable
          onPress={() => onEdit('load')}
          disabled={editing !== null}
          accessibilityRole="button"
          accessibilityLabel="Edit load"
        >
          <LoadRing
            size={editing ? size.ringEdit : size.ringRest}
            scale={LOAD_SCALE}
            value={load}
            mark={oneRm}
            // The numerals mean the perimeter is live, which is only true of load.
            showNumerals={editing === 'load'}
            core={core}
          />
        </Pressable>
        {editing ? (
          <View style={{ position: 'absolute', right: 0, top: -6 }}>
            <Tape
              scale={TAPES[editing].scale}
              value={editing === 'load' ? load : editing === 'reps' ? reps : (rpe ?? 5)}
              unit={TAPES[editing].unit}
              onDetent={onDetent}
            />
          </View>
        ) : null}
      </View>

      {editing ? (
        <ParamSelector
          active={editing}
          parameters={params}
          values={{ load: formatWeight(load), reps: String(reps), rpe: rpeText }}
          onSelect={onSelect}
          onLongPress={onLongPress}
        />
      ) : null}
    </View>
  );
}
