import type { CSSAnimationKeyframes, CSSAnimationProperties } from 'react-native-reanimated';
import { useReducedMotion } from '../styles/useReducedMotion.js';
import { useMotion } from './useMotion.js';

/**
 * A Reanimated `Animated.View` style repeating `keyframes`, one cycle per
 * `loop` motion token (a keyframe's own `animationTimingFunction` wins over the
 * token's easing). Reanimated plays it on the UI thread, the browser as CSS.
 * None until full motion is confirmed.
 */
export function useLoop(keyframes: CSSAnimationKeyframes): CSSAnimationProperties | undefined {
  const { durationMs, easing } = useMotion('loop');
  if (useReducedMotion()) return undefined;
  return {
    animationName: keyframes,
    animationDuration: durationMs,
    animationTimingFunction: easing,
    animationIterationCount: 'infinite',
  };
}
