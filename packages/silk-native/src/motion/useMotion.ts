import { isSpringName, type MotionName, sampleSpring, type Spring } from '@reactive/silk-core';
import {
  type CSSTransitionTimingFunction,
  cubicBezier,
  Easing,
  type EasingFunction as TimingEasingFunction,
  type EasingFunctionFactory,
  linear,
  steps,
} from 'react-native-reanimated';
import { useMotionPreference } from '../styles/useReducedMotion.js';
import { useTheme } from '../theme/ThemeProvider.js';

export interface Motion {
  readonly durationMs: number;
  readonly easing: CSSTransitionTimingFunction;
}

const easings = new Map<string, CSSTransitionTimingFunction>();
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

type LinearStop = Parameters<typeof linear>[number];

/** One `linear()` stop: an output, optionally with its input positions (`0.5 25%`). */
function linearStop(stop: string): LinearStop {
  const [output, ...positions] = stop.split(/\s+/);
  return positions.length
    ? ([Number(output), ...positions] as LinearStop)
    : Number(output);
}

type StepsModifier = Parameters<typeof steps>[1];

type EasingFunction = (args: readonly string[]) => CSSTransitionTimingFunction;

/** Reanimated's object for each CSS easing function, from its arguments. */
const easingFunctions = new Map<string, EasingFunction>([
  [
    'cubic-bezier',
    ([x1, y1, x2, y2]) => cubicBezier(Number(x1), Number(y1), Number(x2), Number(y2)),
  ],
  ['linear', (stops) => linear(...stops.map(linearStop))],
  ['steps', ([count, modifier]) => steps(Number(count), modifier as StepsModifier)],
]);

/** A CSS easing function's name and trimmed arguments (`cubic-bezier(…)`), or none for a keyword. */
function parseEasing(css: string): { readonly name: string; readonly args: readonly string[] } {
  const [, name = '', args = ''] = /^([a-z-]+)\((.*)\)$/.exec(css) ?? [];
  return { name, args: args.split(',').map((arg) => arg.trim()) };
}

/** The CSS easings named by keyword, as the cubic Béziers CSS defines them. */
const keywordBeziers = new Map<string, readonly [number, number, number, number]>([
  ['ease', [0.25, 0.1, 0.25, 1]],
  ['ease-in', [0.42, 0, 1, 1]],
  ['ease-out', [0, 0, 0.58, 1]],
  ['ease-in-out', [0.42, 0, 0.58, 1]],
]);

/** Whether a CSS `steps()` position jumps at the start, for the positions Reanimated plays. */
const jumpsAtStart = new Map([
  ['start', true],
  ['jump-start', true],
  ['end', false],
  ['jump-end', false],
]);

/**
 * A duration token's CSS easing as an easing for Reanimated's `withTiming`,
 * which plays a worklet curve rather than CSS: `cubic-bezier(…)`, the keyword
 * curves and `steps(n, start | end)` keep their shape; any other curve (a
 * `linear(…)` with stops, `steps` jumping at both ends or neither, a
 * malformed one) plays linearly.
 */
export function timingEasing(css: string): TimingEasingFunction | EasingFunctionFactory {
  const { name, args } = parseEasing(css);
  if (name === 'steps') {
    const count = Number(args[0]);
    const roundUp = jumpsAtStart.get(args[1] ?? 'end');
    return Number.isInteger(count) && count > 0 && roundUp !== undefined
      ? Easing.steps(count, roundUp)
      : Easing.linear;
  }
  const points = name === 'cubic-bezier' ? args.map(Number) : keywordBeziers.get(css);
  const [x1, y1, x2, y2] = points?.length === 4 && points.every(Number.isFinite) ? points : [];
  return x1 === undefined || y1 === undefined || x2 === undefined || y2 === undefined
    ? Easing.linear
    : Easing.bezier(x1, y1, x2, y2);
}

/**
 * A CSS easing as Reanimated's timing function: it takes the named curves as
 * strings, but `cubic-bezier(…)`, `linear(…)` and `steps(…)` only as its own
 * objects.
 */
function easingOf(css: string): CSSTransitionTimingFunction {
  let easing = easings.get(css);
  if (!easing) {
    const { name, args } = parseEasing(css);
    const build = easingFunctions.get(name);
    easing = build ? build(args) : (css as CSSTransitionTimingFunction);
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
    const spring = springMotion(motion[name]);
    return reduced ? { ...spring, durationMs: 0 } : spring;
  }
  const { durationMs, easing } = motion[name];
  return { durationMs, easing: easingOf(easing) };
}
