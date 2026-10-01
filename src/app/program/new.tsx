import { router } from 'expo-router';
import { useState } from 'react';

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
        <ScreenHeader title="New program" onBack={() => router.back()} />
        <Section first plated={false}>
          <RowPlates tinted>
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
              <Field label="NOTE" value={note} onChangeText={setNote} />
            </RowPlate>
          </RowPlates>
        </Section>
      </Screen>
      <ActionBar
        primary="Create"
        onPrimary={create}
        secondary="CANCEL"
        onSecondary={() => router.back()}
      />
    </>
  );
}
