/**
 * Map silk-core Theme + recipe variant props → plain RN-compatible style objects.
 * Style shapes are declared locally rather than imported from react-native so
 * the emitted .d.ts stands alone without RN types installed.
 */
import {
  boxRecipe,
  buttonRecipe,
  compactSpace,
  inlineRecipe,
  stackRecipe,
  textRecipe,
  type BoxVariantProps,
  type ButtonVariantProps,
  type DensityName,
  type InlineVariantProps,
  type SpaceStep,
  type StackVariantProps,
  type TextVariantProps,
  type Theme,
  type ToneName,
} from '@reactive/silk-core';
import {
  chEmApproximation,
  controlLineHeightFactor,
  controlSizePadding,
} from './controlGeometry.js';

export type RnViewStyle = {
  padding?: number | undefined;
  paddingTop?: number | undefined;
  paddingBottom?: number | undefined;
  paddingLeft?: number | undefined;
  paddingRight?: number | undefined;
  paddingStart?: number | undefined;
  backgroundColor?: string | undefined;
  flexDirection?:
    | 'row'
    | 'column'
    | 'row-reverse'
    | 'column-reverse'
    | undefined;
  alignItems?:
    | 'flex-start'
    | 'center'
    | 'flex-end'
    | 'stretch'
    | 'baseline'
    | undefined;
  justifyContent?:
    | 'flex-start'
    | 'center'
    | 'flex-end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly'
    | undefined;
  flexWrap?: 'nowrap' | 'wrap' | undefined;
  gap?: number | undefined;
  borderRadius?: number | undefined;
  borderWidth?: number | undefined;
  borderColor?: string | undefined;
  borderStyle?: 'solid' | undefined;
  borderStartWidth?: number | undefined;
  borderStartColor?: string | undefined;
  alignSelf?: 'flex-start' | undefined;
};

export type RnTextStyle = {
  color?: string | undefined;
  fontFamily?: string | undefined;
  fontSize?: number | undefined;
  /** RN uses absolute lineHeight; callers multiply unitless × size. */
  lineHeight?: number | undefined;
  fontWeight?:
    | 'normal'
    | 'bold'
    | '100'
    | '200'
    | '300'
    | '400'
    | '500'
    | '600'
    | '700'
    | '800'
    | '900'
    | undefined;
  maxWidth?: number | undefined;
};

const alignMap = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  baseline: 'baseline',
} as const satisfies Record<
  NonNullable<InlineVariantProps['align']>,
  NonNullable<RnViewStyle['alignItems']>
>;

const justifyMap = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
} as const satisfies Record<
  NonNullable<StackVariantProps['justify']>,
  NonNullable<RnViewStyle['justifyContent']>
>;

const textToneColor = {
  primary: (theme: Theme) => theme.semantic.color.textPrimary,
  secondary: (theme: Theme) => theme.semantic.color.textSecondary,
  accent: (theme: Theme) => theme.semantic.color.tones.accent.text,
  danger: (theme: Theme) => theme.semantic.color.tones.danger.text,
  success: (theme: Theme) => theme.semantic.color.tones.success.text,
} as const satisfies Record<
  NonNullable<TextVariantProps['tone']>,
  (theme: Theme) => string
>;

function spaceScale(
  theme: Theme,
  density: DensityName,
): Readonly<Record<SpaceStep, number>> {
  return density === 'compact' ? compactSpace : theme.semantic.space;
}

function resolveSpaceStep(
  step: `${SpaceStep}` | undefined,
  fallback: `${SpaceStep}`,
): SpaceStep {
  const raw = step ?? fallback;
  return Number(raw) as SpaceStep;
}

/** CSS generic families name no real face — RN wants the platform default instead. */
const cssGenericFamilies: ReadonlySet<string> = new Set([
  'ui-sans-serif',
  'ui-serif',
  'ui-monospace',
  'ui-rounded',
  'system-ui',
  'sans-serif',
  'serif',
  'monospace',
  'cursive',
  'fantasy',
]);

// Keyed by whole stack; a theme has three, so this stays bounded in practice.
const nativeFontFamilyCache = new Map<string, string | undefined>();

