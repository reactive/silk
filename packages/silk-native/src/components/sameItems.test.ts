import { expect, test } from '@rstest/core';
import { sameItems } from './sameItems.js';

test('sameItems matches the same items in the same order, NaN included', () => {
  expect(sameItems([1, 2], [1, 2])).toBe(true);
  expect(sameItems([NaN], [NaN])).toBe(true);
  expect(sameItems([1, 2], [2, 1])).toBe(false);
  expect(sameItems([1], [1, 1])).toBe(false);
});
