import { createTheme, type MotionName, sampleSpring } from '@reactive/silk-core';
import { expect, rs, test } from '@rstest/core';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { setPrefersReducedMotion } from '../../../../test/rstest-setup';
import { SilkProvider } from '../theme/SilkProvider.js';

// Reanimated's easings are its own objects: tag them to see which one was built, from what.
rs.mock('react-native-reanimated', () => ({
  linear: (...points: unknown[]) => ({ linear: points }),
  cubicBezier: (...points: number[]) => ({ cubicBezier: points }),
  steps: (...args: unknown[]) => ({ steps: args }),
  Easing: {
    linear: 'Easing.linear',
    bezier: (...points: number[]) => ({ bezier: points }),
    steps: (...args: unknown[]) => ({ easingSteps: args }),
  },
}));

const { timingEasing } = await import('./easing.js');
const { useMotion } = await import('./useMotion.js');

const theme = createTheme({
  semantic: {
    motion: {
      fast: { durationMs: 120, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
      normal: { durationMs: 200, easing: 'linear(0, 0.5 25%, 1)' },
      slow: { durationMs: 400, easing: 'ease-out' },
      loop: { durationMs: 1200, easing: 'steps(4, jump-start)' },
    },
  },
});

function wrapper({ children }: { children: ReactNode }) {
  return <SilkProvider theme={theme}>{children}</SilkProvider>;
}

const motionOf = (name: MotionName) =>
  renderHook(() => useMotion(name), { wrapper }).result.current;

test('a spring plays its sampled curve over its settle time', () => {
  const { settleMs, progress } = sampleSpring(theme.semantic.motion.snappy);
  expect(motionOf('snappy')).toEqual({ durationMs: settleMs, easing: { linear: progress } });
});

test('reduced motion takes a spring no time', () => {
  setPrefersReducedMotion(true);
  expect(motionOf('smooth').durationMs).toBe(0);
});

test('a cubic-bezier easing becomes Reanimated’s object; a named one stays a string', () => {
  expect(motionOf('fast')).toEqual({
    durationMs: 120,
    easing: { cubicBezier: [0.2, 0, 0, 1] },
  });
  expect(motionOf('slow')).toEqual({ durationMs: 400, easing: 'ease-out' });
});

test('a steps() easing becomes Reanimated’s object, with its modifier or Reanimated’s default', () => {
  expect(motionOf('loop').easing).toEqual({ steps: [4, 'jump-start'] });
  const plain = createTheme({ semantic: { motion: { loop: { durationMs: 1200, easing: 'steps(4)' } } } });
  const { result } = renderHook(() => useMotion('loop'), {
    wrapper: ({ children }) => <SilkProvider theme={plain}>{children}</SilkProvider>,
  });
  expect(result.current.easing).toEqual({ steps: [4, undefined] });
});

test('a linear() easing keeps its positioned stops', () => {
  expect(motionOf('normal').easing).toEqual({ linear: [0, [0.5, '25%'], 1] });
});

test("timingEasing plays a token's Bezier, keyword or steps curve, and any other linearly", () => {
  expect(timingEasing('cubic-bezier(0.2, 0, 0, 1)')).toEqual({ bezier: [0.2, 0, 0, 1] });
  expect(timingEasing('ease')).toEqual({ bezier: [0.25, 0.1, 0.25, 1] });
  expect(timingEasing('ease-in')).toEqual({ bezier: [0.42, 0, 1, 1] });
  expect(timingEasing('ease-out')).toEqual({ bezier: [0, 0, 0.58, 1] });
  expect(timingEasing('ease-in-out')).toEqual({ bezier: [0.42, 0, 0.58, 1] });
  expect(timingEasing('steps(4, start)')).toEqual({ easingSteps: [4, true] });
  expect(timingEasing('steps(4)')).toEqual({ easingSteps: [4, false] });
  expect(timingEasing('linear')).toBe('Easing.linear');
  expect(timingEasing('linear(0, 0.5 20%, 1)')).toBe('Easing.linear');
  expect(timingEasing('steps(4, jump-both)')).toBe('Easing.linear');
  // malformed: falls back rather than handing Reanimated NaN
  expect(timingEasing('cubic-bezier(0.2, 0, 0, x)')).toBe('Easing.linear');
  expect(timingEasing('cubic-bezier(0.2, 0, 0)')).toBe('Easing.linear');
  expect(timingEasing('cubic-bezier(0.2, , 0, 1)')).toBe('Easing.linear');
  // CSS refuses an x outside [0, 1], and Reanimated's bezier throws on one.
  expect(timingEasing('cubic-bezier(1.5, 0, 0.5, 1)')).toBe('Easing.linear');
  expect(timingEasing('step-start')).toEqual({ easingSteps: [1, true] });
  expect(timingEasing('step-end')).toEqual({ easingSteps: [1, false] });
});
