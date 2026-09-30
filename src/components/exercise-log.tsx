import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useRows } from '@/data/live';
import { exerciseLogQuery, exerciseRecordSessionsQuery } from '@/data/queries/exercises';
import { useSettings } from '@/data/settings';
import { formatLogSet, groupExerciseLog } from '@/lib/exercise-log';
import { sessionDateLabel, sessionDotTone } from '@/lib/time';
import { color, size, text } from '@/theme';

import { Pill } from './pill';
import { Rail } from './rail';
import { Section } from './section';

const SHOWN = 8;

/**
 * Every set of one lift, grouped under the session it was done in. A rail,
 * because it is exercise history: events in order and nothing else. It renders
 * nothing until there is a set to show.
 */
export function ExerciseLog({ exerciseId }: { exerciseId: string }) {
  const unit = useSettings().weightUnit;
  const rows = useRows(
    useMemo(() => exerciseLogQuery(exerciseId), [exerciseId]),
    [exerciseId],
  );
  const records = useRows(
    useMemo(() => exerciseRecordSessionsQuery(exerciseId), [exerciseId]),
    [exerciseId],
  );
  const [all, setAll] = useState(false);

  const entries = useMemo(() => groupExerciseLog(rows ?? []), [rows]);
  if (entries.length === 0) return null;

  const withRecord = new Set((records ?? []).map((r) => r.sessionId));
  const shown = all ? entries : entries.slice(0, SHOWN);

  return (
    <Section label={`LOG · ${unit.toUpperCase()}`} plated={false}>
      <Rail
        air={18}
        items={shown.map((e) => ({
          tone: sessionDotTone(e.startedAt),
          body: (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                <Text style={text.num}>{sessionDateLabel(e.startedAt)}</Text>
                {withRecord.has(e.sessionId) ? <Pill label="PR" /> : null}
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 4 }}>
                {e.sets.map((s) => (
                  <Text
                    key={s.id}
                    style={[text.numSm, { color: s.kind === 'warmup' ? color.dim : color.hi }]}
                  >
                    {formatLogSet(s, unit)}
                  </Text>
                ))}
              </View>
            </>
          ),
        }))}
      />
      {shown.length < entries.length ? (
        <Pressable
          onPress={() => setAll(true)}
          accessibilityRole="button"
          style={({ pressed }) => [
            { height: size.hit, justifyContent: 'center' },
            pressed && { opacity: 0.6 },
          ]}
        >
          <Text style={[text.label, { color: color.accent }]}>MORE</Text>
        </Pressable>
      ) : null}
    </Section>
  );
}
