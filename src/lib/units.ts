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

/** 102.5 -> "102.5", 100 -> "100". Trailing zeros never help a load. */
export const formatWeight = (kg: Kg, unit: Unit = 'kg'): string => {
  const v = toDisplay(kg, unit);
  return (Math.round(v * 100) / 100).toString();
};
