import Constants from 'expo-constants';
import { Linking, Platform } from 'react-native';
import {
  deleteRecordsByUuids,
  ExerciseType,
  getGrantedPermissions,
  getSdkStatus,
  initialize,
  insertRecords,
  openHealthConnectSettings,
  readRecords,
  RecordingMethod,
  requestPermission,
} from 'react-native-health-connect';

import {
  countByOrigin,
  DAY_MS,
  hasWorkoutPermissions,
  type HealthStatus,
  healthStatus,
  READ_RECORD_TYPES,
  WANTED_PERMISSIONS,
  type WorkoutRecordInput,
} from '@/lib/health';

export interface ProbeRow {
  recordType: string;
  count: number;
  origins: { origin: string; count: number }[];
  error: string | null;
}

const PROVIDER_STORE_URL = 'market://details?id=com.google.android.apps.healthdata';

export async function readHealthStatus(): Promise<HealthStatus> {
  if (Platform.OS !== 'android') return 'unsupported';
  try {
    const sdk = await getSdkStatus();
    const early = healthStatus(sdk, []);
    if (early !== 'not_connected') return early;
    await initialize();
    return healthStatus(sdk, await getGrantedPermissions());
  } catch {
    return 'unsupported';
  }
}

export async function connectHealth(): Promise<HealthStatus> {
  if (Platform.OS !== 'android') return 'unsupported';
  await initialize()
    .then(() => requestPermission(WANTED_PERMISSIONS as Parameters<typeof requestPermission>[0]))
    .catch(() => {});
  return readHealthStatus();
}

export function openHealthSettings(): void {
  if (Platform.OS === 'android') openHealthConnectSettings();
}

export function openHealthStore(): void {
  Linking.openURL(PROVIDER_STORE_URL).catch(() => {});
}

export async function probeHealth(days: number): Promise<ProbeRow[]> {
  if (Platform.OS !== 'android') return [];
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - days * 24 * 60 * 60 * 1000);
  const rows: ProbeRow[] = [];
  for (const recordType of READ_RECORD_TYPES) {
    try {
      const { records } = await readRecords(recordType as Parameters<typeof readRecords>[0], {
        timeRangeFilter: {
          operator: 'between',
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      });
      rows.push({
        recordType,
        count: records.length,
        origins: countByOrigin(records),
        error: null,
      });
    } catch (e) {
      rows.push({
        recordType,
        count: 0,
        origins: [],
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
  return rows;
}

const OWN_ORIGIN = Constants.expoConfig?.android?.package;

export async function canSyncWorkouts(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    if ((await readHealthStatus()) === 'unsupported') return false;
    return hasWorkoutPermissions(await getGrantedPermissions());
  } catch {
    return false;
  }
}

export async function listOwnWorkoutIds(fromMs: number): Promise<string[]> {
  if (Platform.OS !== 'android') return [];
  if (!OWN_ORIGIN) throw new Error('own package name unavailable');
  const { records } = await readRecords('ExerciseSession', {
    timeRangeFilter: {
      operator: 'between',
      startTime: new Date(fromMs).toISOString(),
      endTime: new Date(Date.now() + DAY_MS).toISOString(),
    },
    dataOriginFilter: [OWN_ORIGIN],
  });
  return records.flatMap((r) => (r.metadata?.clientRecordId ? [r.metadata.clientRecordId] : []));
}

export async function writeWorkouts(records: WorkoutRecordInput[]): Promise<void> {
  if (Platform.OS !== 'android') return;
  await insertRecords(
    records.map((r) => ({
      recordType: 'ExerciseSession' as const,
      exerciseType: ExerciseType.STRENGTH_TRAINING,
      title: r.title,
      startTime: r.startTime,
      endTime: r.endTime,
      metadata: {
        clientRecordId: r.clientRecordId,
        clientRecordVersion: 0,
        recordingMethod: RecordingMethod.RECORDING_METHOD_MANUAL_ENTRY,
      },
    })),
  );
}

export async function removeWorkouts(clientRecordIds: string[]): Promise<void> {
  if (Platform.OS !== 'android') return;
  await deleteRecordsByUuids('ExerciseSession', [], clientRecordIds);
}
