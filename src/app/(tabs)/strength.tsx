import { Text } from 'react-native';

import { Screen, ScreenHeader, Section } from '@/components';
import { text } from '@/theme';

/** Placeholder until Phase 5. The shell's job is that this tab exists and switches. */
export default function StrengthScreen() {
  return (
    <Screen>
      <ScreenHeader title="Strength" kicker="PROGRESS" />
      <Section label="PROGRESS" plated={false}>
        <Text style={text.prose}>Phase 5 fills this in.</Text>
      </Section>
    </Screen>
  );
}
