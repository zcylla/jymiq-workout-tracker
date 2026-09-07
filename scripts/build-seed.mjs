#!/usr/bin/env node
/**
 * Generate drizzle/0001_seed_exercises.sql — the built-in exercise library.
 *
 * Source: https://github.com/hasaneyldrm/exercises-dataset
 *
 * LICENCE, and it matters: only the *data* (names, equipment, muscles,
 * instructions and their translations) is MIT. The `images/` and `videos/` are
 * (c) Gym visual, included in that repo under a permission granted to that repo
 * — its NOTICE says plainly that cloning is not a licence, and their own licence
 * is priced per use. So this script reads no media field and the app ships none.
 * A free demonstration-media source is still an open question.
 *
 * Run with --offline to reuse the cached download.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC =
  'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json';
const CACHE = join(root, 'node_modules', '.cache-exercises-dataset.json');

/** Fixed: a migration whose bytes change on every run is a broken migration. */
const STAMP = 1788745400000;

/** Their 28 equipment values onto our six. */
const EQUIPMENT = {
  barbell: 'barbell',
  'ez barbell': 'barbell',
  'olympic barbell': 'barbell',
  'trap bar': 'barbell',
  dumbbell: 'dumbbell',
  kettlebell: 'dumbbell',
  cable: 'cable',
  rope: 'cable',
  // A Smith bar is counterbalanced and its weight varies by rack, so it is not a
  // barbell for our purposes — bar_weight_kg would be a guess.
  'smith machine': 'machine',
  'leverage machine': 'machine',
  'sled machine': 'machine',
  assisted: 'machine',
  hammer: 'machine',
  'upper body ergometer': 'machine',
  'skierg machine': 'machine',
  'stationary bike': 'machine',
  'elliptical machine': 'machine',
  'stepmill machine': 'machine',
  'body weight': 'bodyweight',
  weighted: 'bodyweight',
  band: 'other',
  'resistance band': 'other',
  'stability ball': 'other',
  'medicine ball': 'other',
  'bosu ball': 'other',
  roller: 'other',
  'wheel roller': 'other',
  tire: 'other',
};

/** Their muscle vocabulary onto the sixteen in schema.ts. Null means "no home". */
const MUSCLE = {
  abs: 'abs',
  abdominals: 'abs',
  core: 'abs',
  obliques: 'abs',
  pectorals: 'chest',
  chest: 'chest',
  'serratus anterior': 'chest',
  biceps: 'biceps',
  brachialis: 'biceps',
  triceps: 'triceps',
  delts: 'shoulders',
  deltoids: 'shoulders',
  shoulders: 'shoulders',
  'rear deltoids': 'shoulders',
  'rotator cuff': 'shoulders',
  'upper back': 'back',
  back: 'back',
  rhomboids: 'back',
  lats: 'lats',
  'latissimus dorsi': 'lats',
  traps: 'traps',
  trapezius: 'traps',
  'levator scapulae': 'neck',
  'lower back': 'lower_back',
  spine: 'lower_back',
  glutes: 'glutes',
  quads: 'quads',
  quadriceps: 'quads',
  'hip flexors': 'quads',
  hamstrings: 'hamstrings',
  calves: 'calves',
  soleus: 'calves',
  adductors: 'adductors',
  forearms: 'forearms',
  'wrist flexors': 'forearms',
  'wrist extensors': 'forearms',
  wrists: 'forearms',
  hands: 'forearms',
  neck: 'neck',
  // No home in our sixteen, dropped rather than inventing a seventeenth:
  // abductors, ankles, ankle stabilizers, feet, cardiovascular system.
};

/**
 * This dataset has no `mechanic` field, so compound/isolation is derived from
 * the target muscle — the usual strength-training split: single-joint work on
 * the arms, calves, waist and neck is isolation, everything else presses,
 * squats, hinges or pulls. It drives default rest and whether e1RM means
 * anything, so it is a judgement, not a fact from the source.
 */
const ISOLATION_TARGETS = new Set([
  'biceps',
  'triceps',
  'calves',
  'forearms',
  'abs',
  'adductors',
  'abductors',
  'traps',
  'serratus anterior',
  'levator scapulae',
  'spine',
]);

