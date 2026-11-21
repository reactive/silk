// The generators' OKLCH math, and the only module that imports culori, so
// createTheme never pulls it in. Unlike color/oklch.ts, which clips each sRGB
// channel, this maps a color outside sRGB into it by lowering chroma, keeping
// lightness and hue.
import { clampChroma, formatHex, oklch as parseOklch } from 'culori';
import type { Oklch } from '../color/oklch.js';
import { contrastRatio } from './colorMath.js';

/** `#rrggbb` for an OKLCH color, lowering chroma until it fits sRGB. */
export function oklchToHexInGamut([l, c, h]: Oklch): string {
  const hex = formatHex(clampChroma({ mode: 'oklch', l, c, h }, 'oklch'));
  if (!hex) {
    throw new Error(`Failed to serialize oklch(${l}, ${c}, ${h}) to hex`);
  }
  return hex.toLowerCase();
}

/** A hex color in OKLCH; an achromatic color has hue 0. */
export function hexToOklch(hex: string): Oklch {
  const color = parseOklch(hex);
  if (!color) {
    throw new Error(`Unable to parse color: ${hex}`);
  }
  return [color.l, color.c ?? 0, color.h ?? 0];
}

/** `hex` moved to lightness `l`, keeping its chroma and hue. */
export function withLightness(hex: string, l: number): string {
  const [, c, h] = hexToOklch(hex);
  return oklchToHexInGamut([l, c, h]);
}

/**
 * Walk lightness until contrast vs `against` clears `threshold`.
 */
export function nudgeLUntil(
  hex: string,
  against: string,
  threshold: number,
  options: {
    readonly direction: 1 | -1;
    readonly minL?: number;
    readonly maxL?: number;
    readonly delta?: number;
    readonly maxIters?: number;
  },
): string {
  let current = hexToOklch(hex);
  const delta = options.delta ?? 0.015;
  const minL = options.minL ?? 0.15;
  const maxL = options.maxL ?? 0.92;
  const maxIters = options.maxIters ?? 40;

  for (let i = 0; i < maxIters; i += 1) {
    const candidate = oklchToHexInGamut(current);
    const ratio = contrastRatio(candidate, against);
    if (ratio != null && ratio >= threshold) {
      return candidate;
    }
    const [l, c, h] = current;
    const nextL = Math.min(maxL, Math.max(minL, l + options.direction * delta));
    if (nextL === l) {
      return candidate;
    }
    current = [nextL, c, h];
  }
  return oklchToHexInGamut(current);
}
