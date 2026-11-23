import { expect, test } from '@rstest/core';
import { dragStep, pressIn, releaseCloses } from './sheetPhysics.js';

test('a sheet let go of closes when flicked down or thrown past half its height', () => {
  const height = 500;
  expect(releaseCloses(20, 1200, height, 0)).toBe(true);
  expect(releaseCloses(300, -600, height, 0)).toBe(false);
  expect(releaseCloses(260, 0, height, 0)).toBe(true);
  expect(releaseCloses(100, 300, height, 0)).toBe(false);
  // Caught at 400 as it opened and pushed up to 350: kept, though past half.
  expect(releaseCloses(350, -200, height, 400)).toBe(false);
  // Caught at 200 as it settled and pulled down to 400: closes.
  expect(releaseCloses(400, 0, height, 200)).toBe(true);
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

test('a press is in the scroll view only within its box, across as well as down', () => {
  const box = { pageX: 40, pageY: 100, width: 200, height: 300 };
  expect(pressIn(box, 100, 200)).toBe(true);
  // Beside a narrower scroll view, within its height: outside.
  expect(pressIn(box, 20, 200)).toBe(false);
  expect(pressIn(box, 260, 200)).toBe(false);
  expect(pressIn(box, 100, 90)).toBe(false);
  expect(pressIn(null, 100, 200)).toBe(false);
});
