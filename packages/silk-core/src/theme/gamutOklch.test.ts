import { expect, test } from '@rstest/core';
import * as palette from '../tokens/palette.js';
import * as coordinates from '../tokens/paletteOklch.js';
import { hexToOklch, oklchToHexInGamut } from './gamutOklch.js';

test('inside sRGB, the generators agree with oklch() on every built-in color', () => {
  for (const [name, scale] of Object.entries(coordinates)) {
    const resolved = palette[name.replace(/Oklch$/, '') as keyof typeof palette];
    expect(scale.map(([l, c, h]) => oklchToHexInGamut(l, c, h))).toEqual(
      Object.values(resolved),
    );
  }
});

test('oklchToHexInGamut lowers chroma, keeping lightness and hue', () => {
  const { l, c, h } = hexToOklch(oklchToHexInGamut(0.7, 0.3, 150));
  expect(l).toBeCloseTo(0.7, 2);
  expect(h).toBeCloseTo(150, 0);
  expect(c).toBeLessThan(0.3);
});

test('hexToOklch gives an achromatic color hue 0', () => {
  expect(hexToOklch('#808080').h).toBe(0);
});
