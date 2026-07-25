import type { Palette, PaletteScale } from './types.js';

/** Radix-Colors-inspired 12-step gray scale (light-friendly). */
export const grayScale: PaletteScale = {
  1: '#fcfcfc',
  2: '#f9f9f9',
  3: '#f0f0f0',
  4: '#e8e8e8',
  5: '#e0e0e0',
  6: '#d9d9d9',
  7: '#cecece',
  8: '#bbbbbb',
  9: '#8d8d8d',
  10: '#838383',
  11: '#646464',
  12: '#202020',
};

export const blueScale: PaletteScale = {
  1: '#fbfdff',
  2: '#f4faff',
  3: '#e6f4fe',
  4: '#d5efff',
  5: '#c2e5ff',
  6: '#acd8fc',
  7: '#8ec8f6',
  8: '#5eb1ef',
  9: '#0090ff',
  10: '#0588f0',
  11: '#0d74ce',
  12: '#113264',
};

export const redScale: PaletteScale = {
  1: '#fffcfc',
  2: '#fff7f7',
  3: '#feebec',
  4: '#ffdbdc',
  5: '#ffcdce',
  6: '#fdbdbe',
  7: '#f4a9aa',
  8: '#eb8e90',
  9: '#e5484d',
  10: '#dc3e42',
  11: '#ce2c31',
  12: '#641723',
};

export const greenScale: PaletteScale = {
  1: '#fbfefc',
  2: '#f4fbf6',
  3: '#e6f6eb',
  4: '#d6f1df',
  5: '#c3e9d0',
  6: '#adddc0',
  7: '#8eceaa',
  8: '#5bb98b',
  9: '#30a46c',
  10: '#2b9a66',
  11: '#218358',
  12: '#193b2d',
};

export const defaultPalette: Palette = {
  gray: grayScale,
  blue: blueScale,
  red: redScale,
  green: greenScale,
};

/** Dark-scheme palette scales (inverted roles). */
export const grayScaleDark: PaletteScale = {
  1: '#111111',
  2: '#191919',
  3: '#222222',
  4: '#2a2a2a',
  5: '#313131',
  6: '#3a3a3a',
  7: '#484848',
  8: '#606060',
  9: '#6e6e6e',
  10: '#7b7b7b',
  11: '#b4b4b4',
  12: '#eeeeee',
};

export const blueScaleDark: PaletteScale = {
  1: '#0d1520',
  2: '#111927',
  3: '#0d2847',
  4: '#003362',
  5: '#004074',
  6: '#104d87',
  7: '#205d9e',
  8: '#2870bd',
  9: '#0090ff',
  10: '#3b9eff',
  11: '#70b8ff',
  12: '#c2e6ff',
};

export const redScaleDark: PaletteScale = {
  1: '#191111',
  2: '#201314',
  3: '#3b1219',
  4: '#500f1c',
  5: '#611623',
  6: '#72232d',
  7: '#8c333a',
  8: '#b54548',
  9: '#e5484d',
  10: '#ec5d5e',
  11: '#ff9592',
  12: '#ffd1d9',
};

export const greenScaleDark: PaletteScale = {
  1: '#0e1512',
  2: '#121b17',
  3: '#132d21',
  4: '#113b29',
  5: '#174933',
  6: '#20573e',
  7: '#28684a',
  8: '#2f7c57',
  9: '#30a46c',
  10: '#33b074',
  11: '#3dd68c',
  12: '#b1f1cb',
};

export const defaultPaletteDark: Palette = {
  gray: grayScaleDark,
  blue: blueScaleDark,
  red: redScaleDark,
  green: greenScaleDark,
};
