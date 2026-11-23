import { springAt, springAtRest, type Spring, type SpringState } from '@reactive/silk-core';
import {
  type AnimatableValue,
  type AnimationCallback,
  type AnimationObject,
  defineAnimation,
} from 'react-native-reanimated';

/** Pixels: a spring moving things on screen stops once what's left is invisible. */
const SUBPIXEL = 0.25;

export interface SpringToOptions {
  /**
   * Speed to start at (units per second), such as a drag's release speed. Kept
   * even when it points away from the target, so a reversed fling turns
   * around instead of stalling. Default: the speed of whatever animation it
   * replaces on the same value, else 0.
   */
  readonly velocity?: number;
  /** Stop at the target instead of overshooting it: for surfaces held to a screen edge. */
  readonly overshootClamping?: boolean;
  /** How close to the target (and how slow) it stops. Default 0.25, for a value in pixels. */
  readonly precision?: number;
  /** Jump straight to the target. Default: the system's reduce-motion setting. */
  readonly reduceMotion?: boolean;
}

interface SpringToAnimation extends AnimationObject<number> {
  start: SpringState;
  startTime: number;
  velocity: number;
}

/**
 * An animation of a shared value from wherever it is to `target` on a
 * `motion` spring token, run on the UI thread:
 * `offset.set(springTo(0, theme.semantic.motion.smooth, { velocity }))`.
 * Unlike Reanimated's `withSpring`, it keeps a speed that points away from
 * the target, and it plays the token's exact curve (the same one the web
 * plays as a CSS easing), whatever the distance or speed.
 */
export function springTo(
  target: number,
  spring: Spring,
  {
    velocity,
    overshootClamping = false,
    precision = SUBPIXEL,
    reduceMotion,
  }: SpringToOptions = {},
  callback?: AnimationCallback,
): number {
  'worklet';
  return defineAnimation<SpringToAnimation>(target, () => {
    'worklet';
    return {
      onStart(animation, value: AnimatableValue, now, previous) {
        const from = value as number;
        const carried = (previous as { velocity?: unknown } | undefined)?.velocity;
        const speed = velocity ?? (typeof carried === 'number' ? carried : 0);
        animation.start = { offset: from - target, velocity: speed };
        animation.startTime = now;
        animation.velocity = speed;
        animation.current = from;
      },
      onFrame(animation, now) {
        const state = springAt(spring, animation.start, (now - animation.startTime) / 1000);
        const crossed = overshootClamping && state.offset * animation.start.offset < 0;
        if (crossed || springAtRest(state, precision)) {
          animation.current = target;
          animation.velocity = 0;
          return true;
        }
        animation.current = target + state.offset;
        animation.velocity = state.velocity;
        return false;
      },
      toValue: target,
      current: target,
      start: { offset: 0, velocity: 0 },
      startTime: 0,
      velocity: 0,
      callback,
      reduceMotion,
    } as SpringToAnimation;
  }) as unknown as number;
}
