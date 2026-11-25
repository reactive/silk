import { expect, rs, test } from '@rstest/core';

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
