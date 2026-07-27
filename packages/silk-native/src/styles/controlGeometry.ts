import type {
  ButtonVariantProps,
  CheckboxVariantProps,
  InputVariantProps,
  ProgressVariantProps,
  SpaceStep,
  SpinnerVariantProps,
} from '@reactive/silk-core';

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

type ControlSize = NonNullable<InputVariantProps['size']>;
type ToggleSize = NonNullable<CheckboxVariantProps['size']>;
type ProgressSize = NonNullable<ProgressVariantProps['size']>;
type SpinnerSize = NonNullable<SpinnerVariantProps['size']>;

/**
 * Min-height space steps for text controls (Input). lg = space[8] + space[2]
 * (web: `calc(var(--silk-space-8) + var(--silk-space-2))`).
 * Resolved through the density-aware space scale.
 */
export const controlMinHeightStep: Readonly<
  Record<ControlSize, { readonly a: SpaceStep; readonly b?: SpaceStep }>
> = {
  sm: { a: 7 },
  md: { a: 8 },
  lg: { a: 8, b: 2 },
};

/** Checkbox / Radio box and Switch track height (web space-4 / space-5). */
export const toggleBoxStep: Readonly<Record<ToggleSize, SpaceStep>> = {
  sm: 4,
  md: 5,
};

/**
 * Switch track width steps. sm = space[7] + space[1]
 * (web: `calc(var(--silk-space-7) + var(--silk-space-1))`).
 */
export const switchTrackWidthStep: Readonly<
  Record<ToggleSize, { readonly a: SpaceStep; readonly b?: SpaceStep }>
> = {
  sm: { a: 7, b: 1 },
  md: { a: 8 },
};

/** Spinner diameter (space step) + fixed border width in px. */
export const spinnerGeometry: Readonly<
  Record<SpinnerSize, { readonly sizeStep: SpaceStep; readonly border: number }>
> = {
  sm: { sizeStep: 4, border: 2 },
  md: { sizeStep: 5, border: 3 },
  lg: { sizeStep: 7, border: 3 },
};

/** Progress track heights as space steps (sm/md/lg → 1/2/3). */
export const progressTrackStep: Readonly<Record<ProgressSize, SpaceStep>> = {
  sm: 1,
  md: 2,
  lg: 3,
};

/** Thumb inset on Switch (web: 2px margin each side). */
export const switchThumbInset = 2;

/** Resolve a `{ a, b? }` step pair against a space scale. */
export function resolveSpaceSum(
  space: Readonly<Record<SpaceStep, number>>,
  steps: { readonly a: SpaceStep; readonly b?: SpaceStep },
): number {
  return space[steps.a] + (steps.b !== undefined ? space[steps.b] : 0);
}
