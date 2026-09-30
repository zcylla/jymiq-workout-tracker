/**
 * W5's rule: when the tab bar gives way to its minimised form. Worklet-safe — it runs in a
 * scroll handler on the UI thread, so it holds no closures.
 */
export type BarScroll = { minimised: boolean; anchor: number };

/** Inside this the page is at rest, and the bar is always full. Overscroll counts. */
export const TOP_ZONE = 24;
/** Drag this far against the bar's current state, from the furthest point reached, to flip it. */
export const TRAVEL = 12;

export function stepBar(state: BarScroll, offset: number): BarScroll {
  'worklet';
  if (offset <= TOP_ZONE) return { minimised: false, anchor: offset };
  if (state.minimised) {
    const anchor = Math.max(state.anchor, offset);
    return anchor - offset >= TRAVEL
      ? { minimised: false, anchor: offset }
      : { minimised: true, anchor };
  }
  const anchor = Math.min(state.anchor, offset);
  return offset - anchor >= TRAVEL
    ? { minimised: true, anchor: offset }
    : { minimised: false, anchor };
}
