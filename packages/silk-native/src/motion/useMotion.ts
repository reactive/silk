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
 * curve: `sampleSpring` returns the same array for a spring, so it is the key.
 */
function springEasing(progress: readonly number[]): CSSTransitionTimingFunction {
  let easing = springEasings.get(progress);
  if (!easing) {
    easing = linear(...progress);
    springEasings.set(progress, easing);
  }
  return easing;
}

type LinearStop = Parameters<typeof linear>[number];

/** One `linear()` stop: an output, optionally with its input positions (`0.5 25%`). */
function linearStop(stop: string): LinearStop {
  const [output, ...positions] = stop.split(/\s+/);
  return positions.length
    ? ([Number(output), ...positions] as LinearStop)
    : Number(output);
}

/**
 * A CSS easing as Reanimated's timing function: it takes the named curves as
 * strings, but `cubic-bezier(…)` and `linear(…)` only as its own objects.
 */
function easingOf(css: string): CSSTransitionTimingFunction {
  let easing = easings.get(css);
  if (!easing) {
    const call = /^(cubic-bezier|linear)\((.*)\)$/.exec(css);
    const args = call ? call[2]!.split(',').map((arg) => arg.trim()) : [];
    if (call?.[1] === 'linear') easing = linear(...args.map(linearStop));
    else if (call) {
      const [x1, y1, x2, y2] = args.map(Number);
      easing = cubicBezier(x1!, y1!, x2!, y2!);
    } else easing = css as CSSTransitionTimingFunction;
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
