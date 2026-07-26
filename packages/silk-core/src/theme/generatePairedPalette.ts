import { oklch } from 'culori';
import {
  defaultPalette,
  defaultPaletteDark,
  type ColorScheme,
  type Palette,
  type PaletteScale,
} from '../tokens/index.js';
import {
  requireCanonicalHex,
  requireFiniteNonNegative,
} from './colorMath.js';
import { generateScale } from './generateScale.js';
import { nudgeLUntil, oklchChannelsToHex } from './oklchUtil.js';

export interface PairedPaletteOptions {
  /** Optional danger seed; defaults to Silk's built-in red scales. */
  readonly dangerSeedHex?: string;
  /** Optional success seed; defaults to Silk's built-in green scales. */
  readonly successSeedHex?: string;
  /**
   * Peak OKLCH chroma for the brand-tinted gray scale. Defaults to 0.012 —
   * enough for warm/cool neutrals without reading as a second accent.
   */
  readonly grayChromaCap?: number;
}

export interface PairedPalette {
  readonly light: Palette;
  readonly dark: Palette;
}

/**
 * After gray + chromatic scales exist, repair steps that depend on both:
 * dark onSolid (gray[1] on chromatic[9]) and focus rings vs sunken surfaces.
 */
function repairChromaticAgainstGray(
  chromatic: PaletteScale,
  gray: PaletteScale,
  scheme: ColorScheme,
): PaletteScale {
  const next = { ...chromatic };
  if (scheme === 'dark') {
    // Brighten solid until onSolid and focus-ring floors clear.
    next[9] = nudgeLUntil(next[9], gray[1], 4.5, {
      direction: 1,
      maxL: 0.9,
      maxIters: 48,
    });
    next[9] = nudgeLUntil(next[9], gray[3], 3, {
      direction: 1,
      maxL: 0.9,
      maxIters: 48,
    });
    // Keep hover (10) / active (11) above solid for distinctness.
    const solid = oklch(next[9]);
    const solidL = solid?.l ?? 0.65;
    const c10 = oklch(next[10])?.c ?? 0;
    const h10 = oklch(next[10])?.h ?? 0;
    next[10] = oklchChannelsToHex(Math.min(0.92, solidL + 0.04), c10, h10);
    const c11 = oklch(next[11])?.c ?? 0;
    const h11 = oklch(next[11])?.h ?? 0;
    next[11] = oklchChannelsToHex(Math.min(0.94, solidL + 0.1), c11, h11);
  } else {
    next[10] = nudgeLUntil(next[10], gray[3], 3, {
      direction: -1,
      minL: 0.2,
    });
  }
  return next;
}

function buildSchemePalette(
  brand: string,
  scheme: ColorScheme,
  grayCap: number,
  danger: string | undefined,
  success: string | undefined,
): Palette {
  const defaults = scheme === 'dark' ? defaultPaletteDark : defaultPalette;
  const gray = generateScale(brand, scheme, { chromaCap: grayCap });
  const blue = repairChromaticAgainstGray(
    generateScale(brand, scheme),
    gray,
    scheme,
  );
  const red = danger
    ? repairChromaticAgainstGray(generateScale(danger, scheme), gray, scheme)
    : defaults.red;
  const green = success
    ? repairChromaticAgainstGray(generateScale(success, scheme), gray, scheme)
    : defaults.green;
  return { gray, blue, red, green };
}

/**
 * Tenant branding recipe: one brand hex → light and dark palettes.
 *
 * Slot mapping:
 * - `blue` (accent) ← brand seed chromatic scales
 * - `gray` (surfaces / neutral / text) ← low-chroma brand-hue scales
 * - `red` / `green` ← built-in defaults, or generated from optional seeds
 *
 * Pair both schemes from the same seeds so dark derivation is a complete
 * palette (surfaces and neutrals included), not an accent-only remap.
 */
export function generatePairedPalette(
  brandHex: string,
  options: PairedPaletteOptions = {},
): PairedPalette {
  const brand = requireCanonicalHex(brandHex, 'brandHex');
  const grayCap = requireFiniteNonNegative(
    options.grayChromaCap ?? 0.012,
    'grayChromaCap',
  );

  const danger =
    options.dangerSeedHex !== undefined
      ? requireCanonicalHex(options.dangerSeedHex, 'dangerSeedHex')
      : undefined;
  const success =
    options.successSeedHex !== undefined
      ? requireCanonicalHex(options.successSeedHex, 'successSeedHex')
      : undefined;

  return {
    light: buildSchemePalette(brand, 'light', grayCap, danger, success),
    dark: buildSchemePalette(brand, 'dark', grayCap, danger, success),
  };
}
