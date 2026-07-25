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

export type ToneName = 'neutral' | 'accent' | 'danger';

/**
 * Interaction color contract for a single tone.
 * Components consume these via semantic CSS variables — never palette steps.
 */
export interface InteractionToneColors {
  readonly solid: string;
  readonly onSolid: string;
  readonly subtle: string;
  readonly border: string;
  readonly hover: string;
  readonly active: string;
  readonly focusRing: string;
  readonly disabledFg: string;
  readonly disabledBg: string;
}

export type SpaceStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type RadiusName = 'none' | 'sm' | 'md' | 'lg' | 'full';

export type TypographyRole =
  | 'body'
  | 'bodySm'
  | 'heading'
  | 'headingLg'
  | 'label'
  | 'caption';

export interface TypographyRecord {
  readonly family: string;
  readonly size: number;
  readonly lineHeight: number;
  readonly weight: number;
}

export type MotionName = 'fast' | 'normal' | 'slow';

export interface MotionRecord {
  readonly durationMs: number;
  readonly easing: string;
}

export interface SemanticTokens {
  readonly color: {
    readonly surface: string;
    readonly surfaceRaised: string;
    readonly textPrimary: string;
    readonly textSecondary: string;
    readonly borderSubtle: string;
    readonly tones: Readonly<Record<ToneName, InteractionToneColors>>;
  };
  readonly space: Readonly<Record<SpaceStep, number>>;
  readonly radius: Readonly<Record<RadiusName, number>>;
  readonly typography: Readonly<Record<TypographyRole, TypographyRecord>>;
  readonly motion: Readonly<Record<MotionName, MotionRecord>>;
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
