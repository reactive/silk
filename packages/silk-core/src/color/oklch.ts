/**
 * Imports nothing outside this folder, so a web view's bundle can take it alone
 * (`@reactive/silk-core/color`).
 */
import { oklabToRgb } from './oklab.js';
import { formatRgb } from './srgb.js';

/** One color's OKLCH coordinates: lightness 0–1, chroma, hue in degrees. */
export type Oklch = readonly [l: number, c: number, h: number];

/**
 * A color written in OKLCH, whose lightness `l` (0–1) is perceptual: two colors
 * with the same `l` look equally light whatever their chroma `c` (0 or more)
 * and hue `h` (degrees). Returns the sRGB form, `#rrggbb`, or
 * `rgba(r, g, b, alpha)` when `alpha` (0–1) is given, because React Native
 * drops `oklch()` strings. Throws a `RangeError` on input outside those ranges.
 *
 * Write colors inside sRGB: the output for one outside it is unspecified.
 */
export function oklch(l: number, c: number, h: number, alpha?: number): string {
  // Negated, so NaN, which fails every comparison, is rejected too.
  if (
    !(l >= 0 && l <= 1 && c >= 0 && Number.isFinite(c) && Number.isFinite(h)) ||
    (alpha !== undefined && !(alpha >= 0 && alpha <= 1))
  ) {
    const args = alpha === undefined ? [l, c, h] : [l, c, h, alpha];
    throw new RangeError(`oklch(${args.join(', ')}) is out of range`);
  }
  const hue = ((h % 360) * Math.PI) / 180;
  return formatRgb(oklabToRgb([l, c * Math.cos(hue), c * Math.sin(hue)]), alpha);
}