/** Peel a CSS font-family stack to a single face for RN. */
export function resolveNativeFontFamily(stack: string): string | undefined {
  if (nativeFontFamilyCache.has(stack)) {
    return nativeFontFamilyCache.get(stack);
  }
  const primary = stack
    .split(',')[0]
    ?.trim()
    .replace(/^["']|["']$/g, '');
  const face =
    !primary || cssGenericFamilies.has(primary) ? undefined : primary;
  nativeFontFamilyCache.set(stack, face);
  return face;
}

export function mapBoxStyle(
  theme: Theme,
  props: BoxVariantProps = {},
  density: DensityName = 'comfortable',
): RnViewStyle {
  const padding = resolveSpaceStep(props.padding, boxRecipe.defaults.padding);
  const space = spaceScale(theme, density);
  return {
    padding: space[padding],
    backgroundColor: theme.semantic.color.surface,
  };
}

export function mapStackStyle(
  theme: Theme,
  props: StackVariantProps = {},
  density: DensityName = 'comfortable',
): RnViewStyle {
  const gap = resolveSpaceStep(props.gap, stackRecipe.defaults.gap);
  const align = props.align ?? stackRecipe.defaults.align;
  const justify = props.justify ?? stackRecipe.defaults.justify;
  const rail = props.rail ?? stackRecipe.defaults.rail;
  const space = spaceScale(theme, density);

  const style: RnViewStyle = {
    flexDirection: 'column',
    alignItems: alignMap[align],
    justifyContent: justifyMap[justify],
    gap: space[gap],
  };

  if (rail === 'start') {
    // Logical start edge — mirrors web `border-inline-start` for RTL.
    style.borderStartWidth = 1;
    style.borderStartColor = theme.semantic.color.borderSubtle;
    style.paddingStart = space[3];
  }

  return style;
}

export function mapInlineStyle(
  theme: Theme,
  props: InlineVariantProps = {},
  density: DensityName = 'comfortable',
): RnViewStyle {
  const gap = resolveSpaceStep(props.gap, inlineRecipe.defaults.gap);
  const align = props.align ?? inlineRecipe.defaults.align;
  const justify = props.justify ?? inlineRecipe.defaults.justify;
  const wrap = props.wrap ?? inlineRecipe.defaults.wrap;
  const direction = props.direction ?? inlineRecipe.defaults.direction;
  const space = spaceScale(theme, density);

  return {
    flexDirection: direction,
    flexWrap: wrap,
    alignItems: alignMap[align],
    justifyContent: justifyMap[justify],
    gap: space[gap],
  };
}

export function mapTextStyle(
  theme: Theme,
  props: TextVariantProps = {},
): RnTextStyle {
  const role = props.role ?? textRecipe.defaults.role;
  const tone = props.tone ?? textRecipe.defaults.tone;
  const measure = props.measure ?? textRecipe.defaults.measure;
  const typo = theme.semantic.typography[role];
  const weight = String(typo.weight) as NonNullable<RnTextStyle['fontWeight']>;

  const style: RnTextStyle = {
    color: textToneColor[tone](theme),
    fontFamily: resolveNativeFontFamily(
      theme.semantic.fontFamily[typo.family],
    ),
    fontSize: typo.size,
    lineHeight: typo.lineHeight * typo.size,
    fontWeight: weight,
  };

  if (measure === 'prose') {
    style.maxWidth =
      typo.size * theme.semantic.measure.prose * chEmApproximation;
  }

  return style;
}

const sizeFontRole = {
  sm: 'label',
  md: 'label',
  lg: 'body',
} as const satisfies Record<
  NonNullable<ButtonVariantProps['size']>,
  'label' | 'body'
>;

function buttonColors(
  theme: Theme,
  variant: NonNullable<ButtonVariantProps['variant']>,
  toneName: ToneName,
  pressed: boolean,
  disabled: boolean,
): { backgroundColor: string; color: string; borderColor: string } {
  const tone = theme.semantic.color.tones[toneName];

  if (disabled) {
    return {
      backgroundColor: tone.disabledBg,
      color: tone.disabledFg,
      borderColor: 'transparent',
    };
  }

  if (variant === 'solid') {
    return {
      backgroundColor: pressed ? tone.active : tone.solid,
      color: tone.onSolid,
      borderColor: 'transparent',
    };
  }

  if (variant === 'soft') {
    return {
      backgroundColor: pressed ? tone.subtleActive : tone.subtle,
      color: tone.text,
      borderColor: 'transparent',
    };
  }

  return {
    backgroundColor: pressed ? tone.subtleActive : 'transparent',
    color: tone.text,
    borderColor: variant === 'outline' ? tone.border : 'transparent',
  };
}

export function mapButtonStyle(
  theme: Theme,
  props: ButtonVariantProps = {},
  pressed = false,
  disabled = false,
): { view: RnViewStyle; text: RnTextStyle } {
  const variant = props.variant ?? buttonRecipe.defaults.variant;
  const toneName = props.tone ?? buttonRecipe.defaults.tone;
  const size = props.size ?? buttonRecipe.defaults.size;
  const density = props.density ?? buttonRecipe.defaults.density;
  const space = spaceScale(theme, density);
  const pad = controlSizePadding[size];
  const fontRole = sizeFontRole[size];
  const typo = theme.semantic.typography[fontRole];
  const label = theme.semantic.typography.label;
  const radius = theme.semantic.radius.md;
  const colors = buttonColors(theme, variant, toneName, pressed, disabled);

  return {
    view: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: space[1],
      paddingTop: space[pad.py],
      paddingBottom: space[pad.py],
      paddingLeft: space[pad.px],
      paddingRight: space[pad.px],
      borderRadius: radius,
      // Every variant keeps a 1px border so ghost/outline match solid sizing (web parity).
      borderWidth: 1,
      borderColor: colors.borderColor,
      borderStyle: 'solid',
      backgroundColor: colors.backgroundColor,
    },
    text: {
      color: colors.color,
      fontFamily: resolveNativeFontFamily(
        theme.semantic.fontFamily[label.family],
      ),
      fontSize: typo.size,
      lineHeight: controlLineHeightFactor * typo.size,
      fontWeight: String(label.weight) as NonNullable<RnTextStyle['fontWeight']>,
    },
  };
}
