import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native';
import type { CSSAnimationKeyframes, CSSAnimationProperties } from 'react-native-reanimated';
import { useReducedMotion } from '../styles/useReducedMotion.js';
import { useTheme } from '../theme/ThemeProvider.js';
import { cssEasing } from './easing.js';

/**
 * A Reanimated `Animated.View` style repeating `keyframes`, one cycle per
 * `loop` motion token (a keyframe's own `animationTimingFunction` wins over the
 * token's easing). Reanimated plays it on the UI thread, the browser as CSS.
 * None until full motion is confirmed, or when the consumer's `style` sets a
 * property the loop animates: a running animation would beat any style, but
 * the consumer's `style` comes last and wins.
 */
export function useLoop(
  keyframes: CSSAnimationKeyframes,
  style?: StyleProp<ViewStyle>,
): CSSAnimationProperties | undefined {
  // The token itself, not `useMotion`, which would bundle the spring sampler into every loop.
  const { durationMs, easing } = useTheme().theme.semantic.motion.loop;
  if (useReducedMotion() || setsAnimated(keyframes, style)) return undefined;
  return {
    animationName: keyframes,
    animationDuration: durationMs,
    animationTimingFunction: cssEasing(easing),
    animationIterationCount: 'infinite',
  };
}

/** Whether `style` gives a value to a property that `keyframes` animates. */
function setsAnimated(keyframes: CSSAnimationKeyframes, style: StyleProp<ViewStyle>): boolean {
  if (!style) return false;
  const given = StyleSheet.flatten(style) as Record<string, unknown>;
  return Object.values(keyframes).some((frame) =>
    Object.keys(frame).some((key) => key !== 'animationTimingFunction' && given[key] !== undefined),
  );
}
