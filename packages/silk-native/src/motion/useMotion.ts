import { isSpringName, type MotionName, sampleSpring } from '@reactive/silk-core';
import {
  type CSSTransitionTimingFunction,
  cubicBezier,
  linear,
} from 'react-native-reanimated';
import { useMotionPreference } from '../styles/useReducedMotion.js';
import { useTheme } from '../theme/ThemeProvider.js';

export interface Motion {
  readonly durationMs: number;
  readonly easing: CSSTransitionTimingFunction;
}

const easings = new Map<string, CSSTransitionTimingFunction>();
const springEasings = new WeakMap<readonly number[], CSSTransitionTimingFunction>();

/**
 * A spring's sampled curve as Reanimated's `linear()` easing, built once per
 * curve: `sampleSpring` caches the array, so it keys this cache directly,
 * with no string to build and parse back each render.
 */
function springEasing(progress: readonly number[]): CSSTransitionTimingFunction {
  let easing = springEasings.get(progress);
  if (!easing) {
    easing = linear(...progress);
    springEasings.set(progress, easing);
  }
  return easing;
}

/**
 * A CSS easing as Reanimated's timing function: it takes the named curves as
 * strings, but `cubic-bezier(…)` and `linear(…)` only as its own objects.
 */
function easingOf(css: string): CSSTransitionTimingFunction {
  let easing = easings.get(css);
  if (!easing) {
    const call = /^(cubic-bezier|linear)\((.*)\)$/.exec(css);
    const numbers = call ? call[2]!.split(',').map(Number) : [];
    if (call?.[1] === 'linear') easing = linear(...numbers);
    else if (call) easing = cubicBezier(numbers[0]!, numbers[1]!, numbers[2]!, numbers[3]!);
    else easing = css as CSSTransitionTimingFunction;
    easings.set(css, easing);
  }
  return easing;
}

/**
 * A `motion` token as a duration and an easing for Reanimated's CSS
 * transitions and keyframes, the twin of the web's `--silk-motion-*`
 * variables: `transitionDuration: motion.durationMs`,
 * `transitionTimingFunction: motion.easing`. A spring plays from rest over
 * the time it takes to settle; once reduced motion is confirmed, it takes no
 * time. For a spring that keeps a gesture's speed, use `springTo`.
 */
export function useMotion(name: MotionName): Motion {
  const { motion } = useTheme().theme.semantic;
  const reduced = useMotionPreference() === 'reduced';
  if (isSpringName(name)) {
    const { durationMs, progress } = sampleSpring(motion[name]);
    return { durationMs: reduced ? 0 : durationMs, easing: springEasing(progress) };
  }
  const { durationMs, easing } = motion[name];
  return { durationMs, easing: easingOf(easing) };
}
