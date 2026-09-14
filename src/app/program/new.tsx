import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import {
  ActionBar,
  Field,
  RowPlate,
  RowPlates,
  Screen,
  ScreenHeader,
  Section,
  useActionBarHeight,
} from '@/components';
import { createProgram } from '@/data/mutations/programs';
import { text } from '@/theme';

/**
 * Never drawn — the same case as routine create, which was also built out of
 * the vocabulary rather than boarded. A program is a name and then a week, so
 * this takes the name and hands straight over to the schedule.
 */
export default function NewProgramScreen() {
  const actionBar = useActionBarHeight();
  const [name, setName] = useState('');
  const [note, setNote] = useState('');

  const create = () => {
    if (!name.trim()) return;
    router.replace(`/program/${createProgram({ name, note })}`);
  };

  return (
    <>
      <Screen bottomInset={actionBar}>
        <ScreenHeader title="New program" kicker="PLAN" onBack={() => router.back()} />
        <Section first plated={false}>
          <RowPlates>
            <RowPlate>
              <Field
                label="NAME"
                value={name}
                onChangeText={setName}
                prompt="PPL 6-Day"
                autoFocus
              />
            </RowPlate>
            <RowPlate>
              <Field label="NOTE" value={note} onChangeText={setNote} prompt="Optional" />
            </RowPlate>
          </RowPlates>
          <Text style={text.prose}>
            A program puts your routines on weekdays. It starts paused; fill the week, then activate
            it.
          </Text>
        </Section>
      </Screen>
      <ActionBar
        primary="Create program"
        onPrimary={create}
        secondary="CANCEL"
        onSecondary={() => router.back()}
      />
    </>
  );
}
