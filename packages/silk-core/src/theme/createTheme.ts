import {
  createSharedSemanticScales,
  defaultPalette,
  defaultPaletteDark,
} from '../tokens/index.js';
import type {
  ColorScheme,
  DeepPartial,
  InteractionToneColors,
  Palette,
  PaletteScale,
  SemanticTokens,
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

function toneFromScale(
  solidScale: PaletteScale,
  gray: PaletteScale,
  scheme: ColorScheme,
): InteractionToneColors {
  const isLight = scheme === 'light';
  return {
    solid: solidScale[9],
    onSolid: isLight ? '#ffffff' : gray[1],
    subtle: solidScale[3],
    border: solidScale[7],
    hover: solidScale[10],
    active: solidScale[11],
    focusRing: solidScale[8],
    disabledFg: gray[9],
    disabledBg: gray[4],
  };
}

function createSemanticColors(
  palette: Palette,
  scheme: ColorScheme,
): SemanticTokens['color'] {
  const { gray, blue, red } = palette;
  const isLight = scheme === 'light';

  const tones: Record<ToneName, InteractionToneColors> = {
    neutral: {
      solid: gray[12],
      onSolid: isLight ? '#ffffff' : gray[1],
      subtle: gray[3],
      border: gray[7],
      hover: gray[11],
      active: gray[12],
      focusRing: blue[8],
      disabledFg: gray[9],
      disabledBg: gray[4],
    },
    accent: toneFromScale(blue, gray, scheme),
    danger: toneFromScale(red, gray, scheme),
  };

  return {
    surface: isLight ? '#ffffff' : gray[1],
    surfaceRaised: isLight ? gray[2] : gray[2],
    textPrimary: gray[12],
    textSecondary: gray[11],
    borderSubtle: gray[6],
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
    subtle: override.subtle ?? base.subtle,
    border: override.border ?? base.border,
    hover: override.hover ?? base.hover,
    active: override.active ?? base.active,
    focusRing: override.focusRing ?? base.focusRing,
    disabledFg: override.disabledFg ?? base.disabledFg,
    disabledBg: override.disabledBg ?? base.disabledBg,
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

  return {
    color: {
      surface: colorOverride?.surface ?? base.color.surface,
      surfaceRaised: colorOverride?.surfaceRaised ?? base.color.surfaceRaised,
      textPrimary: colorOverride?.textPrimary ?? base.color.textPrimary,
      textSecondary: colorOverride?.textSecondary ?? base.color.textSecondary,
      borderSubtle: colorOverride?.borderSubtle ?? base.color.borderSubtle,
      tones: {
        neutral: mergeTone(base.color.tones.neutral, tonesOverride?.neutral),
        accent: mergeTone(base.color.tones.accent, tonesOverride?.accent),
        danger: mergeTone(base.color.tones.danger, tonesOverride?.danger),
      },
    },
    space: { ...base.space, ...override.space },
    radius: { ...base.radius, ...override.radius },
    typography: {
      body: { ...base.typography.body, ...override.typography?.body },
      bodySm: { ...base.typography.bodySm, ...override.typography?.bodySm },
      heading: { ...base.typography.heading, ...override.typography?.heading },
      headingLg: {
        ...base.typography.headingLg,
        ...override.typography?.headingLg,
      },
      label: { ...base.typography.label, ...override.typography?.label },
      caption: { ...base.typography.caption, ...override.typography?.caption },
    },
    motion: {
      fast: { ...base.motion.fast, ...override.motion?.fast },
      normal: { ...base.motion.normal, ...override.motion?.normal },
      slow: { ...base.motion.slow, ...override.motion?.slow },
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
    ...createSharedSemanticScales(),
  };

  const semantic = mergeSemantic(derived, options.semantic);

  return { colorScheme, palette, semantic };
}
