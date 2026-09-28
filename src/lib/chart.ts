export type ChartColumn = { height: number; active: boolean };

export type ChartGeometry = {
  columns: ChartColumn[];
  lo: number;
  hi: number;
  activeIndex: number;
};

const FLOOR = 8;

export function chartGeometry(values: readonly number[], h: number, active = -1): ChartGeometry {
  const n = values.length;
  if (n === 0) return { columns: [], lo: 0, hi: 0, activeIndex: -1 };
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const activeIndex = ((active % n) + n) % n;
  return {
    // An exact zero draws nothing. kit.chart()'s floor exists so the smallest
    // real value is still visible, but applied to 0 it drew a 13pt bar beside
    // an axis labelled 0 — an empty week that read as a light one (§0: a visual
    // only when there is something real to draw).
    columns: values.map((v, i) => ({
      height: v === 0 ? 0 : FLOOR + ((h - FLOOR) * (v - lo + span * 0.12)) / (span * 1.12),
      active: i === activeIndex,
    })),
    lo,
    hi,
    activeIndex,
  };
}
