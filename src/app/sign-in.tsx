import type { Session } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import { router } from 'expo-router';
import Storage from 'expo-sqlite/kv-store';
import * as WebBrowser from 'expo-web-browser';
import { count } from 'drizzle-orm';
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
  useDialog,
} from '@/components';
import { readAllTables } from '@/data/queries/export';
import { restoreBackup } from '@/data/queries/import';
import { db } from '@/data/db';
import { syncQueue } from '@/data/schema';
import { pushNow, restoreFromCloud, useSyncState } from '@/data/sync';
import { useRows } from '@/data/live';
import { authCodeFromUrl, authRedirectTo, exchangeAuthCode, supabase } from '@/data/supabase';
import { describeSync } from '@/lib/sync';
import { buildExport, exportFileName, totalRows } from '@/lib/export';
import {
  type BackupFile,
  type ParsedBackup,
  backupFiles,
  describeBackup,
  parseBackup,
} from '@/lib/import';
import { text } from '@/theme';

/**
 * Account and sync. Reachable from the gear on Today; nothing else in the app
 * waits on it, because sync is the only feature that needs a network and the
 * app is fully usable before an account exists.
 *
 * Apple sign-in is an iOS requirement once other social providers ship, and
 * lands with the iOS build — Android has no device to verify it on.
 */
/**
 * The backup, and the only way data leaves this phone today.
 *
 * It renders on every branch of this screen — including the one where Supabase
 * is not configured at all, which is precisely the build with the most to lose.
 *
 * Storage Access Framework rather than a share sheet: the user picks a real
 * folder (Downloads, or a Drive mount) and the file stays there. It also needs
 * no new native module — `expo-file-system` is already linked — so this ships
 * on a Metro reload rather than a six-minute Gradle build.
 */
/** The folder the user last exported into. Remembered so the second one is a tap. */
const EXPORT_DIR_KEY = 'export.directoryUri';

/**
 * Ask for a folder.
 *
 * Opened at Documents on purpose: **Android 11+ refuses a SAF grant on the root
 * of shared storage and on Download**, so a picker that starts at the root
 * greets you with "Can't use this folder" and no obvious way forward. Documents
 * is grantable. A bad initial URI is ignored by the picker rather than failing,
 * so this is safe if the folder does not exist.
 */
async function pickExportDirectory(): Promise<string | null> {
  const saf = FileSystem.StorageAccessFramework;
  const permission = await saf.requestDirectoryPermissionsAsync(
    saf.getUriForDirectoryInRoot('Documents'),
  );
  return permission.granted ? permission.directoryUri : null;
}

/**
 * Run something against the backup folder, asking for one if there is none or
 * if the remembered grant no longer works. A revoked grant and a deleted folder
 * are both expected rather than exceptional — fall back to asking, don't report
 * it as an error. `null` means the user cancelled the picker.
 */
async function withDirectory<T>(fn: (dir: string) => Promise<T>): Promise<T | null> {
  const saved = await Storage.getItem(EXPORT_DIR_KEY);
  if (saved) {
    try {
      return await fn(saved);
    } catch {}
  }
  const dir = await pickExportDirectory();
  if (!dir) return null;
  await Storage.setItem(EXPORT_DIR_KEY, dir);
  return fn(dir);
}

/** The whole database into a new file in `dir`. Also the rollback before a restore. */
async function writeBackup(dir: string): Promise<{ name: string; rows: number }> {
  const envelope = buildExport(readAllTables(), {
    now: Date.now(),
    appVersion: Constants.expoConfig?.version ?? 'dev',
  });
  const name = exportFileName(envelope.exportedAt);
  const uri = await FileSystem.StorageAccessFramework.createFileAsync(
    dir,
    name,
    'application/json',
  );
  await FileSystem.writeAsStringAsync(uri, JSON.stringify(envelope));
  return { name, rows: totalRows(envelope) };
}

const nowMs = () => Date.now();

function SyncSection() {
  const show = useDialog();
  const sync = useSyncState();
  const pending = useRows(db.select({ n: count() }).from(syncQueue))?.[0]?.n ?? 0;
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const backUp = async () => {
    if (busy) return;
    setBusy(true);
    const r = await pushNow();
    setBusy(false);
    if (r.status === 'error')
      show({ title: 'Backup failed', message: r.message ?? 'Unknown error.' });
  };

  const applyCloudRestore = async () => {
    setBusy(true);
    try {
      const r = await restoreFromCloud(async () => withDirectory(writeBackup));
      setNote(
        'cancelled' in r
          ? `Restore cancelled — ${r.cancelled}.`
          : `Restored ${r.written.toLocaleString()} rows from the cloud. Your previous database is in ${r.rollbackName}.`,
      );
    } catch (e) {
      show({
        title: 'Restore failed',
        message: e instanceof Error ? e.message : 'Nothing was written.',
      });
      setNote('Restore failed. Your data is untouched.');
    } finally {
      setBusy(false);
    }
  };

  const confirmCloudRestore = () => {
    if (busy) return;
    setNote(null);
    show({
      title: 'Replace everything?',
      message:
        'Everything on this phone is deleted and replaced with your cloud copy. ' +
        'Your current database is written to a rollback file first.',
      actions: [
        { label: 'Replace', tone: 'destructive', onPress: () => void applyCloudRestore() },
        {
          label: 'Cancel',
          tone: 'cancel',
          onPress: () => setNote('Restore cancelled. Nothing was written.'),
        },
      ],
    });
  };

  return (
    <Section label="SYNC" plated={false}>
      <Text style={text.prose}>
        {note ??
          describeSync({ lastPushAt: sync.lastPushAt, pending, error: sync.lastError }, nowMs())}
      </Text>
      <RowPlates>
        <RowPlate onPress={backUp} disabled={busy}>
          <ListRow title={busy ? 'Working…' : 'Back up now'} meta="SENDS ONLY WHAT CHANGED" />
        </RowPlate>
        <RowPlate onPress={confirmCloudRestore} disabled={busy}>
          <ListRow title="Restore from cloud" meta="REPLACES EVERYTHING ON THIS PHONE" />
        </RowPlate>
      </RowPlates>
      <Text style={text.prose}>
        One phone at a time: a second phone that backs up here would overwrite this phone&apos;s
        copy.
      </Text>
    </Section>
  );
}

