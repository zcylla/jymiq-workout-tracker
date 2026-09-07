#!/usr/bin/env node
/**
 * Generate the built-in exercise library: drizzle/0001_seed_exercises.sql and
 * src/data/exercise-art.ts, the require map for the illustrations.
 *
 * The spine is bryllim/workout-guide, because it is the only part of this that
 * ships a picture. Seeding from a 1295-row text dataset and matching art onto it
 * put art on 7% of rows; seeding from the 302 illustrated exercises puts art on
 * all of them, which is the whole point of the row thumbnail.
 *
 * LICENCES, and they are not the same one:
 *   - @bryllim/workout-guide code/manifest: MIT. Its artwork: CC BY-SA 4.0. The
 *     files are used as published, so they are not Adapted Material and
 *     ShareAlike never reaches our own source. Do not resize, recolour or
 *     re-encode them — tint at render time. Credit is shown on the exercise
 *     screen, which is where the app distributes the work.
 *   - hasaneyldrm/exercises-dataset: the DATA is MIT and is used here for
 *     description and cues. Its images/videos are (c) Gym visual, licensed per
 *     use, and are NOT read by this script.
 *   - yuhonas/free-exercise-db: the data is public domain / MIT and fills in
 *     instructions the first source does not have. Its images are of disclaimed
 *     provenance and are NOT read by this script.
 *
 * Run with --offline to reuse cached downloads.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const offline = process.argv.includes('--offline');

/**
 * The illustrations come from the published package rather than being vendored:
 * 906 PNGs is 42 MB, and 42 MB of binaries in git is permanent history weight
 * for files npm already versions for us. Metro requires them straight out of
 * node_modules through the package's `./assets/*` export.
 */
const ART_PKG = '@bryllim/workout-guide';
const SOURCES = {
  dataset: [
    'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json',
    '.cache-exercises-dataset.json',
  ],
  fedb: [
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json',
    '.cache-free-exercise-db.json',
  ],
};

/** Fixed: a migration whose bytes change on every run is a broken migration. */
const STAMP = 1788745400000;

/** workout-guide's seventeen equipment values onto our six. */
const EQUIPMENT = {
  Barbell: 'barbell',
  Dumbbell: 'dumbbell',
  Kettlebell: 'dumbbell',
  Cable: 'cable',
  Machine: 'machine',
  Bodyweight: 'bodyweight',
  'Pull-up Bar': 'bodyweight',
  Bench: 'bodyweight',
  Box: 'bodyweight',
  Chair: 'bodyweight',
  Doorway: 'bodyweight',
  Towel: 'bodyweight',
  Wall: 'bodyweight',
  'Resistance Band': 'other',
  'Stability Ball': 'other',
  Plate: 'other',
  Cardio: 'other',
};

/** Their muscle vocabulary onto the sixteen in schema.ts. */
const MUSCLE = {
  Quads: 'quads',
  Hamstrings: 'hamstrings',
  Glutes: 'glutes',
  Calves: 'calves',
  Adductors: 'adductors',
  Groin: 'adductors',
  Chest: 'chest',
  Back: 'back',
  'Upper Back': 'traps',
  Lats: 'lats',
  'Lower Back': 'lower_back',
  Shoulders: 'shoulders',
  'Rear Delts': 'shoulders',
  Biceps: 'biceps',
  Triceps: 'triceps',
  Forearms: 'forearms',
  Grip: 'forearms',
  Core: 'abs',
  Hips: 'glutes',
  // Groups rather than muscles. Expanded, because a row with no muscle at all is
  // invisible to every filter the library has.
  Legs: ['quads', 'hamstrings', 'glutes'],
  'Posterior Chain': ['glutes', 'hamstrings', 'lower_back'],
  // No home in our sixteen, and inventing a seventeenth to hold them would put
  // "Mobility" in a list the body map has to render: Mobility, Cardio.
};

/** Single-joint work. Drives default rest and whether e1RM means anything. */
const ISOLATION = new Set([
  'biceps',
  'triceps',
  'calves',
  'forearms',
  'abs',
  'adductors',
  'traps',
  'neck',
]);

const q = (v) => (v == null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);

