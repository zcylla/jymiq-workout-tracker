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
import { createRoutine } from '@/data/mutations/routines';

export default function NewRoutineScreen() {
  const actionBar = useActionBarHeight();
  const [name, setName] = useState('');
  const [note, setNote] = useState('');

  const create = () => {
    if (!name.trim()) return;
    const id = createRoutine({ name, note });
    router.replace(`/routine/${id}/edit`);
  };

  return (
    <>
      <Screen bottomInset={actionBar}>
        <ScreenHeader title="New routine" kicker="PLAN" onBack={() => router.back()} />
        <Section first plated={false}>
          <RowPlates>
            <RowPlate>
              <Field label="NAME" value={name} onChangeText={setName} prompt="Upper A" autoFocus />
            </RowPlate>
            <RowPlate>
              <Field label="NOTE" value={note} onChangeText={setNote} prompt="Optional" />
            </RowPlate>
          </RowPlates>
        </Section>
      </Screen>
      <ActionBar
        primary="Create routine"
        onPrimary={create}
        secondary="CANCEL"
        onSecondary={() => router.back()}
      />
    </>
  );
}
