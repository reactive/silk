import type {
  MotionRecord,
  RadiusName,
  SemanticTokens,
  SpaceStep,
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

const sans =
  'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif';

export const defaultTypography: Readonly<
  Record<TypographyRole, TypographyRecord>
> = {
  body: { family: sans, size: 16, lineHeight: 1.5, weight: 400 },
  bodySm: { family: sans, size: 14, lineHeight: 1.45, weight: 400 },
  heading: { family: sans, size: 20, lineHeight: 1.3, weight: 600 },
  headingLg: { family: sans, size: 28, lineHeight: 1.25, weight: 700 },
  label: { family: sans, size: 14, lineHeight: 1.3, weight: 500 },
  caption: { family: sans, size: 12, lineHeight: 1.35, weight: 400 },
};

export const defaultMotion: Readonly<
  Record<'fast' | 'normal' | 'slow', MotionRecord>
> = {
  fast: { durationMs: 120, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
  normal: { durationMs: 200, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
  slow: { durationMs: 320, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
};

/** Non-color semantic defaults shared by light and dark schemes. */
export function createSharedSemanticScales(): Pick<
  SemanticTokens,
  'space' | 'radius' | 'typography' | 'motion'
> {
  return {
    space: defaultSpace,
    radius: defaultRadius,
    typography: defaultTypography,
    motion: defaultMotion,
  };
}
