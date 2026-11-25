/**
 * Where a switch's thumb stands under a drag, and the side a release lands
 * on. Positions run from 0 (off) to 1 (on), whichever way the track runs.
 * Pure worklets, so tests run them in Node.
 */

import { gestureConventions } from '../gesture/conventions.js';

/**
 * Where the thumb stands for a drag that caught it at `start` and has since
 * moved it `moved` (in positions, toward on): on the track, never past its
 * ends, since a thumb has nowhere to go beyond them.
 */
export function switchDragPosition(start: number, moved: number): number {
  'worklet';
  return Math.min(1, Math.max(0, start + moved));
}

/**
 * Whether a release at `position`, going `speed` points a second toward on
 * (below 0 toward off), lands on rather than off: a fling lands the way it
 * goes, a slower release on the nearer end.
 */
export function switchLandsOn(position: number, speed: number): boolean {
  'worklet';
  if (Math.abs(speed) >= gestureConventions.flingVelocity) return speed > 0;
  return position >= 0.5;
}
