/**
 * Canonical, platform-neutral token types.
 * Dimensions are px-equivalent numbers; typography lineHeight is a unitless multiplier.
 * Core never stores CSS strings for dimensions.
 */

export type ColorScheme = 'light' | 'dark';

export type PaletteStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type PaletteScale = Readonly<Record<PaletteStep, string>>;

export interface Palette {
  readonly gray: PaletteScale;
  readonly blue: PaletteScale;
  readonly red: PaletteScale;
  readonly green: PaletteScale;
}

export type ToneName = 'neutral' | 'accent' | 'danger' | 'success';

/**
 * Interaction color contract for a single tone.
 * Components consume these via semantic tokens — never palette steps.
 *
 * Solid variants use `hover` / `active`. Soft / outline / ghost use
 * `subtle` + `subtleHover` / `subtleActive` so fill states stay honest
 * (never reuse `border` as a background).
 */
export interface InteractionToneColors {
  readonly solid: string;
  readonly onSolid: string;
  /** Colored text on surfaces (WCAG body text); distinct from solid fill in dark. */
  readonly text: string;
  readonly subtle: string;
  readonly subtleHover: string;
  readonly subtleActive: string;
  readonly border: string;
  readonly hover: string;
  readonly active: string;
  readonly focusRing: string;
  readonly disabledFg: string;
  readonly disabledBg: string;
}

/** Platform-neutral focus-ring geometry (px-equivalent). */
export interface FocusRingGeometry {
  readonly width: number;
  readonly offset: number;
}

export type SpaceStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/** System density axis — remaps effective space tokens without changing step names. */
export type DensityName = 'comfortable' | 'compact';

export type RadiusName = 'none' | 'sm' | 'md' | 'lg' | 'full';

export type TypographyRole =
  | 'body'
  | 'bodySm'
  | 'headingSm'
  | 'heading'
  | 'headingLg'
  | 'headingXl'
  | 'label'
  | 'caption';

export interface TypographyRecord {
  readonly family: string;
  readonly size: number;
  readonly lineHeight: number;
  readonly weight: number;
}

/**
 * `fast` / `normal` / `slow` are one-shot transition durations.
 * `loop` is one cycle of continuous indeterminate feedback (shimmer, spin) —
 * an order of magnitude longer, and linear so cycles join seamlessly.
 */
export type MotionName = 'fast' | 'normal' | 'slow' | 'loop';

export interface MotionRecord {
  readonly durationMs: number;
  readonly easing: string;
}

/**
 * Complete shadow layer — platform-neutral geometry + opacity.
 * Renderers map to CSS box-shadow or native elevation; color is typically black
 * modulated by opacity (dark schemes rely on surface/border for separation).
 */
export interface ShadowLayer {
  readonly offsetX: number;
  readonly offsetY: number;
  readonly blur: number;
  readonly spread: number;
  /** 0–1 opacity of the shadow ink. */
  readonly opacity: number;
}

export type ElevationName = 'raised' | 'overlay';

export type MeasureName = 'prose';

export interface SemanticTokens {
  readonly color: {
    readonly surface: string;
    readonly surfaceRaised: string;
    /** Sunken wells (form controls, inset panels). */
    readonly surfaceSunken: string;
    readonly textPrimary: string;
    readonly textSecondary: string;
    readonly borderSubtle: string;
    /** Modal/popover scrim color (may include alpha). */
    readonly overlay: string;
    readonly tones: Readonly<Record<ToneName, InteractionToneColors>>;
  };
  readonly space: Readonly<Record<SpaceStep, number>>;
  readonly radius: Readonly<Record<RadiusName, number>>;
  readonly typography: Readonly<Record<TypographyRole, TypographyRecord>>;
  /**
   * Comfortable line lengths in characters. A count rather than a length so it
   * stays platform-neutral and tracks the font a renderer actually resolves.
   */
  readonly measure: Readonly<Record<MeasureName, number>>;
  readonly motion: Readonly<Record<MotionName, MotionRecord>>;
  readonly shadow: Readonly<Record<ElevationName, ShadowLayer>>;
  /** Shared focus-ring width/offset — color remains per-tone (`tones.*.focusRing`). */
  readonly focusRing: FocusRingGeometry;
}

export interface Theme {
  readonly colorScheme: ColorScheme;
  readonly palette: Palette;
  readonly semantic: SemanticTokens;
}

export type DeepPartial<T> = {
  readonly [K in keyof T]?: T[K] extends readonly (infer U)[]
    ? readonly U[]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};
