import { springAt, springAtRest, type Spring, type SpringState } from '@reactive/silk-core';
import {
  type AnimatableValue,
  type AnimationCallback,
  type AnimationObject,
  defineAnimation,
} from 'react-native-reanimated';

import { SUBPIXEL } from './subpixel.js';

export interface SpringToOptions {
  /**
   * Jump straight to the target: pass Silk's `useMotionPreference() ===
   * 'reduced'`, which can differ from Reanimated's own reading of the system
   * setting on the web.
   */
  readonly reduceMotion: boolean;
  /**
   * Speed to start at (units per second), such as a drag's release speed.
   * Default: the speed of whatever animation it replaces on the same value,
   * else 0. `speedAway` says whether one pointing away from the target is kept.
   */
  readonly velocity?: number;
  /**
   * A starting speed (given or carried) that points away from the target:
   * `'keep'` it, so a reversed fling turns around, or `'drop'` it, so the
   * spring starts from rest. With `overshootClamping`, `'drop'` keeps the
   * value between where it starts and the target: for parts with hard ends,
   * such as a switch's or a slider's thumb.
   * @default 'keep'
   */
  readonly speedAway?: 'keep' | 'drop' | undefined;
  /**
   * Stop on reaching the target instead of overshooting it: for surfaces held
   * to a screen edge. Started on the target with a speed, it follows the speed
   * out first and stops on the way back (unless `speedAway` is `'drop'`).
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
 * A `speed` (a release's, or a running spring's) for a spring from
 * `position` to `target`: kept when it heads there, else 0, so a part
 * settling back (a pager past its last page or short of the next, a switch's
 * thumb flung on past its end) doesn't first carry on the other way.
 * Declared above `springTo`, whose worklet calls it: the worklets plugin
 * turns a worklet function declaration into a constant, which isn't hoisted.
 */
function speedToward(target: number, position: number, speed: number): number {
  'worklet';
  return (target - position) * speed > 0 ? speed : 0;
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
  { velocity, speedAway, overshootClamping = false, precision, reduceMotion }: SpringToOptions,
  callback?: AnimationCallback,
): number {
  'worklet';
  // Not a parameter default: on the UI thread a worklet's captured constants
  // are bound in its body, after its defaults run.
  const stopWithin = precision ?? SUBPIXEL;
  return defineAnimation<SpringToAnimation>(target, () => {
    'worklet';
    return {
      onStart(animation, value: AnimatableValue, now, previous) {
        const from = value as number;
        const carried = (previous as { velocity?: unknown } | undefined)?.velocity;
        const given = velocity ?? (typeof carried === 'number' ? carried : 0);
        const speed = speedAway === 'drop' ? speedToward(target, from, given) : given;
        animation.start = { offset: from - target, velocity: speed };
        animation.overshootSign = -(Math.sign(from - target) || Math.sign(speed));
        animation.startTime = now;
        animation.velocity = speed;
        animation.current = from;
      },
      onFrame(animation, now) {
        const state = springAt(spring, animation.start, (now - animation.startTime) / 1000);
        const crossed = overshootClamping && Math.sign(state.offset) === animation.overshootSign;
        if (crossed || springAtRest(state, stopWithin)) {
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

/**
 * How fast `value`'s last `springTo` moves now (units per second; 0 once it
 * has finished), or undefined when none ran or one was canceled: read it
 * before a write that stops the spring, to start the next one at that speed.
 * Reanimated keeps a value's animation on `_animation`, on the UI thread,
 * after it ends too.
 */
export function springSpeed(value: { readonly value: number }): number | undefined {
  'worklet';
  const running = (value as { readonly _animation?: { readonly velocity?: unknown } | null })
    ._animation;
  return typeof running?.velocity === 'number' ? running.velocity : undefined;
}
