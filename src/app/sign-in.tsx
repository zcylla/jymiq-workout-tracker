import type { Session } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import { router } from 'expo-router';
import Storage from 'expo-sqlite/kv-store';
import * as WebBrowser from 'expo-web-browser';
import { count } from 'drizzle-orm';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

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
import { buildExport, exportFileName, totalRows } from '@/lib/export';
import {
  type BackupFile,
  type ParsedBackup,
  backupFiles,
  describeBackup,
  parseBackup,
} from '@/lib/import';
import { color, radius, sans, size, text } from '@/theme';

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

function ago(at: number, now: number): string {
  const min = Math.floor((now - at) / 60_000);
  if (min < 1) return 'NOW';
  if (min < 60) return `${min} MIN`;
  const h = Math.floor(min / 60);
  return h < 24 ? `${h} H` : `${Math.floor(h / 24)} D`;
}

function Note({ children }: { children: string }) {
  return (
    <Text style={text.prose} numberOfLines={1} ellipsizeMode="middle">
      {children}
    </Text>
  );
}

function BackupStatus({ tone, value }: { tone: 'done' | 'accent' | 'live' | null; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {tone ? (
        <View
          style={{ width: 8, height: 8, borderRadius: radius.full, backgroundColor: color[tone] }}
        />
      ) : null}
      {value ? <Text style={text.numSm}>{value}</Text> : null}
    </View>
  );
}

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
          ? 'Restore cancelled'
          : `${r.written.toLocaleString()} rows · rollback ${r.rollbackName}`,
      );
    } catch (e) {
      show({
        title: 'Restore failed',
        message: e instanceof Error ? e.message : 'Nothing was written.',
      });
      setNote('Restore failed');
    } finally {
      setBusy(false);
    }
  };

  const confirmCloudRestore = () => {
    if (busy) return;
    setNote(null);
    show({
      title: 'Replace all data?',
      message: 'Phone data replaced by cloud copy. Rollback file saved first.',
      actions: [
        { label: 'Replace', tone: 'destructive', onPress: () => void applyCloudRestore() },
        { label: 'Cancel', tone: 'cancel' },
      ],
    });
  };

  const tone = sync.lastError
    ? 'live'
    : pending > 0
      ? 'accent'
      : sync.lastPushAt !== null
        ? 'done'
        : null;
  const value = [
    sync.lastPushAt !== null ? ago(sync.lastPushAt, nowMs()) : null,
    pending > 0 ? String(pending) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Section label="SYNC" plated={false}>
      <RowPlates tinted>
        <RowPlate onPress={backUp} disabled={busy}>
          <ListRow
            quiet
            title={busy ? 'Working…' : 'Back up now'}
            right={<BackupStatus tone={tone} value={value} />}
            chevron={false}
          />
        </RowPlate>
        <RowPlate onPress={confirmCloudRestore} disabled={busy}>
          <ListRow quiet danger title="Restore from cloud" />
        </RowPlate>
      </RowPlates>
      {note ? <Note>{note}</Note> : null}
    </Section>
  );
}

function DataSection({ first = false }: { first?: boolean }) {
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
      setNote(written ? `${written.rows.toLocaleString()} rows saved` : null);
    } catch (e) {
      // A failed backup must say so loudly. Silence here reads as success, and
      // the whole point of the feature is that you can rely on it having run.
      show({
        title: 'Export failed',
        message: e instanceof Error ? e.message : 'Nothing was written.',
      });
      setNote('Export failed');
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
      if (!found) return;
      setFiles(found);
      if (found.length === 0) setNote('No backups here');
    } catch (e) {
      show({
        title: 'Unreadable folder',
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
        console.warn(parsed.reason);
        setNote('Not a valid backup');
        return;
      }
      const { backup } = parsed;
      show({
        title: 'Replace all data?',
        message: `${describeBackup(backup)}\n\nRollback file saved first.`,
        actions: [
          { label: 'Replace', tone: 'destructive', onPress: () => void applyRestore(backup) },
          { label: 'Cancel', tone: 'cancel' },
        ],
      });
    } catch (e) {
      show({
        title: 'Unreadable file',
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
      if (!rollback) return setNote('No rollback file — cancelled');
      const written = restoreBackup(backup.tables);
      setFiles(null);
      setNote(`${written.toLocaleString()} rows · rollback ${rollback.name}`);
    } catch (e) {
      // The write is one transaction, so a failure here left the database alone.
      show({
        title: 'Restore failed',
        message: e instanceof Error ? e.message : 'Nothing was written.',
      });
      setNote('Restore failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section first={first} label="YOUR DATA" plated={false}>
      <RowPlates tinted>
        <RowPlate onPress={runExport}>
          <ListRow quiet title={busy ? 'Working…' : 'Export everything'} />
        </RowPlate>
        <RowPlate onPress={files ? () => setFiles(null) : listBackups}>
          <ListRow
            quiet
            danger={!files}
            title={files ? 'Cancel restore' : 'Restore from a backup'}
          />
        </RowPlate>
      </RowPlates>
      {/* Above the file list, not under it: a tall list pushes the status off screen. */}
      {note ? <Note>{note}</Note> : null}
      {files && files.length > 0 ? (
        <RowPlates tinted>
          {files.map((file) => (
            <RowPlate key={file.uri} onPress={() => confirmRestore(file)}>
              <ListRow quiet title={file.name} />
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
        <ScreenHeader title="Account" onBack={() => router.back()} />
        <DataSection first />
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
    if (!code) return setStatus('Sign-in failed');
    setStatus(await exchangeAuthCode(code));
  };

  const sendMagicLink = async () => {
    setStatus(null);
    const address = email.trim();
    if (!address) return setStatus('Enter an email');
    const { error } = await client.auth.signInWithOtp({
      email: address,
      options: { emailRedirectTo: authRedirectTo },
    });
    setStatus(error ? error.message : 'Link sent');
  };

  const signOut = async () => {
    setStatus(null);
    const { error } = await client.auth.signOut();
    if (error) setStatus(error.message);
  };

  if (session) {
    return (
      <Screen>
        <ScreenHeader title="Account" onBack={() => router.back()} />
        <Section first plated={false}>
          <RowPlates tinted>
            <RowPlate>
              <ListRow chevron={false} quiet title={session.user.email ?? 'Signed in'} />
            </RowPlate>
            <RowPlate tone="destructive" onPress={signOut}>
              <View style={{ minHeight: size.hit, justifyContent: 'center' }}>
                <Text style={[text.rowName, sans(700), { color: color.hi }]}>Sign out</Text>
              </View>
            </RowPlate>
          </RowPlates>
        </Section>
        <SyncSection />
        <DataSection />
        {status ? (
          <Section plated={false}>
            <Note>{status}</Note>
          </Section>
        ) : null}
      </Screen>
    );
  }

  return (
    <>
      <Screen bottomInset={actionBar}>
        <ScreenHeader title="Account" onBack={() => router.back()} />

        <Section first plated={false}>
          <RowPlates tinted>
            <RowPlate onPress={signInWithGoogle}>
              <ListRow quiet title="Continue with Google" />
            </RowPlate>
          </RowPlates>
        </Section>

        <Section label="OR" plated={false}>
          <RowPlates tinted>
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
          {status ? <Note>{status}</Note> : null}
        </Section>

        <DataSection />
      </Screen>
      <ActionBar primary="Send link" onPrimary={sendMagicLink} />
    </>
  );
}
