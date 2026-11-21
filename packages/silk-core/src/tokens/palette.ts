import { oklch } from '../color/oklch.js';
import type { Palette, PaletteScale } from './types.js';

/** The light scheme's surface, and the ink on its solid fills. */
export const white: string = oklch(1, 0, 0);

/** Radix-Colors-inspired 12-step gray scale (light-friendly). */
export const grayScale: PaletteScale = {
  1: oklch(0.991, 0, 0),
  2: oklch(0.982, 0, 0),
  3: oklch(0.955, 0, 0),
  4: oklch(0.931, 0, 0),
  5: oklch(0.907, 0, 0),
  6: oklch(0.885, 0, 0),
  7: oklch(0.851, 0, 0),
  8: oklch(0.792, 0, 0),
  9: oklch(0.643, 0, 0),
  10: oklch(0.61, 0, 0),
  11: oklch(0.503, 0, 0),
  12: oklch(0.244, 0, 0),
};

export const blueScale: PaletteScale = {
  1: oklch(0.993, 0.003, 248),
  2: oklch(0.982, 0.009, 243),
  3: oklch(0.96, 0.02, 239),
  4: oklch(0.938, 0.0349, 235),
  5: oklch(0.905, 0.051, 240),
  6: oklch(0.863, 0.068, 243),
  7: oklch(0.81, 0.089, 243),
  8: oklch(0.734, 0.121, 243),
  9: oklch(0.649, 0.193, 251.8),
  10: oklch(0.622, 0.183, 251.7),
  11: oklch(0.556, 0.1622, 252.2),
  12: oklch(0.324, 0.096, 258.8),
};

export const redScale: PaletteScale = {
  1: oklch(0.993, 0.003, 17),
  2: oklch(0.982, 0.0087, 17),
  3: oklch(0.955, 0.021, 14),
  4: oklch(0.922, 0.0399, 16),
  5: oklch(0.892, 0.056, 17),
  6: oklch(0.857, 0.074, 18),
  7: oklch(0.807, 0.089, 18),
  8: oklch(0.744, 0.113, 19),
  9: oklch(0.626, 0.193, 23),
  10: oklch(0.599, 0.195, 24),
  11: oklch(0.557, 0.197, 25.2),
  12: oklch(0.339, 0.109, 17),
};

export const greenScale: PaletteScale = {
  1: oklch(0.994, 0.004, 157),
  2: oklch(0.981, 0.01, 155),
  3: oklch(0.958, 0.022, 156),
  4: oklch(0.934, 0.037, 156),
  5: oklch(0.9, 0.052, 156),
  6: oklch(0.856, 0.064, 158),
  7: oklch(0.798, 0.083, 159),
  8: oklch(0.716, 0.113, 160.3),
  9: oklch(0.641, 0.133, 157.7),
  10: oklch(0.611, 0.1266, 158.2),
  11: oklch(0.543, 0.1116, 159.5),
  12: oklch(0.322, 0.048, 164.5),
};

export const defaultPalette: Palette = {
  gray: grayScale,
  blue: blueScale,
  red: redScale,
  green: greenScale,
};

/** Dark-scheme palette scales (inverted roles). */
export const grayScaleDark: PaletteScale = {
  1: oklch(0.178, 0, 0),
  2: oklch(0.213, 0, 0),
  3: oklch(0.252, 0, 0),
  4: oklch(0.285, 0, 0),
  5: oklch(0.313, 0, 0),
  6: oklch(0.348, 0, 0),
  7: oklch(0.402, 0, 0),
  8: oklch(0.489, 0, 0),
  9: oklch(0.538, 0, 0),
  10: oklch(0.583, 0, 0),
  11: oklch(0.77, 0, 0),
  12: oklch(0.949, 0, 0),
};

export const blueScaleDark: PaletteScale = {
  1: oklch(0.194, 0.025, 256),
  2: oklch(0.213, 0.03, 261),
  3: oklch(0.274, 0.066, 254),
  4: oklch(0.32, 0.097, 252.5),
  5: oklch(0.367, 0.1058, 250.7),
  6: oklch(0.416, 0.113, 252),
  7: oklch(0.474, 0.122, 253),
  8: oklch(0.541, 0.14, 253.2),
  9: oklch(0.649, 0.193, 251.8),
  10: oklch(0.688, 0.169, 251.4),
  11: oklch(0.764, 0.1258, 249.5),
  12: oklch(0.907, 0.051, 238),
};

export const redScaleDark: PaletteScale = {
  1: oklch(0.188, 0.013, 18),
  2: oklch(0.205, 0.022, 14),
  3: oklch(0.251, 0.065, 13),
  4: oklch(0.289, 0.095, 14),
  5: oklch(0.332, 0.107, 15.5),
  6: oklch(0.381, 0.111, 17),
  7: oklch(0.45, 0.121, 19),
  8: oklch(0.544, 0.146, 22),
  9: oklch(0.626, 0.193, 23),
  10: oklch(0.663, 0.177, 23),
  11: oklch(0.78, 0.128, 22),
  12: oklch(0.902, 0.053, 6),
};

export const greenScaleDark: PaletteScale = {
  1: oklch(0.187, 0.012, 167),
  2: oklch(0.212, 0.015, 166),
  3: oklch(0.272, 0.04, 162),
  4: oklch(0.317, 0.057, 162),
  5: oklch(0.365, 0.066, 161),
  6: oklch(0.412, 0.072, 161),
  7: oklch(0.467, 0.082, 160.2),
  8: oklch(0.528, 0.096, 159.4),
  9: oklch(0.641, 0.133, 157.7),
  10: oklch(0.675, 0.141, 157.7),
  11: oklch(0.779, 0.1655, 157.3),
  12: oklch(0.905, 0.083, 158),
};

export const defaultPaletteDark: Palette = {
  gray: grayScaleDark,
  blue: blueScaleDark,
  red: redScaleDark,
  green: greenScaleDark,
};
