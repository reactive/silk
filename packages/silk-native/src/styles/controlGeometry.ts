import type { ButtonVariantProps, SpaceStep } from '@reactive/silk-core';

/**
 * Renderer-local control padding — intentionally parallel to web
 * `packages/silk/src/components/controlGeometry.ts` (space steps, not CSS vars).
 * Not a core token: padding geometry is renderer policy.
 */
export const controlSizePadding: Readonly<
  Record<
    NonNullable<ButtonVariantProps['size']>,
    { readonly py: SpaceStep; readonly px: SpaceStep }
  >
> = {
  sm: { py: 1, px: 2 },
  md: { py: 2, px: 3 },
  lg: { py: 3, px: 4 },
};

/** Matches web Button `line-height: 1.2`. */
export const controlLineHeightFactor = 1.2;

/**
 * Approximation of CSS `1ch` as a fraction of `em` (zero-glyph width).
 * Used for Text `measure="prose"` → RN `maxWidth`.
 */
export const chEmApproximation = 0.6;
