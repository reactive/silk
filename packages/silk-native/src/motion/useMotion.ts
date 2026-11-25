import { isSpringName, type MotionName, sampleSpring, type Spring } from '@reactive/silk-core';
import { type CSSTransitionTimingFunction, linear } from 'react-native-reanimated';
import { useMotionPreference } from '../styles/useReducedMotion.js';
import { useTheme } from '../theme/ThemeProvider.js';
import { cssEasing } from './easing.js';

export interface Motion {
  readonly durationMs: number;
  readonly easing: CSSTransitionTimingFunction;
}

const springMotions = new WeakMap<Spring, Motion>();

/**
 * A spring played from rest, as the time it takes to settle and Reanimated's
 * `linear()` easing: sampled once per token, which a theme keeps.
 */
function springMotion(spring: Spring): Motion {
  let motion = springMotions.get(spring);
  if (!motion) {
    const { settleMs, progress } = sampleSpring(spring);
    motion = { durationMs: settleMs, easing: linear(...progress) };
    springMotions.set(spring, motion);
  }
  return motion;
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
    const spring = springMotion(motion[name]);
    return reduced ? { ...spring, durationMs: 0 } : spring;
  }
  const { durationMs, easing } = motion[name];
  return { durationMs, easing: cssEasing(easing) };
}
