import { useEffect, useRef, useState } from 'react';
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
  disabled,
}: {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      accessibilityState={{ disabled }}
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
  const [submitted, setSubmitted] = useState<ReadonlySet<string>>(() => new Set());
  const submittedRef = useRef(new Set<string>());

  useEffect(() => {
    const keys = new Set(changes.map((change) => change.key));
    const remaining = new Set(
      [...submittedRef.current].filter((key) => key !== 'all' && keys.has(key)),
    );
    if (submittedRef.current.has('all') && remaining.size > 0) remaining.add('all');
    if (remaining.size === submittedRef.current.size) return;
    submittedRef.current = remaining;
    setSubmitted(remaining);
  }, [changes]);

  function save(change: RoutineChange) {
    if (submittedRef.current.has(change.key) || submittedRef.current.has('all')) return;
    const next = new Set(submittedRef.current).add(change.key);
    submittedRef.current = next;
    setSubmitted(next);
    onSave(change);
  }

  function saveAll() {
    if (submittedRef.current.size > 0) return;
    const next = new Set(['all', ...changes.map((change) => change.key)]);
    submittedRef.current = next;
    setSubmitted(next);
    onSaveAll();
  }

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
            disabled={submitted.size > 0}
            onPress={saveAll}
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
                    disabled={submitted.has(change.key) || submitted.has('all')}
                    onPress={() => save(change)}
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
