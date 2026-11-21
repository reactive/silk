import { resolveOklch } from '../color/oklch.js';
import {
  blueScaleDarkOklch,
  blueScaleOklch,
  grayScaleDarkOklch,
  grayScaleOklch,
  greenScaleDarkOklch,
  greenScaleOklch,
  redScaleDarkOklch,
  redScaleOklch,
  type OklchScale,
} from './paletteOklch.js';
import type { Palette, PaletteScale, PaletteStep } from './types.js';

/** A scale's OKLCH coordinates resolved to the sRGB hex the theme carries. */
function toScale(source: OklchScale): PaletteScale {
  const scale = {} as Record<PaletteStep, string>;
  source.forEach(([l, c, h], i) => {
    scale[(i + 1) as PaletteStep] = resolveOklch(l, c, h);
  });
  return scale;
}

/** Pure white. Not re-exported from tokens/index.ts (the public /tokens). */
export const white: string = /* @__PURE__ */ resolveOklch(1, 0, 0);

/** Radix-Colors-inspired 12-step gray scale (light-friendly). */
export const grayScale: PaletteScale = /* @__PURE__ */ toScale(grayScaleOklch);
export const blueScale: PaletteScale = /* @__PURE__ */ toScale(blueScaleOklch);
export const redScale: PaletteScale = /* @__PURE__ */ toScale(redScaleOklch);
export const greenScale: PaletteScale = /* @__PURE__ */ toScale(
  greenScaleOklch,
);

export const defaultPalette: Palette = {
  gray: grayScale,
  blue: blueScale,
  red: redScale,
  green: greenScale,
};

/** Dark-scheme palette scales (inverted roles). */
export const grayScaleDark: PaletteScale = /* @__PURE__ */ toScale(
  grayScaleDarkOklch,
);
export const blueScaleDark: PaletteScale = /* @__PURE__ */ toScale(
  blueScaleDarkOklch,
);
export const redScaleDark: PaletteScale = /* @__PURE__ */ toScale(
  redScaleDarkOklch,
);
export const greenScaleDark: PaletteScale = /* @__PURE__ */ toScale(
  greenScaleDarkOklch,
);

export const defaultPaletteDark: Palette = {
  gray: grayScaleDark,
  blue: blueScaleDark,
  red: redScaleDark,
  green: greenScaleDark,
};
