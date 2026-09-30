/**
 * The glass lab's model: which recipe, how much blur, what ground, and which
 * surfaces take it. Dev-only — it exists so the owner can compare looks on the
 * real screens and the frame cost of each can be measured, not assumed.
 */
export const GLASS_STYLES = ['off', 'tint', 'frost', 'smoke', 'crystal'] as const;
export const BLUR_LEVELS = [0, 20, 40, 60, 80] as const;
export const BACKGROUNDS = ['dots', 'grid', 'hatch', 'mesh', 'orbs', 'plain'] as const;
export const SCOPES = [
  'off',
  'hero',
  'hero+inner',
  'cards',
  'cards+chrome',
  'all',
  'chrome',
  'chrome+hero',
] as const;

export type GlassStyle = (typeof GLASS_STYLES)[number];
export type BlurLevel = (typeof BLUR_LEVELS)[number];
export type Background = (typeof BACKGROUNDS)[number];
export type Scope = (typeof SCOPES)[number];
export type Element = 'hero' | 'inner' | 'plate' | 'row' | 'chrome';

export type GlassTrial = {
  style: GlassStyle;
  blur: BlurLevel;
  background: Background;
  scope: Scope;
};

/** The owner's pick from the lab (2026-09-30): frost with minimal blur on every main card and a dense chrome tint, today's ground. */
export const DEFAULT_TRIAL: GlassTrial = {
  style: 'frost',
  blur: 20,
  background: 'dots',
  scope: 'cards+chrome',
};

const SCOPE_ELEMENTS: Record<Scope, readonly Element[]> = {
  off: [],
  hero: ['hero'],
  'hero+inner': ['hero', 'inner'],
  cards: ['hero', 'plate'],
  'cards+chrome': ['hero', 'plate', 'chrome'],
  all: ['hero', 'plate', 'row'],
  chrome: ['chrome'],
  'chrome+hero': ['chrome', 'hero'],
};

const BLURRING: readonly GlassStyle[] = ['frost', 'smoke', 'crystal'];

export const appliesTo = (scope: Scope, element: Element): boolean =>
  SCOPE_ELEMENTS[scope].includes(element);

const pick = <T>(options: readonly T[], value: unknown, fallback: T): T =>
  options.includes(value as T) ? (value as T) : fallback;

export function coerceTrial(raw: unknown): GlassTrial {
  if (typeof raw !== 'object' || raw === null) return DEFAULT_TRIAL;
  const o = raw as Record<string, unknown>;
  return {
    style: pick(GLASS_STYLES, o.style, DEFAULT_TRIAL.style),
    blur: pick(BLUR_LEVELS, o.blur, DEFAULT_TRIAL.blur),
    background: pick(BACKGROUNDS, o.background, DEFAULT_TRIAL.background),
    scope: pick(SCOPES, o.scope, DEFAULT_TRIAL.scope),
  };
}

/**
 * Whether one surface is glass under a trial, and the BlurView intensity it
 * takes (0 is no BlurView). Inner tiles never blur — they sit on a plate that already does.
 */
export function glassOf(t: GlassTrial, element: Element): { glass: boolean; blur: number } {
  const glass = t.style !== 'off' && appliesTo(t.scope, element);
  const blur =
    glass && element !== 'inner' && element !== 'chrome' && BLURRING.includes(t.style) ? t.blur : 0;
  return { glass, blur };
}

/**
 * A screen wraps its backdrop in a blur target only when something on it will
 * blur. Chrome is not on a screen: the tab bar and action bar are its flex
 * siblings and a sheet overlays it, so they never read this target.
 */
export const screenBlurs = (t: GlassTrial): boolean =>
  (['hero', 'plate', 'row'] as const).some((element) => glassOf(t, element).blur > 0);

export const PRESETS: readonly { label: string; trial: GlassTrial }[] = [
  { label: 'A · Frost 20 cards', trial: DEFAULT_TRIAL },
  {
    label: 'B · Frost 40 mesh',
    trial: { style: 'frost', blur: 40, background: 'mesh', scope: 'hero' },
  },
  {
    label: 'C · Smoke 60 orbs',
    trial: { style: 'smoke', blur: 60, background: 'orbs', scope: 'cards' },
  },
  {
    label: 'D · Crystal 80 grid',
    trial: { style: 'crystal', blur: 80, background: 'grid', scope: 'hero+inner' },
  },
  {
    label: 'E · Chrome only',
    trial: { style: 'frost', blur: 40, background: 'dots', scope: 'chrome' },
  },
  {
    label: 'F · Everything',
    trial: { style: 'frost', blur: 60, background: 'plain', scope: 'all' },
  },
];
