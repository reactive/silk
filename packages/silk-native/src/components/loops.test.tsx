import { createTheme } from '@reactive/silk-core';
import { beforeEach, expect, rs, test } from '@rstest/core';
import { render } from '@testing-library/react';
import type { JSX } from 'react';
import { AccessibilityInfo, I18nManager, StyleSheet, View, type ViewProps } from 'react-native';
import * as reanimated from 'react-native-reanimated' with { rstest: 'importActual' };
import { setPrefersReducedMotion } from '../../../../test/rstest-setup';
import { resetNativeMotionPreference } from '../styles/useReducedMotion.js';
import { SilkProvider } from '../theme/SilkProvider.js';

/**
 * Reanimated skips CSS animations under test, so its `Animated.View` is stood
 * in for by a View that keeps each style it is given, flattened, to read the
 * animation from. The browser test runner plays them (the docs' `LoadingLoops`
 * story).
 */
const mocked = rs.hoisted(() => ({ styles: [] as Record<string, unknown>[] }));

rs.mock('react-native-reanimated', () => ({
  ...reanimated,
  default: {
    ...reanimated.default,
    View: ({ style, ...props }: ViewProps) => {
      mocked.styles.push(StyleSheet.flatten(style) as Record<string, unknown>);
      return <View {...props} style={style} />;
    },
  },
}));

const { Progress } = await import('./Progress.js');
const { Skeleton } = await import('./Skeleton.js');
const { Spinner } = await import('./Spinner.js');

const theme = createTheme({
  semantic: { motion: { loop: { durationMs: 900, easing: 'linear' } } },
});

/** The style of the last animated view `element` rendered. */
function styleOf(element: JSX.Element): Record<string, unknown> {
  render(<SilkProvider theme={theme}>{element}</SilkProvider>);
  const style = mocked.styles.at(-1);
  if (!style) throw new Error('no animated view rendered');
  return style;
}

/** The translations a sweep plays, from first keyframe to last. */
function sweepOf(style: Record<string, unknown>): unknown[] {
  const keyframes = style.animationName as Record<string, { transform: object[] }>;
  return [keyframes.from, keyframes.to].map(({ transform }) => transform);
}

beforeEach(() => {
  mocked.styles = [];
});

test('Spinner turns once per loop token, forever', () => {
  expect(styleOf(<Spinner />)).toMatchObject({
    animationName: {
      from: { transform: [{ rotate: '0deg' }] },
      to: { transform: [{ rotate: '360deg' }] },
    },
    animationDuration: 900,
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
  });
});

test('Skeleton pulses its opacity once per loop token', () => {
  const style = styleOf(<Skeleton />);
  expect(style.animationDuration).toBe(900);
  expect(style.animationIterationCount).toBe('infinite');
  expect(style.animationName).toMatchObject({
    from: { opacity: 1, animationTimingFunction: 'ease-in-out' },
    '50%': { opacity: 0.55, animationTimingFunction: 'ease-in-out' },
    to: { opacity: 1 },
  });
});

test("a consumer's style that sets an animated property stops that loop, as it comes last", () => {
  expect(styleOf(<Skeleton style={{ opacity: 0.5 }} />)).not.toHaveProperty('animationName');
  expect(styleOf(<Spinner style={{ transform: [{ scale: 2 }] }} />)).not.toHaveProperty(
    'animationName',
  );
  expect(styleOf(<Spinner style={{ margin: 4 }} />)).toHaveProperty('animationName');
});

test('reduced motion leaves every loop still', () => {
  setPrefersReducedMotion(true);
  for (const element of [<Spinner />, <Skeleton />, <Progress />]) {
    expect(styleOf(element)).not.toHaveProperty('animationName');
  }
});

test('on a phone, every loop waits for the OS to answer whether motion is reduced', () => {
  const { matchMedia } = globalThis;
  const { isReduceMotionEnabled } = AccessibilityInfo;
  // @ts-expect-error -- React Native has no matchMedia
  delete globalThis.matchMedia;
  AccessibilityInfo.isReduceMotionEnabled = () => new Promise(() => {});
  resetNativeMotionPreference();
  try {
    for (const element of [<Spinner />, <Skeleton />, <Progress />]) {
      expect(styleOf(element)).not.toHaveProperty('animationName');
    }
  } finally {
    globalThis.matchMedia = matchMedia;
    AccessibilityInfo.isReduceMotionEnabled = isReduceMotionEnabled;
    resetNativeMotionPreference();
  }
});

test('an indeterminate Progress sweeps in from before the track and stops flush with its end', () => {
  const style = styleOf(<Progress />);
  expect(style.width).toBe('40%');
  expect(style.animationIterationCount).toBe('infinite');
  // Percent of the indicator's own width: 150% of 40% is the track's other 60%.
  expect(sweepOf(style)).toEqual([[{ translateX: '-100%' }], [{ translateX: '150%' }]]);
});

test('in an RTL app the sweep starts at the right, where the indicator rests', () => {
  const layout = I18nManager as { isRTL?: boolean };
  const was = layout.isRTL;
  layout.isRTL = true;
  try {
    expect(sweepOf(styleOf(<Progress />))).toEqual([
      [{ translateX: '100%' }],
      [{ translateX: '-150%' }],
    ]);
  } finally {
    layout.isRTL = was;
  }
});

test('a determinate Progress holds still at its value', () => {
  const style = styleOf(<Progress value={30} />);
  expect(style.width).toBe('30%');
  expect(style).not.toHaveProperty('animationName');
});
