import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { convertDailyStrength } from '../src/lib/daily-strength.ts';

const [source, basePath, output, ...flags] = process.argv.slice(2);
if (
  !source ||
  !basePath ||
  !output ||
  flags.some((flag) => !['--source-only', '--weekly-order'].includes(flag))
) {
  console.error(
    'Usage: node --experimental-strip-types scripts/import-daily-strength.mjs source.zip current-jymiq.json jymiq-import.json [--source-only] [--weekly-order]\nDefault: merges existing data. --source-only: includes only source training data, discarding existing Jymiq rows. --weekly-order (requires --source-only): activates the current source program with its routine order assigned Monday first, remaining days rest. The program starts on import day.\nCreates a backup; does not modify the phone. Requires Python 3. Copy jymiq-import.json into the backup folder (usually Documents), then restore through Account → Restore from a backup. Set weight units to LB in Settings. Keep your base JSON and source ZIP for rollback.',
  );
  process.exit(1);
}
try {
  const archive = JSON.parse(
    execFileSync(
      'python3',
      [
        '-c',
        `
import json, sys, zipfile
with zipfile.ZipFile(sys.argv[1]) as archive:
    if sum(entry.file_size for entry in archive.infolist()) > 128 * 1024 * 1024:
        raise ValueError('Archive exceeds 128 MiB uncompressed')
    result = {}
    for entry in archive.infolist():
        if entry.filename.endswith('.json'):
            if '/' in entry.filename or entry.filename in result:
                raise ValueError('Expected unique root-level JSON files')
            result[entry.filename] = json.loads(archive.read(entry))
    print(json.dumps(result))
`,
        source,
      ],
      { maxBuffer: 128 * 1024 * 1024, encoding: 'utf8' },
    ),
  );
  const { backup, report } = convertDailyStrength(
    archive,
    JSON.parse(readFileSync(basePath, 'utf8')),
    { sourceOnly: flags.includes('--source-only'), weeklyOrder: flags.includes('--weekly-order') },
  );
  writeFileSync(output, JSON.stringify(backup), { flag: 'wx', mode: 0o600 });
  writeFileSync(
    `${output}.report.txt`,
    JSON.stringify({ ...report, counts: backup.counts }, null, 2),
    { flag: 'wx', mode: 0o600 },
  );
  console.log(JSON.stringify({ ...report, counts: backup.counts }, null, 2));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
