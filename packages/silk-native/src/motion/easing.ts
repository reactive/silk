import {
  type CSSTransitionTimingFunction,
  cubicBezier,
  Easing,
  type EasingFunction as TimingEasingFunction,
  type EasingFunctionFactory,
  linear,
  steps,
} from 'react-native-reanimated';

const easings = new Map<string, CSSTransitionTimingFunction>();

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

/** A CSS easing function's name and trimmed arguments (`cubic-bezier(…)`); none for a keyword. */
function parseEasing(css: string): { readonly name: string; readonly args: readonly string[] } {
  const [, name = '', args = ''] = /^([a-z-]+)\((.*)\)$/.exec(css) ?? [];
  return { name, args: args.split(',').map((arg) => arg.trim()) };
}

/** The CSS easing keywords, as the functions CSS defines them as, which `timingEasing` parses. */
const keywordFunctions = new Map([
  ['ease', 'cubic-bezier(0.25, 0.1, 0.25, 1)'],
  ['ease-in', 'cubic-bezier(0.42, 0, 1, 1)'],
  ['ease-out', 'cubic-bezier(0, 0, 0.58, 1)'],
  ['ease-in-out', 'cubic-bezier(0.42, 0, 0.58, 1)'],
  ['step-start', 'steps(1, start)'],
  ['step-end', 'steps(1, end)'],
]);

/** Whether a CSS `steps()` position jumps at the start, for the positions Reanimated plays. */
const jumpsAtStart = new Map([
  ['start', true],
  ['jump-start', true],
  ['end', false],
  ['jump-end', false],
]);

/** A CSS number argument, or NaN for anything else (`Number('')` alone would give 0). */
const numberOf = (arg: string | undefined) => (arg ? Number(arg) : Number.NaN);

/** Whether `x` can be a cubic Bézier's x: CSS takes only [0, 1], and Reanimated's throws. */
const inUnit = (x: number) => x >= 0 && x <= 1;

/**
 * A duration token's CSS easing as an easing for Reanimated's `withTiming`,
 * which plays a worklet curve rather than CSS: `cubic-bezier(…)`, the keywords
 * and `steps(n, start | end)` keep their shape; any other curve (a `linear(…)`
 * with stops, `steps` jumping at both ends or neither, a malformed one or one
 * CSS refuses, such as an x outside [0, 1]) plays linearly.
 */
export function timingEasing(css: string): TimingEasingFunction | EasingFunctionFactory {
  const { name, args } = parseEasing(keywordFunctions.get(css) ?? css);
  if (name === 'steps') {
    const count = numberOf(args[0]);
    const roundUp = jumpsAtStart.get(args[1] ?? 'end');
    return Number.isInteger(count) && count > 0 && roundUp !== undefined
      ? Easing.steps(count, roundUp)
      : Easing.linear;
  }
  if (name !== 'cubic-bezier' || args.length !== 4) return Easing.linear;
  const [x1, y1, x2, y2] = args.map(numberOf) as [number, number, number, number];
  return inUnit(x1) && inUnit(x2) && Number.isFinite(y1) && Number.isFinite(y2)
    ? Easing.bezier(x1, y1, x2, y2)
    : Easing.linear;
}

/**
 * A CSS easing as Reanimated's timing function: it takes the named curves as
 * strings, but `cubic-bezier(…)`, `linear(…)` and `steps(…)` only as its own
 * objects.
 */
export function cssEasing(css: string): CSSTransitionTimingFunction {
  let easing = easings.get(css);
  if (!easing) {
    const { name, args } = parseEasing(css);
    const build = easingFunctions.get(name);
    easing = build ? build(args) : (css as CSSTransitionTimingFunction);
    easings.set(css, easing);
  }
  return easing;
}
