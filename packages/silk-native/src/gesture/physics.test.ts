import { expect, test } from '@rstest/core';
import { dragStep, releaseCloses } from './physics.js';

test('a sheet let go of closes when flicked down or thrown past half its height', () => {
  const height = 500;
  expect(releaseCloses(20, 1200, height)).toBe(true);
  expect(releaseCloses(300, -600, height)).toBe(false);
  expect(releaseCloses(260, 0, height)).toBe(true);
  expect(releaseCloses(100, 300, height)).toBe(false);
});

test('a drag moves the sheet, or scrolls its content, and hands off between them', () => {
  // From the head, with the content scrolled: the sheet moves.
  expect(dragStep(0, 10, false, 40)).toEqual({ offset: 10, pinScroll: false });
  // Inside the scrolled content: the content scrolls.
  expect(dragStep(0, 10, true, 40)).toEqual({ offset: 0, pinScroll: false });
  // Inside the content at its top: the sheet moves, and the content holds still.
  expect(dragStep(0, 10, true, 0)).toEqual({ offset: 10, pinScroll: true });
  // Pushed back up past its rest: it stops there.
  expect(dragStep(6, -10, true, 0)).toEqual({ offset: 0, pinScroll: true });
  // Then up again: the content scrolls.
  expect(dragStep(0, -10, true, 0)).toEqual({ offset: 0, pinScroll: false });
});
