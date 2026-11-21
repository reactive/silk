/**
 * A bottom sheet's drag physics, shared by the native sheet's worklets and
 * its tests. Speeds are in points per second, as Gesture Handler reports them.
 */

/** Material's fling threshold: an upward fling at least this fast keeps the sheet open. */
const FLING = 500;
/** A downward flick at least this fast closes the sheet wherever it is. */
const FLICK = 1000;
/** Material's hide friction: how far ahead the release speed throws the sheet, in seconds. */
const HIDE_FRICTION = 0.1;

/** Material 3's default spatial spring stiffness. */
const STIFFNESS = 700;

/**
 * The spring a sheet settles, slides in and slides out on: Material 3's
 * default spatial spring (damping ratio 0.9, stiffness 700), clamped so it
 * never lifts off the bottom edge. The release speed goes in as `velocity`.
 */
export const SHEET_SPRING: {
  readonly stiffness: number;
  readonly damping: number;
  readonly mass: number;
  readonly overshootClamping: boolean;
} = {
  stiffness: STIFFNESS,
  // Damping ratio 0.9: 2 × 0.9 × √(stiffness × mass).
  damping: 2 * 0.9 * Math.sqrt(STIFFNESS),
  mass: 1,
  overshootClamping: true,
};

/**
 * Whether a sheet let go of `offset` points below its rest, moving down at
 * `velocity`, closes: flicked down, or thrown past half its `height`;
 * an upward fling keeps it.
 */
export function releaseCloses(offset: number, velocity: number, height: number): boolean {
  'worklet';
  if (velocity <= -FLING) return false;
  if (velocity >= FLICK) return true;
  return offset + HIDE_FRICTION * velocity > height / 2;
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
