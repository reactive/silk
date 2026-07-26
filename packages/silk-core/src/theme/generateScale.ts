import { oklch } from 'culori';
import type { ColorScheme, PaletteScale, PaletteStep } from '../tokens/index.js';
import {
  requireCanonicalHex,
  requireFiniteNonNegative,
} from './colorMath.js';
import {
  nudgeLUntil,
  oklchAt,
  oklchChannelsToHex,
  oklchToHex,
} from './oklchUtil.js';

/**
 * Lightness / relative-chroma templates distilled from Silk's default scales
 * (Radix-inspired). Relative chroma is C / C₉ so a seed's chroma can scale the
 * whole ramp while keeping the same shape.
 */
const CHROMATIC_LIGHT_L = [
  0.993, 0.982, 0.96, 0.938, 0.905, 0.863, 0.81, 0.734, 0.649, 0.622, 0.556,
  0.324,
] as const;
const CHROMATIC_LIGHT_C_REL = [
  0.016, 0.047, 0.104, 0.181, 0.264, 0.352, 0.461, 0.627, 1, 0.948, 0.839,
  0.497,
] as const;
const CHROMATIC_DARK_L = [
  0.194, 0.213, 0.274, 0.32, 0.367, 0.416, 0.474, 0.541, 0.649, 0.688, 0.764,
  0.907,
] as const;
const CHROMATIC_DARK_C_REL = [
  0.13, 0.155, 0.342, 0.503, 0.549, 0.585, 0.632, 0.725, 1, 0.876, 0.653,
  0.264,
] as const;

/** Neutral (gray) L curves — darker step 11 so textSecondary clears sunken. */
const NEUTRAL_LIGHT_L = [
  0.991, 0.982, 0.955, 0.931, 0.907, 0.885, 0.851, 0.792, 0.643, 0.61, 0.48,
  0.244,
] as const;
const NEUTRAL_DARK_L = [
  0.178, 0.213, 0.252, 0.285, 0.313, 0.348, 0.402, 0.489, 0.538, 0.583, 0.77,
  0.949,
] as const;

const STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
const SUNKEN_PROXY = oklchChannelsToHex(0.955, 0, 0);
const SURFACE_PROXY = oklchChannelsToHex(0.178, 0, 0);

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
    const prevL = oklch(scale[prev])?.l ?? 0.5;
    const direction = i < 8 ? -1 : 1;
    for (let n = 1; n <= 20; n += 1) {
      const l = Math.min(0.995, Math.max(0.12, prevL + direction * 0.01 * n));
      const next = oklchChannelsToHex(l, peakC * (cRels[i] ?? 0), hue);
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
  const seedOklch = oklch(seed);
  if (!seedOklch) {
    throw new Error(`Unable to parse seedHex: ${seed}`);
  }

  const chromaCap = options.chromaCap;
  const isNeutral = chromaCap !== undefined;
  if (chromaCap !== undefined) {
    requireFiniteNonNegative(chromaCap, 'chromaCap');
  }
  const hue = seedOklch.h ?? 0;
  const seedC = seedOklch.c ?? 0;
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
  const seedL = seedOklch.l ?? Ls[8];
  const lShift =
    isNeutral || seedL < 0.25 || seedL > 0.9 ? 0 : seedL - Ls[8];

  const out = {} as Record<PaletteStep, string>;
  for (let i = 0; i < 12; i += 1) {
    const step = STEPS[i]!;
    let l = Ls[i]! + lShift * (1 - Math.abs(i - 8) / 11);
    l = Math.min(0.995, Math.max(0.12, l));
    out[step] = oklchChannelsToHex(l, peakC * Crels[i]!, hue);
  }

  if (colorScheme === 'light') {
    if (isNeutral) {
      // textSecondary = step 11 must clear 4.5:1 on surfaceSunken (step 3).
      out[11] = nudgeLUntil(out[11], out[3], 4.5, { direction: -1 });
      out[12] = nudgeLUntil(out[12], out[3], 7, { direction: -1 });
      if ((oklch(out[12])?.l ?? 1) >= (oklch(out[11])?.l ?? 0)) {
        out[12] = nudgeLUntil(out[12], out[11], 1.2, { direction: -1 });
      }
    } else {
      out[11] = nudgeLUntil(out[11], '#ffffff', 4.5, { direction: -1 });
      out[10] = nudgeLUntil(out[10], SUNKEN_PROXY, 3, { direction: -1 });
      const l11 = oklch(out[11])?.l ?? 0.5;
      out[12] = oklchToHex(
        oklchAt(Math.min(l11 - 0.14, 0.35), peakC * Crels[11]!, hue),
      );
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
