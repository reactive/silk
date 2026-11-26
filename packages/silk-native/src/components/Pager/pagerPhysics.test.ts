import { expect, test } from '@rstest/core';
import { gestureConventions } from '../../gesture/conventions.js';
import {
  dragPosition,
  indicatorWeight,
  landing,
  reach,
  releaseInPages,
} from './pagerPhysics.js';

const all = [true, true, true];

test('a drag reaches the nearest enabled page each side of the page it started on', () => {
  expect(reach(1, all)).toEqual({ min: 0, max: 2 });
  expect(reach(0, all)).toEqual({ min: 0, max: 1 });
  expect(reach(2, all)).toEqual({ min: 1, max: 2 });
  // Past a disabled page.
  expect(reach(0, [true, false, true])).toEqual({ min: 0, max: 2 });
  expect(reach(2, [true, false, true])).toEqual({ min: 0, max: 2 });
  // Only disabled pages that way: it stays.
  expect(reach(0, [true, false, false])).toEqual({ min: 0, max: 0 });
});

test('pages follow the finger inside their reach, and a third of it past', () => {
  expect(dragPosition(0.4, 0, 0, all)).toBe(0.4);
  // Past the first page.
  expect(dragPosition(-0.3, 0, 0, all)).toBeCloseTo(-0.1);
  // Past the last.
  expect(dragPosition(2.6, 2, 2, all)).toBeCloseTo(2.2);
  // Toward only disabled pages.
  expect(dragPosition(0.6, 0, 0, [true, false])).toBeCloseTo(0.2);
});

test('a drag that catches the pages mid-flight starts where they are', () => {
  // Springing from page 0 to page 2, caught at 0.5: outside page 2's reach (1 to 2).
  expect(dragPosition(0.5, 0.5, 2, all)).toBe(0.5);
  expect(dragPosition(0.45, 0.5, 2, all)).toBeCloseTo(0.4833);
});

test('a slow release settles on the nearest page, a fling on the next one its way', () => {
  expect(landing(0.4, 0, 0, all)).toBe(0);
  expect(landing(0.6, 0, 0, all)).toBe(1);
  // 0.2 of the way, flung forward.
  expect(landing(0.2, 1, 0, all)).toBe(1);
  // Flung back from 0.8: home again.
  expect(landing(0.8, -1, 0, all)).toBe(0);
});

test('a release never lands past one page, nor on a disabled one', () => {
  expect(landing(1.9, 1, 1, all)).toBe(2);
  expect(landing(-0.2, -1, 0, all)).toBe(0);
  // A disabled page between: a fling or most of the way lands beyond it, never on it.
  expect(landing(0.7, 1, 0, [true, false, true])).toBe(2);
  expect(landing(0.9, 0, 0, [true, false, true])).toBe(0);
  expect(landing(1.2, 0, 0, [true, false, true])).toBe(2);
  expect(landing(0.7, 1, 0, [true, false, false])).toBe(0);
});

test('a release at fling speed or more is a fling, and its speed is in pages', () => {
  const fling = gestureConventions.flingVelocity;
  expect(releaseInPages(fling, 400)).toEqual({ speed: fling / 400, fling: 1 });
  expect(releaseInPages(-fling, 400)).toEqual({ speed: -fling / 400, fling: -1 });
  expect(releaseInPages(fling - 1, 400)).toEqual({ speed: (fling - 1) / 400, fling: 0 });
  // Before layout there are no pages to measure in.
  expect(releaseInPages(800, 0)).toEqual({ speed: 0, fling: 0 });
});

test("an indicator's dot is the shown page's at its page, shared between two", () => {
  expect(indicatorWeight(1, 1, 3)).toBe(1);
  expect(indicatorWeight(1, 0, 3)).toBe(0);
  expect(indicatorWeight(1.5, 1, 3)).toBe(0.5);
  expect(indicatorWeight(1.5, 2, 3)).toBe(0.5);
  // Held past an end: the end's dot stays whole.
  expect(indicatorWeight(-0.3, 0, 3)).toBe(1);
  expect(indicatorWeight(2.4, 2, 3)).toBe(1);
  // The dots' weights always add to one, so the row keeps its width.
  for (const position of [0, 0.25, 0.7, 1, 1.4, 2]) {
    const total = [0, 1, 2].reduce((sum, at) => sum + indicatorWeight(position, at, 3), 0);
    expect(total).toBeCloseTo(1);
  }
});