/** Not lifts. */
const SKIP_BODY_PART = new Set(['cardio']);

/** The source stores names lowercase ("barbell full squat"); the boards title-case. */
const title = (s) => s.replace(/[\p{L}\p{N}]+/gu, (w) => w[0].toUpperCase() + w.slice(1));

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const q = (v) => (v == null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);

async function load() {
  if (process.argv.includes('--offline') && existsSync(CACHE)) {
    return JSON.parse(readFileSync(CACHE, 'utf8'));
  }
  const res = await fetch(SRC);
  if (!res.ok) throw new Error(`${SRC} -> HTTP ${res.status}`);
  const json = await res.json();
  writeFileSync(CACHE, JSON.stringify(json));
  return json;
}

const raw = await load();
const dropped = { cardio: 0, noMuscle: 0, noInstructions: 0 };
const unmapped = new Map();
const ids = new Set();
const rows = [];

for (const e of raw) {
  if (SKIP_BODY_PART.has(e.body_part)) {
    dropped.cardio++;
    continue;
  }
  const steps = e.instruction_steps?.en ?? [];
  const prose = e.instructions?.en ?? '';
  if (!prose && !steps.length) {
    dropped.noInstructions++;
    continue;
  }

  const muscles = [];
  const add = (name, role) => {
    if (!name) return;
    const key = String(name).toLowerCase().trim();
    if (!(key in MUSCLE)) {
      unmapped.set(key, (unmapped.get(key) ?? 0) + 1);
      return;
    }
    const m = MUSCLE[key];
    if (!muscles.some((x) => x.muscle === m)) muscles.push({ muscle: m, role });
  };
  add(e.target, 'prime');
  add(e.muscle_group, 'assist');
  for (const s of e.secondary_muscles ?? []) add(s, 'assist');
  if (!muscles.length) {
    dropped.noMuscle++;
    continue;
  }

  // Names repeat across equipment, so a colliding slug takes the source's id.
  let id = slug(e.name);
  if (ids.has(id)) id = `${id}-${e.id}`;
  ids.add(id);

  const equipment = EQUIPMENT[e.equipment] ?? 'other';
  const kind = ISOLATION_TARGETS.has(String(e.target).toLowerCase()) ? 'isolation' : 'compound';

  rows.push({
    id,
    name: title(e.name),
    equipment,
    kind,
    barWeightKg: equipment === 'barbell' ? 20 : null,
    defaultRestSec: kind === 'compound' ? 180 : 90,
    description: prose || null,
    // The board's HOW TO block. `mistakes` stays NULL: the source has none and
    // inventing coaching advice is not a seed script's job.
    cues: steps.length ? JSON.stringify(steps) : null,
    muscles,
  });
}

const OK_EQUIP = new Set(['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'other']);
const OK_MUSCLE = new Set(Object.values(MUSCLE));
for (const r of rows) {
  if (!OK_EQUIP.has(r.equipment)) throw new Error(`bad equipment ${r.equipment} on ${r.id}`);
  if (r.kind !== 'compound' && r.kind !== 'isolation') throw new Error(`bad kind on ${r.id}`);
  for (const m of r.muscles) {
    if (!OK_MUSCLE.has(m.muscle)) throw new Error(`bad muscle ${m.muscle} on ${r.id}`);
  }
}

const chunk = (a, n) =>
  Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

let sql = `-- The built-in exercise library.
--
-- Generated by scripts/build-seed.mjs from hasaneyldrm/exercises-dataset. The
-- data is MIT; the media in that repo is (c) Gym visual and is NOT used here.
--
-- INSERT OR IGNORE so a re-run is harmless. Do not hand-edit: run \`npm run seed:gen\`.
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
console.log(`exercises   ${rows.length}`);
console.log(`muscle rows ${links.length}`);
console.log(`with cues   ${rows.filter((r) => r.cues).length}`);
console.log(
  'equipment  ',
  hist((r) => r.equipment),
);
console.log(
  'kind       ',
  hist((r) => r.kind),
);
console.log('dropped    ', dropped);
console.log('unmapped   ', Object.fromEntries([...unmapped].sort((a, b) => b[1] - a[1])));
