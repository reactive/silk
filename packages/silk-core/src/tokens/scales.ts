import type {
  ElevationName,
  FocusRingGeometry,
  FontFamilyName,
  MeasureName,
  MotionName,
  MotionRecord,
  RadiusName,
  SemanticTokens,
  ShadowLayer,
  SpaceStep,
  ToneName,
  TypographyRecord,
  TypographyRole,
} from './types.js';

export const defaultSpace: Readonly<Record<SpaceStep, number>> = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32,
  8: 40,
  9: 48,
  10: 64,
};

/**
 * Compact density space scale. Same step names as `defaultSpace`; smaller values.
 * Web remaps `--silk-space-*` to these under `[data-density='compact']`.
 */
export const compactSpace: Readonly<Record<SpaceStep, number>> = {
  0: 0,
  1: 3,
  2: 6,
  3: 9,
  4: 12,
  5: 16,
  6: 20,
  7: 24,
  8: 32,
  9: 40,
  10: 48,
};

export const spaceSteps: readonly SpaceStep[] = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
];

/** String form of `spaceSteps` for recipe gap/padding axes. */
export const spaceVariantSteps: readonly [
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

/**
 * Radius scale in px. `full` is a finite large value suitable for pills;
 * web CSS may still use `9999px` via serializer convention.
 */
export const defaultRadius: Readonly<Record<RadiusName, number>> = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
};

/**
 * Default CSS stacks. Design names first; `* Variable` aliases match
 * `@fontsource-variable` packages. Silk ships no font files.
 */
export const defaultFontFamily: Readonly<Record<FontFamilyName, string>> = {
  sans: "Inter, 'Inter Variable', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
  serif:
    "'Source Serif 4', 'Source Serif 4 Variable', ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
  mono: "'JetBrains Mono', 'JetBrains Mono Variable', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
};

/** Every font-family name — renderers iterate this instead of restating the keys. */
export const fontFamilyNames: readonly FontFamilyName[] = Object.keys(
  defaultFontFamily,
) as FontFamilyName[];

export const defaultTypography: Readonly<
  Record<TypographyRole, TypographyRecord>
> = {
  body: { family: 'sans', size: 16, lineHeight: 1.5, weight: 400 },
  bodySm: { family: 'sans', size: 14, lineHeight: 1.45, weight: 400 },
  headingSm: { family: 'sans', size: 16, lineHeight: 1.35, weight: 600 },
  heading: { family: 'sans', size: 20, lineHeight: 1.3, weight: 600 },
  headingLg: { family: 'sans', size: 28, lineHeight: 1.25, weight: 700 },
  // Display / page H1 — not section or panel headers (those stay sans via headingLg).
  headingXl: { family: 'serif', size: 36, lineHeight: 1.2, weight: 700 },
  label: { family: 'sans', size: 14, lineHeight: 1.3, weight: 500 },
  caption: { family: 'sans', size: 12, lineHeight: 1.35, weight: 400 },
};

/**
 * Elevation shadow layers. Renderers serialize geometry + opacity;
 * dark schemes pair with surfaceRaised + border (shadow alone is weak).
 */
export const defaultShadow: Readonly<Record<ElevationName, ShadowLayer>> = {
  raised: {
    offsetX: 0,
    offsetY: 4,
    blur: 12,
    spread: 0,
    opacity: 0.08,
  },
  overlay: {
    offsetX: 0,
    offsetY: 8,
    blur: 32,
    spread: 0,
    opacity: 0.18,
  },
};

export const defaultMotion: Readonly<Record<MotionName, MotionRecord>> = {
  fast: { durationMs: 120, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
  normal: { durationMs: 200, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
  slow: { durationMs: 320, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
  loop: { durationMs: 1200, easing: 'linear' },
};

/** Every motion name — renderers iterate this instead of restating the keys. */
export const motionNames: readonly MotionName[] = Object.keys(
  defaultMotion,
) as MotionName[];

// Exhaustive by construction: adding a ToneName fails to compile until listed.
const toneNameSet: Readonly<Record<ToneName, true>> = {
  neutral: true,
  accent: true,
  danger: true,
  success: true,
};

/** Every tone name — renderers iterate this instead of restating the keys. */
export const toneNames: readonly ToneName[] = Object.keys(
  toneNameSet,
) as ToneName[];

/**
 * 65 characters sits mid-range of the 45–75 band typography practice treats as
 * comfortable, so a column capped here reads well at any of the body roles.
 */
export const defaultMeasure: Readonly<Record<MeasureName, number>> = {
  prose: 65,
};

/** Every measure name — renderers iterate this instead of restating the keys. */
export const measureNames: readonly MeasureName[] = Object.keys(
  defaultMeasure,
) as MeasureName[];

/** Shared focus-ring geometry — renderers map to outline / native equivalents. */
export const defaultFocusRing: FocusRingGeometry = {
  width: 2,
  offset: 2,
};

/** Non-color semantic defaults shared by light and dark schemes. */
export const sharedSemanticScales: Pick<
  SemanticTokens,
  | 'space'
  | 'radius'
  | 'fontFamily'
  | 'typography'
  | 'measure'
  | 'motion'
  | 'shadow'
  | 'focusRing'
> = {
  space: defaultSpace,
  radius: defaultRadius,
  fontFamily: defaultFontFamily,
  typography: defaultTypography,
  measure: defaultMeasure,
  motion: defaultMotion,
  shadow: defaultShadow,
  focusRing: defaultFocusRing,
};
