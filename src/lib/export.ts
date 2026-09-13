/**
 * The backup envelope.
 *
 * SQLite on the phone is the only copy of every session ever logged — there is
 * no sync (Phase 8) and signing in does not back anything up. This is the one
 * thing standing between a lost phone and a lost training history, so it is
 * deliberately dumb: every table, verbatim, in a format that can be read
 * without this app.
 *
 * Nothing is filtered. The 302 seeded exercises go in too, even though a fresh
 * install reseeds them identically, because a self-contained file needs no
 * reasoning about which slugs a future seed will still have.
 */

/** Bump when the shape changes in a way a reader has to branch on. */
export const EXPORT_VERSION = 1;

/** What the file says it is, so a reader can refuse someone else's JSON. */
export const EXPORT_FORMAT = 'jymiq-export';

export type ExportTables = Record<string, readonly unknown[]>;

export interface ExportEnvelope {
  format: typeof EXPORT_FORMAT;
  version: number;
  exportedAt: number;
  appVersion: string;
  /** Row counts, so a reader can check the payload without walking it. */
  counts: Record<string, number>;
  tables: ExportTables;
}

export function buildExport(
  tables: ExportTables,
  { now, appVersion }: { now: number; appVersion: string },
): ExportEnvelope {
  const counts: Record<string, number> = {};
  for (const [name, rows] of Object.entries(tables)) counts[name] = rows.length;
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: now,
    appVersion,
    counts,
    tables,
  };
}

/** Total rows in the file — what the screen reports back after a write. */
export function totalRows(envelope: ExportEnvelope): number {
  return Object.values(envelope.counts).reduce((n, c) => n + c, 0);
}

const pad = (n: number) => (n < 10 ? `0${n}` : String(n));

/**
 * `jymiq-2026-09-13-1042.json`. Local time and minute precision: two exports on
 * the same day must not collide, and a date you recognise beats an epoch.
 */
export function exportFileName(now: number): string {
  const d = new Date(now);
  const stamp =
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `-${pad(d.getHours())}${pad(d.getMinutes())}`;
  return `jymiq-${stamp}.json`;
}
