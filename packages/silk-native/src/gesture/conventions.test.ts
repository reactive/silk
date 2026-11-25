import { expect, test } from '@rstest/core';
import { releaseVelocity, speedToward } from './conventions.js';

test('a drag held still before it lets go lets go with no speed', () => {
  expect(releaseVelocity(1200, 16)).toBe(1200);
  expect(releaseVelocity(1200, 40)).toBe(1200);
  expect(releaseVelocity(1200, 41)).toBe(0);
});

test('settling, a part keeps a speed only when it heads to its target', () => {
  expect(speedToward(1, 0.6, 2)).toBe(2);
  // Short of the next page, still moving on: back without carrying on.
  expect(speedToward(0, 0.3, 0.5)).toBe(0);
  // Past the first page, moving further out.
  expect(speedToward(0, -0.1, -4)).toBe(0);
});
