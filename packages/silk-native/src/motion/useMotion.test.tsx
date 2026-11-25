import { createTheme, type MotionName, sampleSpring } from '@reactive/silk-core';
import { expect, rs, test } from '@rstest/core';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { setPrefersReducedMotion } from '../../../../test/rstest-setup';
import { SilkProvider } from '../theme/SilkProvider.js';

// Reanimated's `linear()` is its own object: tag it to see what it was built from.
rs.mock('react-native-reanimated', () => ({
  linear: (...points: unknown[]) => ({ linear: points }),
}));

const { springMotion, useMotion } = await import('./useMotion.js');

const theme = createTheme({
  semantic: {
    motion: {
      normal: { durationMs: 200, easing: 'linear(0, 0.5 25%, 1)' },
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

test('a duration token keeps its duration and takes its easing as Reanimated’s object', () => {
  expect(motionOf('normal')).toEqual({
    durationMs: 200,
    easing: { linear: [0, [0.5, '25%'], 1] },
  });
});

test('springMotion plays a spring of one’s own as useMotion plays a theme’s, sampled once', () => {
  const spring = { durationMs: 500, bounce: 0.4 };
  const { settleMs, progress } = sampleSpring(spring);
  expect(springMotion(spring)).toEqual({ durationMs: settleMs, easing: { linear: progress } });
  expect(springMotion(spring)).toBe(springMotion(spring));
});
