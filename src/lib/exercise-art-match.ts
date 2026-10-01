const PLURALS: Readonly<Record<string, string>> = {
  biceps: 'bicep',
  triceps: 'tricep',
  curls: 'curl',
  deadlifts: 'deadlift',
  squats: 'squat',
  rows: 'row',
  raises: 'raise',
  extensions: 'extension',
  presses: 'press',
  dips: 'dip',
  ups: 'up',
  lunges: 'lunge',
  flyes: 'fly',
  flies: 'fly',
};

function normalize(name: string): string {
  return (name.toLowerCase().match(/[a-z0-9]+/g) ?? [])
    .map((word) => (Object.hasOwn(PLURALS, word) ? PLURALS[word] : word))
    .join(' ');
}

const ALIASES = new Map<string, string>([
  ['barbell deadlift', 'deadlift'],
  ['barbell squat', 'squat'],
  ['alternating dumbbell bicep curl', 'bicep-curl'],
  ['barbell bench press', 'bench-press'],
  ['barbell front squat', 'front-squat'],
  ['barbell hip thrust', 'hip-thrust'],
  ['barbell romanian deadlift', 'romanian-deadlift'],
  ['butterfly machine pec deck', 'pec-deck'],
  ['cable bicep curl', 'cable-curl'],
  ['cable crossover', 'cable-fly'],
  ['cable rope tricep pushdown', 'rope-tricep-pushdown'],
  ['cable tricep pushdown', 'tricep-pushdown'],
  ['calf press on leg press', 'leg-press-calf-raise'],
  ['chest press machine', 'machine-chest-press'],
  ['close grip barbell bench press', 'close-grip-bench-press'],
  ['dumbbell bicep curl', 'bicep-curl'],
  ['dumbbell bulgarian split squat', 'bulgarian-split-squat'],
  ['dumbbell hammer curl', 'hammer-curl'],
  ['dumbbell shoulder press', 'seated-dumbbell-press'],
  ['dumbbell walking lunge', 'walking-lunge'],
  ['hack squat machine', 'hack-squat'],
  ['incline barbell bench press', 'incline-bench-press'],
  ['incline dumbbell bench press', 'incline-dumbbell-press'],
  ['incline dumbbell bicep curl', 'incline-dumbbell-curl'],
  ['lateral dumbbell raise', 'lateral-raise'],
  ['lying dumbbell tricep extension skull crusher', 'dumbbell-skull-crusher'],
  ['one arm cable lateral raise', 'cable-lateral-raise'],
  ['preacher curl machine', 'preacher-curl'],
  ['reverse fly machine', 'reverse-pec-deck'],
  ['seated cable row', 'seated-row'],
  ['seated calf raise machine', 'seated-calf-raise'],
  ['seated row machine', 'machine-row'],
  ['seated shoulder press machine', 'machine-shoulder-press'],
  ['seated single arm cable row', 'single-arm-cable-row'],
  ['standing barbell military press', 'overhead-press'],
  ['standing cable reverse fly', 'cable-rear-delt-fly'],
  ['standing calf raise machine', 'standing-calf-raise'],
  ['straight arm cable lat pulldown', 'straight-arm-pulldown'],
  ['thigh abductor', 'hip-abduction-machine'],
  ['wide grip lat pull down', 'wide-grip-lat-pulldown'],
]);

export function matchArtKey(name: string, keys: readonly string[]): string | null {
  const normalized = normalize(name);
  if (!normalized) return null;
  const slug = normalized.replaceAll(' ', '-');
  if (keys.includes(slug)) return slug;
  const alias = ALIASES.get(normalized);
  return alias && keys.includes(alias) ? alias : null;
}
