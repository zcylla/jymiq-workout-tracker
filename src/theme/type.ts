import type { TextStyle } from 'react-native';

import { mono, sans } from './fonts';
import { color } from './tokens';

/**
 * The text ramp, as complete styles. Screens never set fontSize, fontFamily or
 * a raw color — they pick a ramp step.
 *
 * CSS letter-spacing is an em ratio; React Native's letterSpacing is points. The
 * boards are written in em, so every value goes through ls() rather than being
 * copied across — 0.14em at 11px is 1.54pt, not 0.14pt, and getting that wrong
 * makes every mono label in the app subtly too tight in a way that survives
 * review.
 */
const ls = (em: number, px: number) => Math.round(em * px * 100) / 100;

export const text = {
  h1: { ...sans(600), fontSize: 30, letterSpacing: ls(-0.03, 30), lineHeight: 33, color: color.hi },
  h2: { ...sans(600), fontSize: 19, letterSpacing: ls(-0.02, 19), color: color.hi },

  rowTitle: { ...sans(500), fontSize: 17, color: color.hi },
  rowName: { ...sans(400), fontSize: 15, color: color.hi },

  /** Model output and other sentences that carry a verdict. */
  lead: { ...sans(400), fontSize: 17, lineHeight: 25, color: color.hi },
  body: { ...sans(400), fontSize: 15, lineHeight: 23, color: color.mid },
  prose: { ...sans(400), fontSize: 13, lineHeight: 21, color: color.lo },

  /** kit .lbl — the ruled section label and every mono caption. 11px is the floor. */
  label: { ...mono(500), fontSize: 11, letterSpacing: ls(0.14, 11), color: color.lo },
  /** kit's inline mono meta line under a row title. */
  meta: { ...mono(400), fontSize: 11, letterSpacing: ls(0.08, 11), color: color.lo },

  /** kit .num — Geist Mono is tabular by construction, so no fontVariant needed. */
  num: { ...mono(500), fontSize: 15, letterSpacing: ls(-0.02, 15), color: color.hi },
  numSm: { ...mono(400), fontSize: 13, color: color.mid },
  numTile: { ...mono(600), fontSize: 22, letterSpacing: ls(-0.02, 22), color: color.hi },
  numCore: { ...mono(600), fontSize: 54, letterSpacing: ls(-0.05, 54), lineHeight: 56, color: color.hi },
} as const satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof text;
