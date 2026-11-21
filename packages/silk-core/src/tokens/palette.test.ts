import { expect, test } from '@rstest/core';
import { inGamut } from 'culori';
import * as palette from './palette.js';

// The built-in palettes as they resolve, pinned so a retuned coordinate is a
// deliberate change.
const resolved = {
  grayScale: [
    '#fcfcfc', '#f9f9f9', '#f0f0f0', '#e8e8e8', '#e0e0e0', '#d9d9d9',
    '#cecece', '#bbbbbb', '#8d8d8d', '#838383', '#646464', '#202020',
  ],
  blueScale: [
    '#fbfdff', '#f4faff', '#e6f4fe', '#d5efff', '#c2e5ff', '#acd8fc',
    '#8ec8f6', '#5eb1ef', '#0090ff', '#0588f0', '#0d74ce', '#113264',
  ],
  redScale: [
    '#fffcfc', '#fff7f7', '#feebec', '#ffdbdc', '#ffcdce', '#fdbdbe',
    '#f4a9aa', '#eb8e90', '#e5484d', '#dc3e42', '#ce2c31', '#641723',
  ],
  greenScale: [
    '#fbfefc', '#f4fbf6', '#e6f6eb', '#d6f1df', '#c3e9d0', '#adddc0',
    '#8eceaa', '#5bb98b', '#30a46c', '#2b9a66', '#218358', '#193b2d',
  ],
  grayScaleDark: [
    '#111111', '#191919', '#222222', '#2a2a2a', '#313131', '#3a3a3a',
    '#484848', '#606060', '#6e6e6e', '#7b7b7b', '#b4b4b4', '#eeeeee',
  ],
  blueScaleDark: [
    '#0d1520', '#111927', '#0d2847', '#003362', '#004074', '#104d87',
    '#205d9e', '#2870bd', '#0090ff', '#3b9eff', '#70b8ff', '#c2e6ff',
  ],
  redScaleDark: [
    '#191111', '#201314', '#3b1219', '#500f1c', '#611623', '#72232d',
    '#8c333a', '#b54548', '#e5484d', '#ec5d5e', '#ff9592', '#ffd1d9',
  ],
  greenScaleDark: [
    '#0e1512', '#121b17', '#132d21', '#113b29', '#174933', '#20573e',
    '#28684a', '#2f7c57', '#30a46c', '#33b074', '#3dd68c', '#b1f1cb',
  ],
} as const;

test('the built-in palettes resolve to their pinned sRGB values', () => {
  for (const [name, hexes] of Object.entries(resolved)) {
    expect(Object.values(palette[name as keyof typeof resolved])).toEqual(hexes);
  }
  expect(palette.white).toBe('#ffffff');
});

test('every built-in color is written inside sRGB', () => {
  const inRgb = inGamut('rgb');
  const scales = Object.entries(palette).filter(([name]) =>
    name.endsWith('Oklch'),
  );
  expect(scales.length).toBe(8);
  for (const [name, scale] of scales) {
    for (const [l, c, h] of scale as palette.OklchScale) {
      expect([name, l, c, h, inRgb({ mode: 'oklch', l, c, h })]).toEqual([
        name,
        l,
        c,
        h,
        true,
      ]);
    }
  }
});
