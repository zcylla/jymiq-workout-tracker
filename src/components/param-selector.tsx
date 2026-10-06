import { Pressable, Text, View } from 'react-native';

import { color, hairline, lh, ls, mono, radius, wash } from '@/theme';

import { pop } from './haptics';

export type WorkoutParameter = 'load' | 'reps' | 'rpe';

type Props = {
  active: WorkoutParameter;
  weightUnit?: 'kg' | 'lb';
  values: Record<WorkoutParameter, string | number>;
  /** Appended only to the active RPE unit, e.g. `RPE · RIR 2`. */
  gloss?: string;
  onSelect: (parameter: WorkoutParameter) => void;
  /** Long press opens the numeric route for the same parameter. */
  onLongPress?: (parameter: WorkoutParameter) => void;
  /** Opens the keypad for the active parameter, so a custom value never depends on the dial. */
  onType?: (parameter: WorkoutParameter) => void;
  /** RPE is absent unless the exercise opts into tracking it. */
  parameters?: readonly WorkoutParameter[];
};

const PARAMETERS: { key: WorkoutParameter; unit: string }[] = [
  { key: 'load', unit: 'KG' },
  { key: 'reps', unit: 'REPS' },
  { key: 'rpe', unit: 'RPE' },
];

/** The active input parameter below a live-session dial. */
export function ParamSelector({
  active,
  weightUnit = 'kg',
  values,
  gloss,
  onSelect,
  onLongPress,
  onType,
  parameters = PARAMETERS.map((parameter) => parameter.key),
}: Props) {
  return (
    <View style={{ width: '100%', flexDirection: 'row', gap: 6, paddingHorizontal: 4 }}>
      {PARAMETERS.filter(({ key }) => parameters.includes(key)).map(({ key, unit }) => {
        const selected = key === active;
        const unitLabel = key === 'load' ? weightUnit.toUpperCase() : unit;
        const label = selected && gloss ? `${unitLabel} · ${gloss}` : unitLabel;

        return (
          <Pressable
            key={key}
            onPress={() => {
              if (!selected) pop();
              onSelect(key);
            }}
            onLongPress={() => onLongPress?.(key)}
            hitSlop={{ top: 4, bottom: 4 }}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 44,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              paddingVertical: 7,
              borderRadius: radius.row,
              borderCurve: 'continuous',
              backgroundColor: selected ? wash.accent : undefined,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text
              style={{
                ...mono(400),
                fontSize: 11,
                lineHeight: lh(11),
                letterSpacing: ls(0.12, 11),
                color: selected ? color.accent : color.lo,
              }}
            >
              {label}
            </Text>
            <Text
              style={{
                ...mono(600),
                fontSize: 20,
                lineHeight: lh(20),
                letterSpacing: ls(-0.03, 20),
                color: selected ? color.hi : color.mid,
              }}
            >
              {values[key]}
            </Text>
          </Pressable>
        );
      })}
      {onType ? (
        <Pressable
          onPress={() => onType(active)}
          hitSlop={{ top: 4, bottom: 4 }}
          accessibilityRole="button"
          accessibilityLabel="Type a value"
          style={({ pressed }) => ({
            minWidth: 58,
            minHeight: 44,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: radius.row,
            borderCurve: 'continuous',
            backgroundColor: wash.field,
            borderWidth: 1,
            borderColor: hairline.onPlate,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text
            style={{
              ...mono(400),
              fontSize: 11,
              lineHeight: lh(11),
              letterSpacing: ls(0.12, 11),
              color: color.mid,
            }}
          >
            TYPE
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
