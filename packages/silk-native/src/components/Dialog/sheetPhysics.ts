/**
 * A bottom sheet's drag physics and press geometry, shared by the native
 * sheet's worklets and its tests. Speeds are in points per second, as Gesture
 * Handler reports them.
 */
import type { MeasuredDimensions } from 'react-native-reanimated';
import { gestureConventions } from '../../gesture/conventions.js';

/** A flick at least this fast (points per second) closes a sheet wherever it is. */
const FLICK_VELOCITY = 1000;
/** How far ahead the release speed throws the sheet, in seconds (Material's hide friction). */
const THROW_SECONDS = 0.1;

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
  if (velocity <= -gestureConventions.flingVelocity) return false;
  if (velocity >= FLICK_VELOCITY) return true;
  if (offset <= caughtAt) return false;
  return offset + THROW_SECONDS * velocity > height / 2;
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
