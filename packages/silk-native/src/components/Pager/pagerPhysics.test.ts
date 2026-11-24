import { expect, test } from '@rstest/core';
import { dragPosition, landing, reach } from './pagerPhysics.js';

const all = [true, true, true];

test('a drag reaches the enabled neighbours of the page it started on', () => {
  expect(reach(1, all)).toEqual({ min: 0, max: 2 });
  expect(reach(0, all)).toEqual({ min: 0, max: 1 });
  expect(reach(2, all)).toEqual({ min: 1, max: 2 });
  // A disabled neighbour stops it.
  expect(reach(0, [true, false, true])).toEqual({ min: 0, max: 0 });
});

test('pages follow the finger inside their reach, and a third of it past', () => {
  expect(dragPosition(0.4, 0, all)).toBe(0.4);
  // Past the first page.
  expect(dragPosition(-0.3, 0, all)).toBeCloseTo(-0.1);
  // Past the last.
  expect(dragPosition(2.6, 2, all)).toBeCloseTo(2.2);
  // Toward a disabled page.
  expect(dragPosition(0.6, 0, [true, false])).toBeCloseTo(0.2);
});

test('a slow release settles on the nearest page, a fling on the next one its way', () => {
  const width = 400;
  expect(landing(0.4, 0, width, 0, all)).toBe(0);
  expect(landing(0.6, 0, width, 0, all)).toBe(1);
  // 0.2 of the way, flung forward at 2 pages/s (800 pt/s, past 500).
  expect(landing(0.2, 2, width, 0, all)).toBe(1);
  // Flung back from 0.8: home again.
  expect(landing(0.8, -2, width, 0, all)).toBe(0);
  // Too slow to fling (1 page/s is 400 pt/s).
  expect(landing(0.2, 1, width, 0, all)).toBe(0);
});

test('a release never lands past one page, nor on a disabled one', () => {
  expect(landing(1.9, 5, 400, 1, all)).toBe(2);
  expect(landing(-0.2, -3, 400, 0, all)).toBe(0);
  expect(landing(0.7, 3, 400, 0, [true, false, true])).toBe(0);
});
