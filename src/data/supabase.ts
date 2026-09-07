import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import Storage from 'expo-sqlite/kv-store';
import { AppState } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

/**
 * The sync client. Null when the project is not configured, which is a state
 * the app has to survive: SQLite is the source of truth and every screen works
 * with no account and no signal. Supabase is backup and multi-device, not the
 * database.
 *
 * `expo-sqlite/kv-store` is the session store — already a dependency, and
 * AsyncStorage-shaped, so it needs no adapter.
 *
 * PKCE rather than the implicit flow: an implicit redirect carries the access
 * and refresh tokens in the URL itself, and any app registered for `jymiq://`
 * would receive them. With PKCE the redirect carries a code that is worthless
 * without the verifier sitting in this app's storage.
 *
 * That is a bound on token theft, not on interception. `jymiq://` is a plain
 * custom scheme with nothing to stop a second app registering it, so a hostile
 * app can still swallow the redirect and leave the sign-in hanging at exactly
 * the moment the user expects a sign-in screen. Closing that needs a verified
 * `https://` App Link and a domain to host `assetlinks.json` on, which this app
 * does not have.
 *
 * `detectSessionInUrl` is a browser behaviour and must be off — there is no
 * address bar to read; `src/app/sign-in.tsx` exchanges the code by hand.
 */
export const supabase =
  url && key
    ? createClient(url, key, {
        auth: {
          storage: Storage,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          flowType: 'pkce',
        },
      })
    : null;

// supabase-js refreshes on a timer, which Android suspends in the background.
// Driving it off foreground state is what stops a session expiring silently
// while the phone is in a pocket between sets.
if (supabase) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

/**
 * Where both providers come back to. Google returns here after the browser hop
 * and a magic link returns here after Supabase verifies the emailed token, so
 * there is one redirect and one exchange.
 *
 * Built from the scheme rather than with `Linking.createURL`, which splices
 * Metro's host into the path in a dev client and yields
 * `jymiq://localhost:8081/sign-in`. Verified on the device: expo-router does not
 * match that, and a magic link lands on Unmatched Route. Empty authority gives
 * `jymiq:///sign-in`, which routes in both build types and is one stable entry
 * for the project's Additional Redirect URLs.
 */
function appScheme(): string {
  const scheme = Constants.expoConfig?.scheme;
  return (Array.isArray(scheme) ? scheme[0] : scheme) ?? 'jymiq';
}

export const authRedirectTo = `${appScheme()}:///sign-in`;

export function authCodeFromUrl(url: string | null): string | null {
  if (!url) return null;
  const code = Linking.parse(url).queryParams?.code;
  return typeof code === 'string' ? code : null;
}

/**
 * A redirect arrives more than once, and only the first exchange can work.
 *
 * On Android `WebBrowser.openAuthSessionAsync` resolves off the same Linking
 * `url` event `useLinkingURL` observes, so the Google path sees one code by two
 * routes; and `useLinkingURL` is seeded from a value the native side keeps for
 * the life of the process, so it hands the same URL back on every remount.
 * supabase-js deletes the PKCE verifier on its success *and* its failure path,
 * so every later attempt fails with "code verifier could not be found" — an
 * error printed over a sign-in that actually succeeded.
 *
 * Remembering spent codes is what keeps that off the screen. The set is added to
 * before the await, and JS is single-threaded, so the second caller always loses.
 */
const spentCodes = new Set<string>();

export async function exchangeAuthCode(code: string): Promise<string | null> {
  if (!supabase || spentCodes.has(code)) return null;
  spentCodes.add(code);
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return error?.message ?? null;
}
