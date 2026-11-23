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
   * Jump straight to the target: pass Silk's `useMotionPreference() ===
   * 'reduced'`, which can differ from Reanimated's own reading of the system
   * setting on the web.
   */
  readonly reduceMotion: boolean;
  /**
   * Speed to start at (units per second), such as a drag's release speed. Kept
   * even when it points away from the target, so a reversed fling turns
   * around instead of stalling. Default: the speed of whatever animation it
   * replaces on the same value, else 0.
   */
  readonly velocity?: number;
  /**
   * Stop on reaching the target instead of overshooting it: for surfaces held
   * to a screen edge. Started on the target with a speed, it follows the speed
   * out first and stops on the way back.
   */
  readonly overshootClamping?: boolean;
  /** How close to the target (and how slow) it stops. Default 0.25, for a value in pixels. */
  readonly precision?: number;
}

interface SpringToAnimation extends AnimationObject<number> {
  start: SpringState;
  /** The sign of the offset past the target, where a clamped spring stops. */
  overshootSign: number;
  startTime: number;
  velocity: number;
}

/**
 * An animation of a shared value from wherever it is to `target` on a
 * `motion` spring token, run on the UI thread:
 * `offset.set(springTo(0, theme.semantic.motion.smooth, { reduceMotion, velocity }))`.
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
  }: SpringToOptions,
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
        animation.overshootSign = -(Math.sign(from - target) || Math.sign(speed));
        animation.startTime = now;
        animation.velocity = speed;
        animation.current = from;
      },
      onFrame(animation, now) {
        const state = springAt(spring, animation.start, (now - animation.startTime) / 1000);
        const crossed = overshootClamping && Math.sign(state.offset) === animation.overshootSign;
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
      overshootSign: 0,
      startTime: 0,
      velocity: 0,
      callback,
      reduceMotion,
    } as SpringToAnimation;
  }) as unknown as number;
}
