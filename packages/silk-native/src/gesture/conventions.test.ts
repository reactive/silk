import { expect, test } from '@rstest/core';
import { releaseVelocity } from './conventions.js';

test('a drag held still before it lets go lets go with no speed', () => {
  expect(releaseVelocity(1200, 16)).toBe(1200);
  expect(releaseVelocity(1200, 40)).toBe(1200);
  expect(releaseVelocity(1200, 41)).toBe(0);
});
