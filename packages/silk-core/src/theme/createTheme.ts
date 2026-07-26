import {
  defaultPalette,
  defaultPaletteDark,
  sharedSemanticScales,
} from '../tokens/index.js';
import type {
  ColorScheme,
  DeepPartial,
  InteractionToneColors,
  Palette,
  PaletteScale,
  SemanticTokens,
  ShadowLayer,
  Theme,
  ToneName,
} from '../tokens/index.js';

export interface CreateThemeOptions {
  readonly colorScheme?: ColorScheme;
  readonly palette?: DeepPartial<Palette>;
  readonly semantic?: DeepPartial<SemanticTokens>;
}

function mergeScale(
  base: PaletteScale,
  override: DeepPartial<PaletteScale> | undefined,
): PaletteScale {
  if (!override) {
    return base;
  }
  return {
    1: override[1] ?? base[1],
    2: override[2] ?? base[2],
    3: override[3] ?? base[3],
    4: override[4] ?? base[4],
    5: override[5] ?? base[5],
    6: override[6] ?? base[6],
    7: override[7] ?? base[7],
    8: override[8] ?? base[8],
    9: override[9] ?? base[9],
    10: override[10] ?? base[10],
    11: override[11] ?? base[11],
    12: override[12] ?? base[12],
  };
}

function mergePalette(
  base: Palette,
  override: DeepPartial<Palette> | undefined,
): Palette {
  if (!override) {
    return base;
  }
  return {
    gray: mergeScale(base.gray, override.gray),
    blue: mergeScale(base.blue, override.blue),
    red: mergeScale(base.red, override.red),
    green: mergeScale(base.green, override.green),
  };
}

function parseHexChannels(color: string): [number, number, number] | null {
  if (!/^#[0-9a-f]{6}$/i.test(color)) {
    return null;
  }
  return [
    Number.parseInt(color.slice(1, 3), 16),
    Number.parseInt(color.slice(3, 5), 16),
    Number.parseInt(color.slice(5, 7), 16),
  ];
}

/**
 * Blend `from` toward `to` in sRGB, weighting `to` by `amount`.
 *
 * Interaction states need three visually distinct fills, but a tone's `solid`
 * can sit one step from the end of its scale (light solid is step 11 so white
 * `onSolid` clears 4.5:1), leaving no room for a step-only ramp. Blending
 * places the middle state between two steps, so hover and active stay distinct
 * and monotonic without widening the palette.
 *
 * Non-hex palette overrides can't be blended; those fall back to `to`, which is
 * still distinct from `from`.
 */
function mixHex(from: string, to: string, amount: number): string {
  const start = parseHexChannels(from);
  const end = parseHexChannels(to);
  if (!start || !end) {
    return to;
  }
  const channel = (index: number): string =>
    Math.round(start[index]! + (end[index]! - start[index]!) * amount)
      .toString(16)
      .padStart(2, '0');
  return `#${channel(0)}${channel(1)}${channel(2)}`;
}

/**
 * Chromatic tone mapping.
 * Light: solid uses step 11 so white onSolid meets WCAG 4.5:1 (step 9 is ~3.2–3.9:1).
 * Dark: solid stays at step 9 (bright) with dark onSolid — already ≥4.5:1.
 */
function toneFromScale(
  solidScale: PaletteScale,
  gray: PaletteScale,
  scheme: ColorScheme,
): InteractionToneColors {
  const isLight = scheme === 'light';
  return {
    solid: isLight ? solidScale[11] : solidScale[9],
    onSolid: isLight ? '#ffffff' : gray[1],
    // Body-sized colored text on surfaces.
    // Light uses step 12 so text clears 4.5:1 on surfaceRaised; dark uses 11.
    text: isLight ? solidScale[12] : solidScale[11],
    subtle: solidScale[3],
    subtleHover: solidScale[4],
    subtleActive: solidScale[5],
    border: solidScale[7],
    // Light has only step 12 left above solid, so hover sits between 11 and 12.
    // Both are darker than solid, so white onSolid keeps clearing 4.5:1.
    hover: isLight
      ? mixHex(solidScale[11], solidScale[12], 0.5)
      : solidScale[10],
    active: isLight ? solidScale[12] : solidScale[11],
    // ≥3:1 on surface, surfaceRaised, and surfaceSunken (1.4.11).
    // Light step 9 fails on sunken; dark step 8 fails for some hues (e.g. danger).
    focusRing: isLight ? solidScale[10] : solidScale[9],
    disabledFg: gray[9],
    disabledBg: gray[4],
  };
}

function createSemanticColors(
  palette: Palette,
  scheme: ColorScheme,
): SemanticTokens['color'] {
  const { gray, blue, red, green } = palette;
  const isLight = scheme === 'light';

  const tones: Record<ToneName, InteractionToneColors> = {
    neutral: {
      solid: gray[12],
      onSolid: isLight ? '#ffffff' : gray[1],
      text: gray[12],
      subtle: gray[3],
      subtleHover: gray[4],
      subtleActive: gray[5],
      border: gray[7],
      // Neutral solid already sits at the end of the scale, so its states step
      // back toward 11 rather than past 12.
      hover: mixHex(gray[12], gray[11], 0.5),
      active: gray[11],
      focusRing: isLight ? blue[10] : blue[9],
      disabledFg: gray[9],
      disabledBg: gray[4],
    },
    accent: toneFromScale(blue, gray, scheme),
    danger: toneFromScale(red, gray, scheme),
    success: toneFromScale(green, gray, scheme),
  };

  return {
    surface: isLight ? '#ffffff' : gray[1],
    surfaceRaised: gray[2],
    surfaceSunken: gray[3],
    textPrimary: gray[12],
    textSecondary: gray[11],
    borderSubtle: gray[6],
    overlay: isLight ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.65)',
    tones,
  };
}

