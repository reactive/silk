// The generators' OKLCH math, and the only module that imports culori, so
// createTheme never pulls it in. Unlike color/oklch.ts, which clips each sRGB
// channel, this maps a color outside sRGB into it by lowering chroma, keeping
// lightness and hue.
import { clampChroma, formatHex, oklch as parseOklch } from 'culori';
import { contrastRatio } from './colorMath.js';

/** An OKLCH color as the generators read it. */
export interface OklchColor {
  readonly l: number;
  readonly c: number;
  readonly h: number;
}

/** `#rrggbb` for an OKLCH color, lowering chroma until it fits sRGB. */
export function oklchToHexInGamut(l: number, c: number, h: number): string {
  const hex = formatHex(clampChroma({ mode: 'oklch', l, c, h }, 'oklch'));
  if (!hex) {
    throw new Error(`Failed to serialize oklch(${l}, ${c}, ${h}) to hex`);
  }
  return hex.toLowerCase();
}

/** A hex color in OKLCH; an achromatic color has hue 0. */
export function hexToOklch(hex: string): OklchColor {
  const color = parseOklch(hex);
  if (!color) {
    throw new Error(`Unable to parse color: ${hex}`);
  }
  return { l: color.l, c: color.c ?? 0, h: color.h ?? 0 };
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
    const candidate = oklchToHexInGamut(current.l, current.c, current.h);
    const ratio = contrastRatio(candidate, against);
    if (ratio != null && ratio >= threshold) {
      return candidate;
    }
    const currentL = current.l;
    const nextL = Math.min(
      maxL,
      Math.max(minL, currentL + options.direction * delta),
    );
    if (nextL === currentL) {
      return candidate;
    }
    current = { ...current, l: nextL };
  }
  return oklchToHexInGamut(current.l, current.c, current.h);
}
