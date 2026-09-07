import type { Session } from '@supabase/supabase-js';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import {
  ActionBar,
  Field,
  ListRow,
  RowPlate,
  RowPlates,
  Screen,
  ScreenHeader,
  Section,
  useActionBarHeight,
} from '@/components';
import { authCodeFromUrl, authRedirectTo, exchangeAuthCode, supabase } from '@/data/supabase';
import { text } from '@/theme';

/**
 * Account and sync. Reachable from the gear on Today; nothing else in the app
 * waits on it, because sync is the only feature that needs a network and the
 * app is fully usable before an account exists.
 *
 * Apple sign-in is an iOS requirement once other social providers ship, and
 * lands with the iOS build — Android has no device to verify it on.
 */
export default function SignInScreen() {
  const actionBar = useActionBarHeight();
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!supabase) {
    return (
      <Screen>
        <ScreenHeader title="Account" kicker="SYNC" onBack={() => router.back()} />
        <Section label="SYNC" plated={false}>
          <Text style={text.prose}>
            Sync is not configured on this build. Your workouts are on this phone and nowhere else.
          </Text>
        </Section>
      </Screen>
    );
  }
  const client = supabase;

  const signInWithGoogle = async () => {
    setStatus(null);
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: authRedirectTo, skipBrowserRedirect: true },
    });
    if (error) return setStatus(error.message);

    const result = await WebBrowser.openAuthSessionAsync(data.url, authRedirectTo);
    // A dismissed browser is a decision, not a failure — say nothing.
    if (result.type !== 'success') return;

    // iOS needs this branch: ASWebAuthenticationSession captures the redirect
    // itself and never emits the link the root layout listens for. On Android
    // both routes see it, and exchangeAuthCode lets only the first one through.
    const code = authCodeFromUrl(result.url);
    if (!code) return setStatus('Google did not return a sign-in code.');
    setStatus(await exchangeAuthCode(code));
  };

  const sendMagicLink = async () => {
    setStatus(null);
    const address = email.trim();
    if (!address) return setStatus('Enter an email address first.');
    const { error } = await client.auth.signInWithOtp({
      email: address,
      options: { emailRedirectTo: authRedirectTo },
    });
    setStatus(error ? error.message : `Link sent to ${address}. Open it on this phone.`);
  };

  const signOut = async () => {
    setStatus(null);
    const { error } = await client.auth.signOut();
    if (error) setStatus(error.message);
  };

  if (session) {
    return (
      <>
        <Screen bottomInset={actionBar}>
          <ScreenHeader title="Account" kicker="SYNC" onBack={() => router.back()} />
          <Section first plated={false}>
            <RowPlates>
              <RowPlate>
                <ListRow
                  chevron={false}
                  title={session.user.email ?? 'Signed in'}
                  meta={(session.user.app_metadata.provider ?? 'EMAIL').toUpperCase()}
                />
              </RowPlate>
            </RowPlates>
          </Section>
          <Section label="SYNC" plated={false}>
            <Text style={text.prose}>
              Signed in. Your workouts stay on this phone and back up when there is a connection.
            </Text>
          </Section>
          {status ? (
            <Section plated={false}>{<Text style={text.prose}>{status}</Text>}</Section>
          ) : null}
        </Screen>
        <ActionBar primary="Sign out" onPrimary={signOut} />
      </>
    );
  }

  return (
    <>
      <Screen bottomInset={actionBar}>
        <ScreenHeader title="Account" kicker="SYNC" onBack={() => router.back()} />

        <Section first plated={false}>
          <RowPlates>
            <RowPlate onPress={signInWithGoogle}>
              <ListRow title="Continue with Google" meta="OPENS A BROWSER, RETURNS HERE" />
            </RowPlate>
          </RowPlates>
        </Section>

        <Section label="OR BY EMAIL" plated={false}>
          <RowPlates>
            <RowPlate>
              <Field
                label="EMAIL"
                value={email}
                onChangeText={setEmail}
                prompt="you@example.com"
                keyboard="email"
              />
            </RowPlate>
          </RowPlates>
        </Section>

        <Section label="WHY" plated={false}>
          <Text style={text.prose}>
            {status ??
              'Signing in only adds backup and a second device. Everything works without it.'}
          </Text>
        </Section>
      </Screen>
      <ActionBar primary="Send magic link" onPrimary={sendMagicLink} />
    </>
  );
}
