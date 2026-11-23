/**
 * A bottom sheet's drag physics and press geometry, shared by the native
 * sheet's worklets and its tests. Speeds are in points per second, as Gesture
 * Handler reports them.
 */
import type { MeasuredDimensions } from 'react-native-reanimated';

/**
 * Android's gesture conventions, which a theme doesn't change. Speeds are in
 * points per second, as Gesture Handler reports them.
 */
export const gestureThresholds = {
  /** How far a press moves before it is taken as a drag (Android's touch slop). */
  touchSlop: 8,
  /** A fling at least this fast counts as one (Material's fling threshold). */
  flingVelocity: 500,
  /** A flick at least this fast closes a sheet wherever it is. */
  flickVelocity: 1000,
  /** How far ahead the release speed throws a surface, in seconds (Material's hide friction). */
  throwSeconds: 0.1,
} as const;

/** Android's and Flutter's velocity trackers: a pointer with no move this long (ms) before it lifts had stopped. */
const STOPPED_AFTER = 40;

/**
 * Whether a sheet let go of `offset` points below its rest, moving down at
 * `velocity`, closes: flicked down, or thrown past half its `height`; an
 * upward fling keeps it, and so does a drag that ends no lower than where it
 * caught the sheet (`caughtAt`; 0 at rest), such as one that caught it as it
 * opened and pushed it up.
 */
export function releaseCloses(
  offset: number,
  velocity: number,
  height: number,
  caughtAt: number,
): boolean {
  'worklet';
  if (velocity <= -gestureThresholds.flingVelocity) return false;
  if (velocity >= gestureThresholds.flickVelocity) return true;
  if (offset <= caughtAt) return false;
  return offset + gestureThresholds.throwSeconds * velocity > height / 2;
}

/**
 * The speed a drag lets go at: Gesture Handler's `velocity`, or none when it
 * last moved (or started) more than 40 ms before the release. A finger held
 * still may send no moves, and Gesture Handler then still reports the speed
 * of its last. Gesture Handler's events carry no time, so the caller times
 * them as they run on the UI thread: a hitch over 40 ms just before a
 * release also drops its speed.
 */
export function releaseVelocity(velocity: number, msSinceLastMove: number): number {
  'worklet';
  return msSinceLastMove > STOPPED_AFTER ? 0 : velocity;
}

export interface DragStep {
  /** The sheet's offset below its rest after this move. */
  readonly offset: number;
  /** Whether the sheet's scroll view is held at its top, since the sheet moved instead. */
  readonly pinScroll: boolean;
}

/**
 * One move of a drag by `changeY` points (down is positive). The sheet moves
 * once it is off its rest, or when the press began outside its scroll view
 * (`inScroll` false) or the content is at its top (`scrollY` 0) and the move
 * is down; otherwise the content scrolls. So one continuous drag can scroll
 * the content up to its top, pull the sheet down, push it back and scroll on.
 */
export function dragStep(
  offset: number,
  changeY: number,
  inScroll: boolean,
  scrollY: number,
): DragStep {
  'worklet';
  const sheetMoves = offset > 0 || ((!inScroll || scrollY <= 0) && changeY > 0);
  if (!sheetMoves) return { offset, pinScroll: false };
  return { offset: Math.max(0, offset + changeY), pinScroll: inScroll };
}

/** Whether a press at (`x`, `y`) on the page lands in `box` (none: no view). */
export function pressIn(
  box: Pick<MeasuredDimensions, 'pageX' | 'pageY' | 'width' | 'height'> | null,
  x: number,
  y: number,
): boolean {
  'worklet';
  return (
    box !== null &&
    x >= box.pageX &&
    x <= box.pageX + box.width &&
    y >= box.pageY &&
    y <= box.pageY + box.height
  );
}
