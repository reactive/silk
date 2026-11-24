/**
 * Where a pager's pages stand under a drag, and the page a release lands on.
 * Positions are in pages: 0 shows the first page whole, 1.5 sits halfway
 * between the second and the third. Speeds are in pages per second, positive
 * toward later pages. Pure worklets, so tests run them in Node.
 */
import { gestureConventions } from '../../gesture/conventions.js';

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
 * them at with nothing in the way): there, inside `reach`; past it, they
 * follow at a third of the finger's travel.
 */
export function dragPosition(raw: number, from: number, enabled: readonly boolean[]): number {
  'worklet';
  const { min, max } = reach(from, enabled);
  if (raw < min) return min - (min - raw) * RESISTANCE;
  if (raw > max) return max + (raw - max) * RESISTANCE;
  return raw;
}

/**
 * The page a release at `position`, `speed` pages per second, lands on. A
 * fling (at least Material's fling threshold, `flingPx` points per second
 * across `pageWidth`) goes on to the next page in its direction; a slower
 * release settles on the nearest page. Never past `reach`: a drag moves at
 * most one page, and never onto a disabled one.
 */
export function landing(
  position: number,
  speed: number,
  pageWidth: number,
  from: number,
  enabled: readonly boolean[],
): number {
  'worklet';
  const { min, max } = reach(from, enabled);
  const fling = pageWidth > 0 && Math.abs(speed) * pageWidth >= gestureConventions.flingVelocity;
  const page = fling ? (speed > 0 ? Math.ceil(position) : Math.floor(position)) : Math.round(position);
  return Math.min(max, Math.max(min, page));
}
