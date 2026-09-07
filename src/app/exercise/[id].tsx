import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { ActionBar, Screen, ScreenHeader, Section } from '@/components';
import { exerciseMusclesQuery, exerciseQuery } from '@/data/queries/exercises';
import { space, text } from '@/theme';

/**
 * Lab 35 B2 (= Lab 39 Q1). A pushed detail screen: sibling of `(tabs)`, so it
 * loses the tab bar and the primary action takes that plane.
 *
 * The board's numbers, chart and rep maxes are all session-derived and land in
 * Phase 7 once there is history to draw.
 */
export default function ExerciseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: found } = useLiveQuery(
    useMemo(() => exerciseQuery(id), [id]),
    [id],
  );
  const { data: muscles } = useLiveQuery(
    useMemo(() => exerciseMusclesQuery(id), [id]),
    [id],
  );
  const exercise = found?.[0];

  const cues: string[] = Array.isArray(exercise?.cues) ? exercise.cues : [];
  const prime = muscles?.filter((m) => m.role === 'prime').map((m) => m.muscle) ?? [];
  const assist = muscles?.filter((m) => m.role === 'assist').map((m) => m.muscle) ?? [];

  return (
    <>
      <Screen>
        <ScreenHeader
          title={exercise?.name ?? ''}
          kicker={
            exercise ? `${exercise.equipment.toUpperCase()} · ${exercise.kind.toUpperCase()}` : ''
          }
          onBack={() => router.back()}
        />

        {exercise?.description ? (
          <Section plated={false}>
            <Text style={text.body}>{exercise.description}</Text>
          </Section>
        ) : null}

        {prime.length ? (
          <Section label="MUSCLES">
            <Text style={text.body}>{prime.join(' · ').toUpperCase()}</Text>
            {assist.length ? <Text style={text.prose}>{assist.join(' · ')}</Text> : null}
          </Section>
        ) : null}

        {cues.length ? (
          <Section label="HOW TO" plated={false}>
            <View style={{ gap: space.within }}>
              {cues.map((cue, i) => (
                <View key={cue} style={{ flexDirection: 'row', gap: 11 }}>
                  <Text style={[text.meta, { width: 18 }]}>{String(i + 1).padStart(2, '0')}</Text>
                  <Text style={[text.body, { flex: 1 }]}>{cue}</Text>
                </View>
              ))}
            </View>
          </Section>
        ) : null}

        <Section label="YOUR NUMBERS" plated={false}>
          <Text style={text.prose}>
            Nothing logged yet. Your best set and estimated 1RM appear here after the first session.
          </Text>
        </Section>
      </Screen>
      <ActionBar primary="Add to routine" secondary="LOG" />
    </>
  );
}
