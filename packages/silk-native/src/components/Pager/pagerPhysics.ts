/**
 * Where a pager's pages stand under a drag, and the page a release lands on.
 * Positions are in pages: 0 shows the first page whole, 1.5 sits halfway
 * between the second and the third. Pure worklets, so tests run them in Node.
 */

import { gestureConventions } from '../../gesture/conventions.js';

/** How far a page lies beyond where a drag may go, as a share of the finger's travel. */
const RESISTANCE = 1 / 3;

/** The first enabled page from page `from` going `step` (1 or -1), or `from` if none. */
function nearestEnabled(from: number, step: number, enabled: readonly boolean[]): number {
  'worklet';
  for (let page = from + step; page >= 0 && page < enabled.length; page += step) {
    if (enabled[page]) return page;
  }
  return from;
}

/**
 * The pages a drag from page `from` may reach: itself and the nearest enabled
 * page on each side, passing disabled ones by.
 */
export function reach(from: number, enabled: readonly boolean[]): { min: number; max: number } {
  'worklet';
  return { min: nearestEnabled(from, -1, enabled), max: nearestEnabled(from, 1, enabled) };
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
 * The page a release at `position` lands on, one of `reach`'s: a drag moves
 * at most one page, passing disabled ones by, and lands on an enabled one;
 * when none lies that way, it stays on `from`. A fling (`fling` above 0
 * toward later pages, below 0 toward earlier ones, 0 for none) goes on to the
 * next of them its way; a slower release settles on the nearest.
 */
export function landing(
  position: number,
  fling: number,
  from: number,
  enabled: readonly boolean[],
): number {
  'worklet';
  const { min, max } = reach(from, enabled);
  if (fling > 0) return position <= min ? min : position <= from ? from : max;
  if (fling < 0) return position >= max ? max : position >= from ? from : min;
  const nearer = (a: number, b: number) =>
    Math.abs(position - a) <= Math.abs(position - b) ? a : b;
  return nearer(from, nearer(min, max));
}

/**
 * A release at `pointsPerSecond` toward later pages, in a pager `pageWidth`
 * wide: its `speed` in pages a second, and its `fling` direction (1 or -1 when
 * at least Material's fling speed, else 0) for `landing`. Before layout it has
 * neither.
 */
export function releaseInPages(
  pointsPerSecond: number,
  pageWidth: number,
): { speed: number; fling: number } {
  'worklet';
  if (pageWidth <= 0) return { speed: 0, fling: 0 };
  const flung = Math.abs(pointsPerSecond) >= gestureConventions.flingVelocity;
  return { speed: pointsPerSecond / pageWidth, fling: flung ? Math.sign(pointsPerSecond) : 0 };
}

/**
 * How much page `at` of `count` is the shown one, with the pages at
 * `position`: 1 on that page, falling to 0 a page away, so between two pages
 * they share it. Past the first or last page (a drag held against an end)
 * the end page keeps it whole. A page not among them (`at` -1) has none.
 */
export function pageShare(position: number, at: number, count: number): number {
  'worklet';
  if (at < 0) return 0;
  const clamped = Math.min(Math.max(position, 0), count - 1);
  return Math.max(0, 1 - Math.abs(clamped - at));
}
