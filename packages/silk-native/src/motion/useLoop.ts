import type { CSSAnimationKeyframes, CSSAnimationProperties } from 'react-native-reanimated';
import { useReducedMotion } from '../styles/useReducedMotion.js';
import { useMotion } from './useMotion.js';

/**
 * `keyframes` repeated for as long as the style is applied, one cycle per
 * `loop` motion token, as a style for a Reanimated `Animated.View`: a CSS
 * animation, which Reanimated plays on the UI thread (and the browser as CSS).
 * None until full motion is confirmed, so the view rests on its own style.
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
