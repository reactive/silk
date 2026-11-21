import { expect, test } from '@rstest/core';
import { mixOklab, oklabToRgb, rgbToOklab } from './oklab.js';

test('OKLab conversions round-trip sRGB', () => {
  for (const rgb of [
    [0, 144, 255],
    [229, 72, 77],
    [32, 32, 32],
  ] as const) {
    expect(oklabToRgb(rgbToOklab(rgb))).toEqual(rgb);
  }
});

test('mixOklab weights its second color by amount', () => {
  const black = rgbToOklab([0, 0, 0]);
  const white = rgbToOklab([255, 255, 255]);
  expect(mixOklab(black, white, 0)).toEqual(black);
  expect(mixOklab(black, white, 1)).toEqual(white);
  expect(mixOklab(black, white, 0.5)[0]).toBeCloseTo(0.5, 6);
});
