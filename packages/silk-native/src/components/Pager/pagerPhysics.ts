/**
 * Where a pager's pages stand under a drag, and the page a release lands on.
 * Positions are in pages: 0 shows the first page whole, 1.5 sits halfway
 * between the second and the third. Pure worklets, so tests run them in Node.
 */

/** How far a page lies beyond where a drag may go, as a share of the finger's travel. */
const RESISTANCE = 1 / 3;

/** The pages a drag from page `from` may reach: itself and an enabled neighbour on each side. */
export function reach(from: number, enabled: readonly boolean[]): { min: number; max: number } {
  'worklet';
  return {
    min: from > 0 && enabled[from - 1] ? from - 1 : from,
    max: from < enabled.length - 1 && enabled[from + 1] ? from + 1 : from,
  };
}

/**
 * Where the pages stand with the finger at `raw` (the position it would put
 * them at with nothing in the way), for a drag that caught them at `start`
 * heading to page `from`: there, between `reach` and `start`; past both, they
 * follow at a third of the finger's travel. Including `start` keeps a catch
 * mid-flight, outside `reach`, from jumping under the finger.
 */
export function dragPosition(
  raw: number,
  start: number,
  from: number,
  enabled: readonly boolean[],
): number {
  'worklet';
  const { min, max } = reach(from, enabled);
  const low = Math.min(min, start);
  const high = Math.max(max, start);
  if (raw < low) return low - (low - raw) * RESISTANCE;
  if (raw > high) return high + (raw - high) * RESISTANCE;
  return raw;
}

/**
 * The page a release at `position` lands on. A fling (`fling` 1 toward later
 * pages, -1 toward earlier ones, 0 for none) goes on to the next page its way;
 * a slower release settles on the nearest page. Never past `reach`: a drag
 * moves at most one page, and never onto a disabled one.
 */
export function landing(
  position: number,
  fling: -1 | 0 | 1,
  from: number,
  enabled: readonly boolean[],
): number {
  'worklet';
  const { min, max } = reach(from, enabled);
  const page =
    fling > 0 ? Math.ceil(position) : fling < 0 ? Math.floor(position) : Math.round(position);
  return Math.min(max, Math.max(min, page));
}
