import { EXPORT_FORMAT, EXPORT_VERSION, type ExportTables } from './export.ts';

/**
 * Reading a backup back in. This is the pure half: it decides whether a file
 * is trustworthy and describes it — it never touches SQLite.
 *
 * An older `version` is accepted (a reader knows how to grow into new fields);
 * a newer one is refused, because a file from a future app version may carry
 * a shape this reader has never seen.
 */

export const KNOWN_TABLES = [
  'exercises',
  'exercise_muscles',
  'routines',
  'routine_exercises',
  'programs',
  'program_days',
  'sessions',
  'session_exercises',
  'sets',
  'personal_records',
  'body_weights',
] as const;

export interface ParsedBackup {
  version: number;
  exportedAt: number;
  appVersion: string;
  counts: Record<string, number>;
  tables: ExportTables;
  /** Tables present in the file that this schema does not know about. */
  unknownTables: string[];
}

export type ParseResult = { ok: true; backup: ParsedBackup } | { ok: false; reason: string };

const fail = (reason: string): ParseResult => ({ ok: false, reason });

export function parseBackup(raw: string): ParseResult {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return fail('This file is not valid JSON.');
  }

  if (typeof json !== 'object' || json === null || Array.isArray(json) || !('format' in json)) {
    return fail('This file does not look like a Jymiq backup.');
  }
  const envelope = json as Record<string, unknown>;

  if (envelope.format !== EXPORT_FORMAT) {
    return fail('This file is not a Jymiq backup.');
  }

  if (typeof envelope.version !== 'number') {
    return fail('This backup does not say what version it is.');
  }
  if (envelope.version > EXPORT_VERSION) {
    return fail(
      `This backup was made by a newer version of Jymiq (version ${envelope.version}) and cannot be read.`,
    );
  }

  if (
    typeof envelope.tables !== 'object' ||
    envelope.tables === null ||
    Array.isArray(envelope.tables)
  ) {
    return fail('This backup has no tables in it.');
  }
  const tables = envelope.tables as ExportTables;

  const counts = (envelope.counts ?? {}) as Record<string, number>;
  for (const [name, rows] of Object.entries(tables)) {
    if (!Array.isArray(rows)) {
      return fail(`Table "${name}" is not a list of rows.`);
    }
    if (counts[name] !== rows.length) {
      return fail(
        `Table "${name}" says ${counts[name] ?? 'nothing'} rows but has ${rows.length} — the file is truncated or damaged.`,
      );
    }
  }

  const unknownTables = Object.keys(tables).filter(
    (name) => !(KNOWN_TABLES as readonly string[]).includes(name),
  );

  return {
    ok: true,
    backup: {
      version: envelope.version,
      exportedAt: typeof envelope.exportedAt === 'number' ? envelope.exportedAt : 0,
      appVersion: typeof envelope.appVersion === 'string' ? envelope.appVersion : '',
      counts,
      tables,
      unknownTables,
    },
  };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * What a person recognises as their training, in the order they would say it.
 *
 * Deliberately not every table: `exercise_muscles` and `session_exercises` are
 * join rows, and reciting them ("841 exercise_muscles") makes the summary read
 * like a schema dump rather than an answer to "is this the right file".
 */
const SUMMARISED: readonly [table: string, one: string, many: string][] = [
  ['sessions', 'session', 'sessions'],
  ['sets', 'set', 'sets'],
  ['routines', 'routine', 'routines'],
  ['personal_records', 'record', 'records'],
];

/** `"3 sessions · 42 sets · 1 routine · 18 records — exported 13 Sep 2026"`. */
export function describeBackup(b: ParsedBackup): string {
  const parts = SUMMARISED.filter(([table]) => (b.counts[table] ?? 0) > 0).map(
    ([table, one, many]) => {
      const n = b.counts[table] as number;
      return `${n.toLocaleString()} ${n === 1 ? one : many}`;
    },
  );
  const tally = parts.length > 0 ? parts.join(' · ') : 'no training yet';
  const d = new Date(b.exportedAt);
  return `${tally} — exported ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * The table order restore writes in. It is `KNOWN_TABLES` because that list is
 * already in dependency order — parents before children — and foreign keys are
 * ON, so inserting out of order fails and deleting out of order fails the other
 * way round. Deletion walks it backwards.
 */
export const RESTORE_ORDER = KNOWN_TABLES;

export interface BackupFile {
  uri: string;
  name: string;
}

/**
 * Which of a folder's files are Jymiq backups, newest first.
 *
 * Storage Access Framework hands back percent-encoded document URIs
 * (`content://…/document/primary%3ADocuments%2Fjymiq-2026-09-13-1042.json`), so
 * the name has to be decoded out of the tail. The filename stamp is
 * year-month-day-hourminute, which sorts lexicographically in chronological
 * order — no date parsing needed to put the newest at the top.
 */
export function backupFiles(uris: readonly string[]): BackupFile[] {
  return uris
    .map((uri) => ({ uri, name: decodeURIComponent(uri).split('/').pop() ?? '' }))
    .filter(({ name }) => /^jymiq-.*\.json$/.test(name))
    .sort((a, b) => b.name.localeCompare(a.name));
}
