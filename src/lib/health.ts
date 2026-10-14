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
  'ExerciseSession',
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

export const DAY_MS = 24 * 60 * 60 * 1000;
export const WORKOUT_WINDOW_MS = 90 * DAY_MS;

export interface ExportableSession {
  id: string;
  name: string;
  status: string;
  startedAt: number;
  endedAt: number | null;
  totalSets: number | null;
}

export interface WorkoutRecordInput {
  clientRecordId: string;
  title: string;
  startTime: string;
  endTime: string;
}

export function hasWorkoutPermissions(granted: HealthPermission[]): boolean {
  const has = (accessType: 'read' | 'write') =>
    granted.some((p) => p.accessType === accessType && p.recordType === 'ExerciseSession');
  return has('read') && has('write');
}

export function workoutRecord(s: ExportableSession): WorkoutRecordInput | null {
  if (s.status !== 'completed' || s.endedAt === null || s.endedAt <= s.startedAt) return null;
  if (!s.totalSets || s.totalSets <= 0) return null;
  return {
    clientRecordId: s.id,
    title: s.name,
    startTime: new Date(s.startedAt).toISOString(),
    endTime: new Date(s.endedAt).toISOString(),
  };
}

export const workoutWindowStart = (since: number, now: number): number =>
  Math.max(since, now - WORKOUT_WINDOW_MS);

export function planWorkoutSync(
  sessions: ExportableSession[],
  existingIds: string[],
  since: number,
  now: number,
): { write: WorkoutRecordInput[]; remove: string[] } {
  const start = workoutWindowStart(since, now);
  const known = new Set(sessions.map((s) => s.id));
  const have = new Set(existingIds);
  const write: WorkoutRecordInput[] = [];
  for (const s of sessions) {
    if (s.endedAt === null || s.endedAt < start || have.has(s.id)) continue;
    const record = workoutRecord(s);
    if (record) write.push(record);
  }
  return { write, remove: existingIds.filter((id) => !known.has(id)) };
}