function mergeTone(
  base: InteractionToneColors,
  override: DeepPartial<InteractionToneColors> | undefined,
): InteractionToneColors {
  if (!override) {
    return base;
  }
  return {
    solid: override.solid ?? base.solid,
    onSolid: override.onSolid ?? base.onSolid,
    text: override.text ?? base.text,
    subtle: override.subtle ?? base.subtle,
    subtleHover: override.subtleHover ?? base.subtleHover,
    subtleActive: override.subtleActive ?? base.subtleActive,
    border: override.border ?? base.border,
    hover: override.hover ?? base.hover,
    active: override.active ?? base.active,
    focusRing: override.focusRing ?? base.focusRing,
    disabledFg: override.disabledFg ?? base.disabledFg,
    disabledBg: override.disabledBg ?? base.disabledBg,
  };
}

function mergeShadowLayer(
  base: ShadowLayer,
  override: DeepPartial<ShadowLayer> | undefined,
): ShadowLayer {
  if (!override) {
    return base;
  }
  return {
    offsetX: override.offsetX ?? base.offsetX,
    offsetY: override.offsetY ?? base.offsetY,
    blur: override.blur ?? base.blur,
    spread: override.spread ?? base.spread,
    opacity: override.opacity ?? base.opacity,
  };
}

function mergeSemantic(
  base: SemanticTokens,
  override: DeepPartial<SemanticTokens> | undefined,
): SemanticTokens {
  if (!override) {
    return base;
  }

  const colorOverride = override.color;
  const tonesOverride = colorOverride?.tones;
  const shadowOverride = override.shadow;

  return {
    color: {
      surface: colorOverride?.surface ?? base.color.surface,
      surfaceRaised: colorOverride?.surfaceRaised ?? base.color.surfaceRaised,
      surfaceSunken: colorOverride?.surfaceSunken ?? base.color.surfaceSunken,
      textPrimary: colorOverride?.textPrimary ?? base.color.textPrimary,
      textSecondary: colorOverride?.textSecondary ?? base.color.textSecondary,
      borderSubtle: colorOverride?.borderSubtle ?? base.color.borderSubtle,
      overlay: colorOverride?.overlay ?? base.color.overlay,
      tones: {
        neutral: mergeTone(base.color.tones.neutral, tonesOverride?.neutral),
        accent: mergeTone(base.color.tones.accent, tonesOverride?.accent),
        danger: mergeTone(base.color.tones.danger, tonesOverride?.danger),
        success: mergeTone(base.color.tones.success, tonesOverride?.success),
      },
    },
    space: { ...base.space, ...override.space },
    radius: { ...base.radius, ...override.radius },
    typography: {
      body: { ...base.typography.body, ...override.typography?.body },
      bodySm: { ...base.typography.bodySm, ...override.typography?.bodySm },
      headingSm: {
        ...base.typography.headingSm,
        ...override.typography?.headingSm,
      },
      heading: { ...base.typography.heading, ...override.typography?.heading },
      headingLg: {
        ...base.typography.headingLg,
        ...override.typography?.headingLg,
      },
      headingXl: {
        ...base.typography.headingXl,
        ...override.typography?.headingXl,
      },
      label: { ...base.typography.label, ...override.typography?.label },
      caption: { ...base.typography.caption, ...override.typography?.caption },
    },
    motion: {
      fast: { ...base.motion.fast, ...override.motion?.fast },
      normal: { ...base.motion.normal, ...override.motion?.normal },
      slow: { ...base.motion.slow, ...override.motion?.slow },
      loop: { ...base.motion.loop, ...override.motion?.loop },
    },
    shadow: {
      raised: mergeShadowLayer(base.shadow.raised, shadowOverride?.raised),
      overlay: mergeShadowLayer(base.shadow.overlay, shadowOverride?.overlay),
    },
    focusRing: {
      width: override.focusRing?.width ?? base.focusRing.width,
      offset: override.focusRing?.offset ?? base.focusRing.offset,
    },
  };
}

/**
 * Create a theme by mapping a palette into semantic tokens.
 *
 * Merge order:
 * 1. Built-in scheme palette
 * 2. Palette leaf overrides
 * 3. Palette-derived semantic defaults
 * 4. Explicit semantic leaf overrides (win last)
 */
export function createTheme(options: CreateThemeOptions = {}): Theme {
  const colorScheme: ColorScheme = options.colorScheme ?? 'light';
  const basePalette =
    colorScheme === 'dark' ? defaultPaletteDark : defaultPalette;
  const palette = mergePalette(basePalette, options.palette);

  const derived: SemanticTokens = {
    color: createSemanticColors(palette, colorScheme),
    ...sharedSemanticScales,
  };

  const semantic = mergeSemantic(derived, options.semantic);

  return { colorScheme, palette, semantic };
}
