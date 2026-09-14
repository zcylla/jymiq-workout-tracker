/** Every weight in the database is kilograms. Pounds are a display transform. */
export type Kg = number;

export type Unit = 'kg' | 'lb';

const LB_PER_KG = 2.2046226218;

export const toDisplay = (kg: Kg, unit: Unit): number => (unit === 'kg' ? kg : kg * LB_PER_KG);

export const fromDisplay = (value: number, unit: Unit): Kg =>
  unit === 'kg' ? value : value / LB_PER_KG;

export const roundToStep = (value: number, step: number): number => Math.round(value / step) * step;

export const floorToStep = (value: number, step: number): number =>
  Math.floor(value / step + 1e-9) * step;

/**
 * Integer key for weight equality. Float weights compare badly and the
 * most-reps-at-weight record needs an exact bucket: 102.5 -> 10250.
 */
export const weightKey = (kg: Kg): number => Math.round(kg * 100);

/**
 * `102.5 -> "102.5"`, `100 -> "100"`. Trailing zeros never help a load.
 *
 * Kilograms keep two decimals because 102.5 is a real plate configuration and
 * 1.25 is a real plate. Pounds keep one, because every pounds figure here is a
 * *conversion* — 105 kg is 231.485…, and printing 231.49 claims a precision the
 * number never had. Nobody loads a bar to a hundredth of a pound.
 */
export const formatWeight = (kg: Kg, unit: Unit = 'kg'): string => {
  const v = toDisplay(kg, unit);
  const places = unit === 'kg' ? 100 : 10;
  return (Math.round(v * places) / places).toString();
};
