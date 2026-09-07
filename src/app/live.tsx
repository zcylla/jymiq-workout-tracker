import { router } from 'expo-router';
import { Text } from 'react-native';

import { Screen, ScreenHeader, Section } from '@/components';
import { text } from '@/theme';

/**
 * The live session. A root route, not a tab and not a push: it takes the whole
 * plane, keeps the tab bar off, and has the back gesture disabled (Phase 6 is
 * where the gesture conflict gets tested, before the screen is built).
 */
export default function LiveScreen() {
  return (
    <Screen>
      <ScreenHeader title="Session" kicker="LIVE" onBack={() => router.back()} />
      <Section label="LIVE" plated={false}>
        <Text style={text.prose}>Phase 6. No tab bar here, by design.</Text>
      </Section>
    </Screen>
  );
}
