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
  'worklet';
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

/** Bounds in slot cells; point centres sit at slot + 0.5. */
export interface ChartWindow {
  start: number;
  count: number;
}

export function chartWindow(slots: number, scale: number, offset: number): ChartWindow {
  'worklet';
  if (slots <= 0) return { start: 0, count: 0 };
  const count = slots / Math.max(1, Math.min(slots / Math.min(4, slots), scale));
  return { start: Math.max(0, Math.min(slots - count, offset)), count };
}

export function slotToX(slot: number, window: ChartWindow, width: number): number {
  'worklet';
  return (
    INSET +
    ((slot + 0.5 - window.start) / Math.max(1, window.count)) * Math.max(0, width - 2 * INSET)
  );
}

export function zoomWindow(
  slots: number,
  initial: ChartWindow,
  scale: number,
  initialFocalX: number,
  focalX: number,
  width: number,
): ChartWindow {
  'worklet';
  const plotWidth = Math.max(1, width - 2 * INSET);
  const anchor = initial.start + ((initialFocalX - INSET) / plotWidth) * initial.count;
  const next = chartWindow(slots, (slots / Math.max(1, initial.count)) * scale, 0);
  return chartWindow(
    slots,
    slots / Math.max(1, next.count),
    anchor - ((focalX - INSET) / plotWidth) * next.count,
  );
}

export function panWindow(
  slots: number,
  initial: ChartWindow,
  translationX: number,
  width: number,
): ChartWindow {
  'worklet';
  return chartWindow(
    slots,
    slots / Math.max(1, initial.count),
    initial.start - (translationX / Math.max(1, width - 2 * INSET)) * initial.count,
  );
}

export function visibleSlots(window: ChartWindow, slots: number): { first: number; last: number } {
  'worklet';
  return {
    first: Math.max(0, Math.ceil(window.start - 0.5)),
    last: Math.min(slots - 1, Math.ceil(window.start + window.count - 0.5) - 1),
  };
}

function pointBounds(points: readonly { slot: number }[], window: ChartWindow) {
  'worklet';
  const lowerBound = (slot: number) => {
    let lo = 0;
    let hi = points.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (points[mid].slot < slot) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  return {
    first: lowerBound(window.start - 0.5),
    end: lowerBound(window.start + window.count - 0.5),
  };
}

export function nearestPoint(
  points: readonly { slot: number }[],
  window: ChartWindow,
  x: number,
  width: number,
  tolerance = 24,
): number {
  'worklet';
  const { first, end } = pointBounds(points, window);
  let index = -1;
  let distance = tolerance;
  for (let i = first; i < end; i++) {
    const delta = Math.abs(slotToX(points[i].slot, window, width) - x);
    if (delta <= distance) {
      distance = delta;
      index = i;
    }
  }
  return index;
}

export function windowGeometry(
  points: readonly { slot: number; value: number }[],
  window: ChartWindow,
  width: number,
  height: number,
) {
  'worklet';
  const { first, end } = pointBounds(points, window);
  const visible = points.slice(first, end);
  let fit: { slope: number; intercept: number } | null = null;
  if (visible.length > 1) {
    const mx = visible.reduce((sum, p) => sum + p.slot, 0) / visible.length;
    const my = visible.reduce((sum, p) => sum + p.value, 0) / visible.length;
    let sxy = 0;
    let sxx = 0;
    for (const p of visible) {
      sxy += (p.slot - mx) * (p.value - my);
      sxx += (p.slot - mx) ** 2;
    }
    const slope = sxx === 0 ? 0 : sxy / sxx;
    fit = { slope, intercept: my - slope * mx };
  }
  const geometry = lineGeometry(visible, window.count, width, height, fit);
  geometry.points = geometry.points.map((p, i) => ({
    x: slotToX(visible[i].slot, window, width),
    y: p.y,
  }));
  if (geometry.trend) {
    geometry.trend.x1 = slotToX(visible[0].slot, window, width);
    geometry.trend.x2 = slotToX(visible[visible.length - 1].slot, window, width);
  }
  return { points: visible, geometry };
}

export function tooltipPosition(
  x: number,
  y: number,
  width: number,
  height: number,
  cardWidth: number,
  cardHeight: number,
) {
  'worklet';
  const left = x + 10 + cardWidth <= width ? x + 10 : x - 10 - cardWidth;
  const top = y > height / 2 ? y - 10 - cardHeight : y + 10;
  return {
    left: Math.max(0, Math.min(width - cardWidth, left)),
    top: Math.max(0, Math.min(height - cardHeight, top)),
  };
}

export function selectionAt(
  points: readonly { slot: number }[],
  window: ChartWindow,
  selected: number,
  x: number,
  width: number,
): number {
  'worklet';
  const next = nearestPoint(points, window, x, width);
  return next === selected ? -1 : next;
}
