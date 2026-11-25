import { expect, test } from '@rstest/core';
import { gestureConventions } from '../gesture/conventions.js';
import { switchDragPosition, switchLandsOn } from './switchPhysics.js';

test('a dragged thumb follows the finger along the track, and stops at its ends', () => {
  expect(switchDragPosition(0, 0.3)).toBeCloseTo(0.3);
  expect(switchDragPosition(1, -0.4)).toBeCloseTo(0.6);
  expect(switchDragPosition(0.2, 2)).toBe(1);
  expect(switchDragPosition(0.8, -2)).toBe(0);
});

test('a slow release lands on the nearer end; a fling, the way it goes', () => {
  const fling = gestureConventions.flingVelocity;
  expect(switchLandsOn(0.49, 0)).toBe(false);
  expect(switchLandsOn(0.5, 0)).toBe(true);
  expect(switchLandsOn(0.2, fling - 1)).toBe(false);
  expect(switchLandsOn(0.2, fling)).toBe(true);
  expect(switchLandsOn(0.9, -fling)).toBe(false);
});
