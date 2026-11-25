/**
 * Android's gesture conventions, which a theme doesn't change. Speeds are in
 * points per second, as Gesture Handler reports them.
 */
export const gestureConventions = {
  /** How far a press moves before it is taken as a drag (Android's touch slop). */
  touchSlop: 8,
  /** A fling at least this fast counts as one (Material's fling threshold). */
  flingVelocity: 500,
} as const;

/** Android's and Flutter's velocity trackers: a pointer with no move this long (ms) before it lifts had stopped. */
const STOPPED_AFTER = 40;

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

/**
 * A release's `speed` for a spring from `position` to `target`: kept when it
 * heads there, else 0, so a part settling back (a pager past its last page or
 * short of the next, a switch's thumb flung on past its end) doesn't first
 * carry on the other way.
 */
export function speedToward(target: number, position: number, speed: number): number {
  'worklet';
  return (target - position) * speed > 0 ? speed : 0;
}