function DataSection() {
  const show = useDialog();
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [files, setFiles] = useState<BackupFile[] | null>(null);

  const runExport = async () => {
    if (busy) return;
    setBusy(true);
    setNote(null);
    setFiles(null);
    try {
      const written = await withDirectory(writeBackup);
      setNote(
        written
          ? `Wrote ${written.name} — ${written.rows.toLocaleString()} rows.`
          : 'Export cancelled. Nothing was written.',
      );
    } catch (e) {
      // A failed backup must say so loudly. Silence here reads as success, and
      // the whole point of the feature is that you can rely on it having run.
      show({
        title: 'Export failed',
        message: e instanceof Error ? e.message : 'Nothing was written.',
      });
      setNote('Export failed. Nothing was written.');
    } finally {
      setBusy(false);
    }
  };

  /** Step one: what is in the folder. Nothing is read or written yet. */
  const listBackups = async () => {
    if (busy) return;
    setBusy(true);
    setNote(null);
    try {
      const found = await withDirectory(async (dir) =>
        backupFiles(await FileSystem.StorageAccessFramework.readDirectoryAsync(dir)),
      );
      if (!found) return setNote('Restore cancelled. Nothing was written.');
      setFiles(found);
      if (found.length === 0) setNote('No Jymiq backups in that folder.');
    } catch (e) {
      show({
        title: 'Could not read that folder',
        message: e instanceof Error ? e.message : 'Unknown error.',
      });
    } finally {
      setBusy(false);
    }
  };

  /**
   * Step two: read the file and ask. Restore is the one operation in this app
   * that can cost training history, so the confirm names what the file holds —
   * `describeBackup` — rather than asking "are you sure" about a filename.
   */
  const confirmRestore = async (file: BackupFile) => {
    if (busy) return;
    setBusy(true);
    setNote(null);
    try {
      const parsed = parseBackup(await FileSystem.readAsStringAsync(file.uri));
      if (!parsed.ok) {
        setNote(parsed.reason);
        return;
      }
      const { backup } = parsed;
      show({
        title: 'Replace everything?',
        message:
          `${describeBackup(backup)}\n\nEverything on this phone is deleted and replaced with this file. ` +
          'Your current database is written to the same folder as a rollback file first.',
        actions: [
          { label: 'Replace', tone: 'destructive', onPress: () => void applyRestore(backup) },
          {
            label: 'Cancel',
            tone: 'cancel',
            onPress: () => setNote('Restore cancelled. Nothing was written.'),
          },
        ],
      });
    } catch (e) {
      show({
        title: 'Could not read that file',
        message: e instanceof Error ? e.message : 'Unknown error.',
      });
    } finally {
      setBusy(false);
    }
  };

  /** Step three. The rollback file is written before the delete, never after. */
  const applyRestore = async (backup: ParsedBackup) => {
    setBusy(true);
    try {
      const rollback = await withDirectory(writeBackup);
      if (!rollback)
        return setNote('Restore cancelled — no rollback file, so nothing was written.');
      const written = restoreBackup(backup.tables);
      setFiles(null);
      setNote(
        `Restored ${written.toLocaleString()} rows. Your previous database is in ${rollback.name}.`,
      );
    } catch (e) {
      // The write is one transaction, so a failure here left the database alone.
      show({
        title: 'Restore failed',
        message: e instanceof Error ? e.message : 'Nothing was written.',
      });
      setNote('Restore failed. Nothing was written — your data is untouched.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section label="YOUR DATA" plated={false}>
      <RowPlates>
        <RowPlate onPress={runExport}>
          <ListRow
            title={busy ? 'Working…' : 'Export everything'}
            meta="EVERY SESSION, SET AND ROUTINE, AS JSON"
          />
        </RowPlate>
        <RowPlate onPress={files ? () => setFiles(null) : listBackups}>
          <ListRow
            title={files ? 'Cancel restore' : 'Restore from a backup'}
            meta={files ? 'PICK A FILE BELOW' : 'REPLACES EVERYTHING ON THIS PHONE'}
          />
        </RowPlate>
      </RowPlates>
      {/* Above the file list, not under it. This line is the only feedback the
          screen gives, and a list of backups is tall enough to push it off the
          bottom of the screen — which is exactly what a cancelled restore did. */}
      <Text style={text.prose}>
        {note ??
          'Pick a folder and the whole database is written there as one file. This phone is the only copy until you do.'}
      </Text>
      {files && files.length > 0 ? (
        <RowPlates>
          {files.map((file) => (
            <RowPlate key={file.uri} onPress={() => confirmRestore(file)}>
              <ListRow title={file.name} meta="TAP TO SEE WHAT IS IN IT" />
            </RowPlate>
          ))}
        </RowPlates>
      ) : null}
    </Section>
  );
}

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
        <DataSection />
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
          <SyncSection />
          <DataSection />
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
              'Signing in backs your workouts up to your account, sending only what changed. This phone stays the source of truth and everything works without an account.'}
          </Text>
        </Section>

        <DataSection />
      </Screen>
      <ActionBar primary="Send magic link" onPrimary={sendMagicLink} />
    </>
  );
}
