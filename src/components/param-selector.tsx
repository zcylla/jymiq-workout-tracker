import { Pressable, Text, View } from 'react-native';

import { color, lh, ls, mono, radius, wash } from '@/theme';

export type WorkoutParameter = 'load' | 'reps' | 'rpe';

type Props = {
  active: WorkoutParameter;
  values: Record<WorkoutParameter, string | number>;
  /** Appended only to the active RPE unit, e.g. `RPE · RIR 2`. */
  gloss?: string;
  onSelect: (parameter: WorkoutParameter) => void;
};

const PARAMETERS: { key: WorkoutParameter; unit: string }[] = [
  { key: 'load', unit: 'KG' },
  { key: 'reps', unit: 'REPS' },
  { key: 'rpe', unit: 'RPE' },
];

/** The active input parameter below a live-session dial. */
export function ParamSelector({ active, values, gloss, onSelect }: Props) {
  return (
    <View style={{ width: '100%', flexDirection: 'row', gap: 6, paddingHorizontal: 4 }}>
      {PARAMETERS.map(({ key, unit }) => {
        const selected = key === active;
        const label = selected && gloss ? `${unit} · ${gloss}` : unit;

        return (
          <Pressable
            key={key}
            onPress={() => onSelect(key)}
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
    </View>
  );
}