async function load(name) {
  const [url, file] = SOURCES[name];
  const cache = join(root, 'node_modules', file);
  if (offline && existsSync(cache)) return JSON.parse(readFileSync(cache, 'utf8'));
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${name}: ${res.status} ${res.statusText}`);
  const json = await res.json();
  writeFileSync(cache, JSON.stringify(json));
  return json;
}

// ------------------------------------------------------------- name matching --
// The three sources name the same lift three ways: "Bench Press" here,
// "Barbell Bench Press" in the dataset, "Barbell Bench Press - Medium Grip" in
// free-exercise-db. Matching is deliberately strict — a wrong HOW TO on a lift
// is worse than no HOW TO, so a candidate is only accepted when the extra words
// it carries are ones that cannot change which movement it is.
const SYNONYM = {
  pushup: 'push up',
  pushups: 'push up',
  pullup: 'pull up',
  pullups: 'pull up',
  chinup: 'chin up',
  chinups: 'chin up',
  situp: 'sit up',
  situps: 'sit up',
  bicep: 'biceps',
  tricep: 'triceps',
  banded: 'band',
  glutes: 'glute',
  abs: 'ab',
  raises: 'raise',
  curls: 'curl',
  rows: 'row',
  presses: 'press',
  extensions: 'extension',
  flyes: 'fly',
  flys: 'fly',
};
const FILLER = new Set([
  'full',
  'standing',
  'classic',
  'traditional',
  'bodyweight',
  'exercise',
  'version',
  'two',
  'bar',
  'free',
]);
/** The equipment word their short name omits and the other sources spell out. */
const ALIAS = {
  Barbell: ['barbell'],
  Dumbbell: ['dumbbell'],
  Cable: ['cable'],
  Machine: ['machine', 'lever', 'sled'],
  'Resistance Band': ['band'],
  Kettlebell: ['kettlebell'],
  Plate: ['plate'],
};

const tokens = (s) => {
  const words = s
    .replace(/\(.*?\)/g, ' ')
    .toLowerCase()
    .replace(/-/g, ' ')
    .match(/[a-z0-9]+/g);
  return new Set((words ?? []).flatMap((w) => (SYNONYM[w] ?? w).split(' ')));
};
const subset = (a, b) => [...a].every((x) => b.has(x));

function indexBy(entries, name, equipment) {
  const index = new Map();
  for (const e of entries) {
    const key = [...tokens(name(e))].sort().join(' ');
    if (!index.has(key)) index.set(key, []);
    index.get(key).push({ entry: e, equipment: equipment(e) });
  }
  return index;
}

/** The best entry in `index` for one manifest row, or null when none is safe. */
function findMatch(art, index) {
  const want = EQUIPMENT[art.equipment];
  const base = tokens(art.name);
  const candidates = [];
  for (const [key, rows] of index) {
    const have = new Set(key.split(' ').filter(Boolean));
    for (const prefix of [...(ALIAS[art.equipment] ?? []), null]) {
      const need = prefix ? new Set([...base, prefix]) : base;
      if (!subset(need, have)) continue;
      const extra = [...have].filter((w) => !need.has(w));
      if (extra.some((w) => !FILLER.has(w))) continue;
      for (const row of rows) {
        if (row.equipment === want || want === 'other')
          candidates.push({ extra: extra.length, row });
      }
      break;
    }
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => a.extra - b.extra);
  return candidates[0].row.entry;
}

// ---------------------------------------------------------------------- build --
const manifest = JSON.parse(
  readFileSync(join(root, 'node_modules', ART_PKG, 'manifest.json'), 'utf8'),
);
const [dataset, fedb] = await Promise.all([load('dataset'), load('fedb')]);

const DATASET_EQUIP = {
  barbell: 'barbell',
  'ez barbell': 'barbell',
  'olympic barbell': 'barbell',
  'trap bar': 'barbell',
  dumbbell: 'dumbbell',
  kettlebell: 'dumbbell',
  cable: 'cable',
  rope: 'cable',
  'smith machine': 'machine',
  'leverage machine': 'machine',
  'sled machine': 'machine',
  assisted: 'machine',
  hammer: 'machine',
  'body weight': 'bodyweight',
  weighted: 'bodyweight',
};
const FEDB_EQUIP = {
  barbell: 'barbell',
  'e-z curl bar': 'barbell',
  dumbbell: 'dumbbell',
  kettlebells: 'dumbbell',
  cable: 'cable',
  machine: 'machine',
  'body only': 'bodyweight',
  bands: 'other',
};

// This dataset localises its prose: `instructions` and `instruction_steps` are
// objects keyed by language, not a string and an array. Reading them as if they
// were plain is silent — the object is truthy, `.length` is undefined — and the
// whole source drops out of the match with no error.
const datasetIndex = indexBy(
  dataset.filter((e) => e.instruction_steps?.en?.length || e.instructions?.en),
  (e) => e.name,
  (e) => DATASET_EQUIP[String(e.equipment).toLowerCase()] ?? 'other',
);
const fedbIndex = indexBy(
  fedb.filter((e) => e.instructions?.length),
  (e) => e.name,
  (e) => FEDB_EQUIP[String(e.equipment).toLowerCase()] ?? 'other',
);

const rows = [];
const dropped = { noEquipment: 0, noMuscle: 0 };
const unmapped = new Map();

for (const art of manifest) {
  const equipment = EQUIPMENT[art.equipment];
  if (!equipment) {
    dropped.noEquipment++;
    unmapped.set(art.equipment, (unmapped.get(art.equipment) ?? 0) + 1);
    continue;
  }

  const muscles = [];
  const seen = new Set();
  const add = (raw, role) => {
    const mapped = MUSCLE[raw];
    if (!mapped) {
      if (raw) unmapped.set(raw, (unmapped.get(raw) ?? 0) + 1);
      return;
    }
    for (const m of Array.isArray(mapped) ? mapped : [mapped]) {
      if (seen.has(m)) continue;
      seen.add(m);
      muscles.push({ muscle: m, role });
    }
  };
  add(art.primaryMuscle, 'prime');
  for (const s of art.secondaryMuscles ?? []) add(s, 'assist');
  if (!muscles.length) {
    dropped.noMuscle++;
    continue;
  }

  const fromDataset = findMatch(art, datasetIndex);
  const fromFedb = findMatch(art, fedbIndex);
  const steps = fromDataset?.instruction_steps?.en?.length
    ? fromDataset.instruction_steps.en
    : (fromFedb?.instructions ?? []);
  const description = fromDataset?.instructions?.en || null;

  // free-exercise-db is the only source with a real `mechanic`; otherwise the
  // usual split on the prime mover, which is a judgement rather than a fact.
  const kind =
    fromFedb?.mechanic === 'compound' || fromFedb?.mechanic === 'isolation'
      ? fromFedb.mechanic
      : ISOLATION.has(muscles[0].muscle)
        ? 'isolation'
        : 'compound';

  rows.push({
    id: art.slug,
    name: art.name,
    equipment,
    kind,
    barWeightKg: equipment === 'barbell' ? 20 : null,
    defaultRestSec: kind === 'compound' ? 180 : 90,
    description,
    cues: steps.length ? JSON.stringify(steps) : null,
    muscles,
  });
}

const OK_EQUIP = new Set(['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'other']);
const OK_MUSCLE = new Set(Object.values(MUSCLE).flat());
for (const r of rows) {
  if (!OK_EQUIP.has(r.equipment)) throw new Error(`bad equipment ${r.equipment} on ${r.id}`);
  if (r.kind !== 'compound' && r.kind !== 'isolation') throw new Error(`bad kind on ${r.id}`);
  for (const m of r.muscles) {
    if (!OK_MUSCLE.has(m.muscle)) throw new Error(`bad muscle ${m.muscle} on ${r.id}`);
  }
}

// ------------------------------------------------------------------- the art --
// Every row has all three frames, because they are a motion sequence and the
// exercise screen's demonstration block is why this set was chosen over stills.
const FRAMES = [1, 2, 3];
for (const r of rows) {
  for (const n of FRAMES) {
    const file = join(root, 'node_modules', ART_PKG, 'assets', r.id, `frame-${n}.png`);
    if (!existsSync(file)) throw new Error(`${ART_PKG} has no frame ${n} for ${r.id}`);
  }
}

// The require map: Metro resolves assets statically, so a path built at runtime
// resolves to nothing. Generated rather than hand-kept, so it cannot drift.
writeFileSync(
  join(root, 'src', 'data', 'exercise-art.ts'),
  `// Generated by scripts/build-seed.mjs. Do not edit — run \`pnpm seed:gen\`.
//
// Metro resolves \`require\` statically, so an asset path assembled at runtime
// resolves to nothing at all. This map is what makes a per-row illustration
// possible; a built-in exercise has one, a custom exercise does not.
//
// Artwork (c) Bryl Lim, licensed CC BY-SA 4.0, from the @bryllim/workout-guide
// package — required straight out of node_modules rather than vendored, because
// 906 PNGs is 42 MB and git keeps binaries forever. The files are used
// unmodified, so they are not Adapted Material and ShareAlike never reaches this
// app's own source: tint at render time, never resize or re-encode. The credit
// is shown in the app on the exercise screen.

/** The three poses of one movement, in order. */
export type ExerciseFrames = readonly [number, number, number];

const ART: Record<string, ExerciseFrames> = {
${rows
  .map(
    (r) =>
      `  '${r.id}': [\n` +
      FRAMES.map(
        (n) => `    require('@bryllim/workout-guide/assets/${r.id}/frame-${n}.png'),`,
      ).join('\n') +
      '\n  ],',
  )
  .join('\n')}
};

/** Built-ins are illustrated; anything the user adds is not. */
export function exerciseArt(id: string): ExerciseFrames | undefined {
  return ART[id];
}

/** The still a list row shows. Frame 1 is the start of the movement. */
export function exerciseStill(id: string): number | undefined {
  return ART[id]?.[0];
}
`,
);

// Generated TypeScript still has to satisfy `pnpm check`, and replicating
// Biome's quoting rules here would be a second copy of them to keep in step.
execFileSync('npx', ['biome', 'format', '--write', 'src/data/exercise-art.ts'], {
  cwd: root,
  stdio: 'ignore',
});

// ------------------------------------------------------------------- the SQL --
const chunk = (a, n) =>
  Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

let sql = `-- The built-in exercise library.
--
-- Generated by scripts/build-seed.mjs from bryllim/workout-guide, whose 302
-- exercises are the ones that ship an illustration. Description and cues are
-- matched in from hasaneyldrm/exercises-dataset and yuhonas/free-exercise-db,
-- both MIT text. No image from either of those repos is used.
--
-- INSERT OR IGNORE so a re-run is harmless. Do not hand-edit: run \`pnpm seed:gen\`.
--
-- The header sits INSIDE the first statement's chunk on purpose. Drizzle splits
-- this file on its breakpoint marker, and a chunk holding only comments prepares
-- to a NULL sqlite3_stmt; expo-sqlite then calls clear_bindings on it and the app
-- dies with a SIGSEGV rather than a SQL error. So: never lead with a marker, and
-- never write one inside a comment either -- the split does not know it is prose.
`;

const statements = [];
for (const g of chunk(rows, 40)) {
  statements.push(
    'INSERT OR IGNORE INTO `exercises` ' +
      '(`id`,`name`,`equipment`,`kind`,`is_custom`,`is_favorite`,`bar_weight_kg`,' +
      '`default_rest_sec`,`track_rpe`,`description`,`cues`,`created_at`,`updated_at`) VALUES\n' +
      g
        .map(
          (r) =>
            `(${q(r.id)},${q(r.name)},${q(r.equipment)},${q(r.kind)},0,0,` +
            `${r.barWeightKg ?? 'NULL'},${r.defaultRestSec},0,${q(r.description)},${q(r.cues)},` +
            `${STAMP},${STAMP})`,
        )
        .join(',\n') +
      ';',
  );
}
const links = rows.flatMap((r) => r.muscles.map((m) => ({ id: r.id, ...m })));
for (const g of chunk(links, 150)) {
  statements.push(
    'INSERT OR IGNORE INTO `exercise_muscles` (`exercise_id`,`muscle`,`role`) VALUES\n' +
      g.map((l) => `(${q(l.id)},${q(l.muscle)},${q(l.role)})`).join(',\n') +
      ';',
  );
}
sql += statements.join('\n--> statement-breakpoint\n') + '\n';
writeFileSync(join(root, 'drizzle', '0001_seed_exercises.sql'), sql);

const hist = (f) => rows.reduce((a, r) => ((a[f(r)] = (a[f(r)] ?? 0) + 1), a), {});
console.log(`exercises    ${rows.length}`);
console.log(`muscle rows  ${links.length}`);
console.log(`illustrated  ${rows.length} (every row)`);
console.log(
  `with cues    ${rows.filter((r) => r.cues).length}` +
    `  (${Math.round((100 * rows.filter((r) => r.cues).length) / rows.length)}%)`,
);
console.log(`with prose   ${rows.filter((r) => r.description).length}`);
console.log(
  'equipment   ',
  hist((r) => r.equipment),
);
console.log(
  'kind        ',
  hist((r) => r.kind),
);
console.log('dropped     ', dropped);
console.log('unmapped    ', Object.fromEntries([...unmapped].sort((a, b) => b[1] - a[1])));
