import { Platform, type TextStyle } from 'react-native';

/**
 * Geist + Geist Mono, embedded at build time by the expo-font config plugin.
 *
 * The two platforms address fonts differently and getting it wrong fails
 * silently — Android falls back to the system font, iOS synthesises a fake bold
 * on top of an already-bold face. So this is the only place a family name
 * appears, and the iOS branch structurally cannot emit fontWeight.
 */
export type SansWeight = 400 | 500 | 600 | 700;
export type MonoWeight = 400 | 500 | 600;

type FontSpec = Pick<TextStyle, 'fontFamily' | 'fontWeight'>;

/** PostScript names, read out of the vendored files' name tables. */
const SANS_PS: Record<SansWeight, string> = {
  400: 'Geist-Regular',
  500: 'Geist-Medium',
  600: 'Geist-SemiBold',
  700: 'Geist-Bold',
};

const MONO_PS: Record<MonoWeight, string> = {
  400: 'GeistMono-Regular',
  500: 'GeistMono-Medium',
  600: 'GeistMono-SemiBold',
};

export const sans = (w: SansWeight): FontSpec =>
  Platform.select({
    android: { fontFamily: 'Geist', fontWeight: String(w) as TextStyle['fontWeight'] },
    default: { fontFamily: SANS_PS[w] },
  })!;

export const mono = (w: MonoWeight): FontSpec =>
  Platform.select({
    android: { fontFamily: 'Geist Mono', fontWeight: String(w) as TextStyle['fontWeight'] },
    default: { fontFamily: MONO_PS[w] },
  })!;
