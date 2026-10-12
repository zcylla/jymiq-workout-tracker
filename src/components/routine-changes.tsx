import { Pressable, Text, View } from 'react-native';

import { describeChange } from '@/lib/routine-change-text';
import type { RoutineChange } from '@/lib/routine-diff';
import type { Unit } from '@/lib/units';
import { size, space, text } from '@/theme';

import { pop } from './haptics';
import { Listed } from './listed';
import { Pill, type PillTone } from './pill';
import { RowPlate, RowPlates } from './row-plate';
import { Section } from './section';

const TAG_TONE: Record<RoutineChange['kind'], PillTone> = {
  add: 'accent',
  swap: 'accent',
  remove: 'live',
  sets: 'quiet',
  reps: 'quiet',
  load: 'quiet',
};

function SaveButton({
  label,
  accessibilityLabel,
  onPress,
}: {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        pop();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => ({
        minWidth: size.hit,
        minHeight: size.hit,
        paddingLeft: space.within,
        alignItems: 'flex-end',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text style={text.pill}>{label}</Text>
    </Pressable>
  );
}

/**
 * What the session did differently from its routine, each change on its own row
 * with its own SAVE. The rows are the plates; the section around them is not.
 */
export function RoutineChangesSection({
  routineName,
  changes,
  names,
  unit,
  onSave,
  onSaveAll,
}: {
  routineName: string;
  changes: readonly RoutineChange[];
  names: Readonly<Record<string, string>>;
  unit: Unit;
  onSave: (change: RoutineChange) => void;
  onSaveAll: () => void;
}) {
  if (changes.length === 0) return null;

  return (
    <Section
      label="ROUTINE CHANGES"
      plated={false}
      right={
        changes.length > 1 ? (
          <SaveButton
            label="SAVE ALL"
            accessibilityLabel={`Save all ${changes.length} changes to ${routineName}`}
            onPress={onSaveAll}
          />
        ) : undefined
      }
    >
      <Text style={[text.meta, { paddingHorizontal: 2 }]} numberOfLines={1}>
        {routineName.toUpperCase()}
      </Text>
      <RowPlates>
        {changes.map((change, i) => {
          const { tag, title, detail } = describeChange(change, names, unit);
          return (
            <Listed key={change.key} index={i}>
              <RowPlate>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 7,
                  }}
                >
                  <View style={{ flex: 1, gap: 5 }}>
                    <Text style={text.rowName} numberOfLines={2}>
                      {title}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Pill label={tag} tone={TAG_TONE[change.kind]} />
                      <Text style={[text.meta, { flexShrink: 1 }]}>{detail}</Text>
                    </View>
                  </View>
                  <SaveButton
                    label="SAVE"
                    accessibilityLabel={`Save change: ${detail}, ${title}`}
                    onPress={() => onSave(change)}
                  />
                </View>
              </RowPlate>
            </Listed>
          );
        })}
      </RowPlates>
    </Section>
  );
}
