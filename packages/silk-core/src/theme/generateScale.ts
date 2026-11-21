import type {
  ColorScheme,
  PaletteScale,
  PaletteStep,
} from '../tokens/index.js';
import {
  blueScaleDarkOklch,
  blueScaleOklch,
  grayScaleDarkOklch,
  grayScaleOklch,
  type OklchScale,
} from '../tokens/paletteOklch.js';
import {
  requireCanonicalHex,
  requireFiniteNonNegative,
} from './colorMath.js';
import { hexToOklch, nudgeLUntil, oklchToHexInGamut } from './gamutOklch.js';

/** Index of step 9, a chromatic scale's solid and its chroma peak. */
const SOLID = 8;

/**
 * Lightness and relative-chroma curves, read from Silk's default blue and gray
 * scales so the built-in coordinates live in one place (tokens/paletteOklch.ts).
 * Relative chroma is C / C₉, so a seed's chroma can scale the whole ramp while
 * keeping the same shape.
 */
const lightness = (scale: OklchScale): readonly number[] =>
  scale.map(([l]) => l);
const relativeChroma = (scale: OklchScale): readonly number[] =>
  scale.map(([, c]) => c / scale[SOLID][1]);

const CHROMATIC_LIGHT_L = lightness(blueScaleOklch);
const CHROMATIC_LIGHT_C_REL = relativeChroma(blueScaleOklch);
const CHROMATIC_DARK_L = lightness(blueScaleDarkOklch);
const CHROMATIC_DARK_C_REL = relativeChroma(blueScaleDarkOklch);
/**
 * Generated neutral light step 11 (textSecondary), darker than Silk's own gray
 * (0.503): brand-tinted text keeps a margin above the 4.5:1 floor that
 * generateScale's nudge enforces. Generator-only.
 */
const NEUTRAL_LIGHT_STEP_11_L = 0.48;
const NEUTRAL_LIGHT_L = lightness(grayScaleOklch).map((l, i) =>
  i === 10 ? NEUTRAL_LIGHT_STEP_11_L : l,
);
const NEUTRAL_DARK_L = lightness(grayScaleDarkOklch);

const STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
// Silk's default sunken (light) and surface (dark) grays, as contrast targets,
// so retuning the default grays moves these targets with them.
const SUNKEN_PROXY = oklchToHexInGamut(grayScaleOklch[2]);
const SURFACE_PROXY = oklchToHexInGamut(grayScaleDarkOklch[0]);
const WHITE = oklchToHexInGamut([1, 0, 0]);

/** Nudge L so adjacent steps serialize to distinct hex after gamut mapping. */
function ensureDistinctSteps(
  scale: Record<PaletteStep, string>,
  hue: number,
  peakC: number,
  cRels: readonly number[],
): void {
  for (let i = 1; i < 12; i += 1) {
    const prev = STEPS[i - 1]!;
    const step = STEPS[i]!;
    if (scale[step] !== scale[prev]) {
      continue;
    }
    const prevL = hexToOklch(scale[prev])[0];
    const direction = i < SOLID ? -1 : 1;
    for (let n = 1; n <= 20; n += 1) {
      const l = Math.min(0.995, Math.max(0.12, prevL + direction * 0.01 * n));
      const next = oklchToHexInGamut([l, peakC * (cRels[i] ?? 0), hue]);
      if (next !== scale[prev]) {
        scale[step] = next;
        break;
      }
    }
  }
}

export interface GenerateScaleOptions {
  /**
   * Cap chroma for near-neutral ramps (brand-tinted grays). When set, the
   * seed's chroma is ignored and this absolute OKLCH C is used as the peak;
   * the neutral L curve is used instead of the chromatic one.
   */
  readonly chromaCap?: number;
}

/**
 * Generate a 12-step palette scale from a brand seed in OKLCH.
 *
 * - Input must be canonical sRGB hex (`#RGB` / `#RRGGBB`); invalid input throws.
 * - Output is twelve lowercase `#rrggbb` values, gamut-mapped via clampChroma.
 * - Guarantees monotonic role behavior for Silk's semantic mapping (light solid
 *   at step 11 vs white; dark solid at step 9 vs dark surfaces), not visual
 *   identity with Radix hand-authored scales.
 * - Algorithm details (exact L/C curves) may improve between minor releases;
 *   the hex input contract and 12-step shape are stable.
 */
export function generateScale(
  seedHex: string,
  colorScheme: ColorScheme,
  options: GenerateScaleOptions = {},
): PaletteScale {
  const seed = requireCanonicalHex(seedHex, 'seedHex');
  const [seedL, seedC, hue] = hexToOklch(seed);

  const chromaCap = options.chromaCap;
  const isNeutral = chromaCap !== undefined;
  if (chromaCap !== undefined) {
    requireFiniteNonNegative(chromaCap, 'chromaCap');
  }
  const peakC =
    chromaCap !== undefined
      ? chromaCap
      : Math.min(0.25, Math.max(0.1, seedC < 0.04 ? 0.14 : seedC));

  const Ls = isNeutral
    ? colorScheme === 'light'
      ? NEUTRAL_LIGHT_L
      : NEUTRAL_DARK_L
    : colorScheme === 'light'
      ? CHROMATIC_LIGHT_L
      : CHROMATIC_DARK_L;
  const Crels =
    colorScheme === 'light' ? CHROMATIC_LIGHT_C_REL : CHROMATIC_DARK_C_REL;

  // Only shift chromatic mid-tones toward the seed's lightness; neutrals and
  // extreme seeds keep the template so surfaces/text stay on-contract.
  const lShift =
    isNeutral || seedL < 0.25 || seedL > 0.9 ? 0 : seedL - Ls[SOLID]!;

  const out = {} as Record<PaletteStep, string>;
  for (let i = 0; i < 12; i += 1) {
    const step = STEPS[i]!;
    let l = Ls[i]! + lShift * (1 - Math.abs(i - SOLID) / 11);
    l = Math.min(0.995, Math.max(0.12, l));
    out[step] = oklchToHexInGamut([l, peakC * Crels[i]!, hue]);
  }

  if (colorScheme === 'light') {
    if (isNeutral) {
      // textSecondary = step 11 must clear 4.5:1 on surfaceSunken (step 3).
      out[11] = nudgeLUntil(out[11], out[3], 4.5, { direction: -1 });
      out[12] = nudgeLUntil(out[12], out[3], 7, { direction: -1 });
      if (hexToOklch(out[12])[0] >= hexToOklch(out[11])[0]) {
        out[12] = nudgeLUntil(out[12], out[11], 1.2, { direction: -1 });
      }
    } else {
      out[11] = nudgeLUntil(out[11], WHITE, 4.5, { direction: -1 });
      out[10] = nudgeLUntil(out[10], SUNKEN_PROXY, 3, { direction: -1 });
      const [l11] = hexToOklch(out[11]);
      out[12] = oklchToHexInGamut([
        Math.min(l11 - 0.14, 0.35),
        peakC * Crels[11]!,
        hue,
      ]);
      out[12] = nudgeLUntil(out[12], SUNKEN_PROXY, 4.5, { direction: -1 });
    }
  } else if (!isNeutral) {
    out[9] = nudgeLUntil(out[9], SURFACE_PROXY, 3, {
      direction: 1,
      maxL: 0.92,
    });
  }

  ensureDistinctSteps(out, hue, peakC, Crels);
  return out;
}
