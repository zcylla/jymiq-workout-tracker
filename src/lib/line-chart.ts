/** Room kept round the plot so a dot on the edge is not cut by the canvas. */
export const INSET = 4;

export interface LineGeometry {
  points: { x: number; y: number }[];
  lo: number;
  hi: number;
  /** Index of the highest point; the latest of equal ones. -1 when there are none. */
  peak: number;
  /** Every value is the same: there is no range to scale against, so the line runs mid-height. */
  flat: boolean;
  trend: { x1: number; y1: number; x2: number; y2: number } | null;
}

/**
 * A line chart's maths: `points` sit on `slots` evenly spaced columns, the
 * range is the data's own min and max, and `trend` is a fit over slot, drawn
 * between the first and last point.
 */
export function lineGeometry(
  points: readonly { slot: number; value: number }[],
  slots: number,
  w: number,
  h: number,
  trend: { slope: number; intercept: number } | null,
): LineGeometry {
  if (!points.length) return { points: [], lo: 0, hi: 0, peak: -1, flat: true, trend: null };

  const values = points.map((p) => p.value);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const flat = hi === lo;
  const xOf = (slot: number) =>
    slots > 1 ? INSET + ((w - 2 * INSET) * slot) / (slots - 1) : w - INSET;
  const yOf = (v: number) => (flat ? h / 2 : h - INSET - ((h - 2 * INSET) * (v - lo)) / (hi - lo));

  let peak = 0;
  points.forEach((p, i) => {
    if (p.value >= points[peak].value) peak = i;
  });

  const first = points[0].slot;
  const last = points[points.length - 1].slot;
  return {
    points: points.map((p) => ({ x: xOf(p.slot), y: yOf(p.value) })),
    lo,
    hi,
    peak,
    flat,
    trend:
      trend && points.length > 1
        ? {
            x1: xOf(first),
            y1: yOf(trend.intercept + trend.slope * first),
            x2: xOf(last),
            y2: yOf(trend.intercept + trend.slope * last),
          }
        : null,
  };
}
