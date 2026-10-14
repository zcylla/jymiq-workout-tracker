export interface HealthPermission {
  accessType: 'read' | 'write';
  recordType: string;
}

export const READ_RECORD_TYPES = [
  'Weight',
  'HeartRate',
  'SleepSession',
  'RestingHeartRate',
  'HeartRateVariabilityRmssd',
  'Steps',
] as const;

export const WANTED_PERMISSIONS: HealthPermission[] = [
  ...READ_RECORD_TYPES.map((recordType) => ({ accessType: 'read' as const, recordType })),
  { accessType: 'write', recordType: 'ExerciseSession' },
];

export type HealthStatus =
  | 'unsupported'
  | 'needs_update'
  | 'not_connected'
  | 'partial'
  | 'connected';

const SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED = 2;
const SDK_AVAILABLE = 3;

export function healthStatus(sdkCode: number, granted: HealthPermission[]): HealthStatus {
  if (sdkCode === SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) return 'needs_update';
  if (sdkCode !== SDK_AVAILABLE) return 'unsupported';
  const have = new Set(granted.map((p) => `${p.accessType}:${p.recordType}`));
  const got = WANTED_PERMISSIONS.filter((p) => have.has(`${p.accessType}:${p.recordType}`)).length;
  if (got === 0) return 'not_connected';
  return got === WANTED_PERMISSIONS.length ? 'connected' : 'partial';
}

const LABELS: Record<HealthStatus, string> = {
  unsupported: 'Not available',
  needs_update: 'Update needed',
  not_connected: 'Not connected',
  partial: 'Partly allowed',
  connected: 'Connected',
};

export const healthStatusLabel = (status: HealthStatus): string => LABELS[status];

export function countByOrigin(
  records: { metadata?: { dataOrigin?: string } }[],
): { origin: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const r of records) {
    const origin = r.metadata?.dataOrigin || 'unknown';
    counts.set(origin, (counts.get(origin) ?? 0) + 1);
  }
  return [...counts]
    .map(([origin, count]) => ({ origin, count }))
    .sort((a, b) => b.count - a.count || a.origin.localeCompare(b.origin));
}
