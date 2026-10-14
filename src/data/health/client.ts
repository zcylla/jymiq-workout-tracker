import { Linking, Platform } from 'react-native';
import {
  getGrantedPermissions,
  getSdkStatus,
  initialize,
  openHealthConnectSettings,
  readRecords,
  requestPermission,
} from 'react-native-health-connect';

import {
  countByOrigin,
  type HealthStatus,
  healthStatus,
  READ_RECORD_TYPES,
  WANTED_PERMISSIONS,
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
