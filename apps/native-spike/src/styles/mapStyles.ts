/**
 * Map silk-core Theme + recipe variant props → plain RN-compatible style objects.
 * No React Native imports — keep this runnable from Node smoke tests.
 */
import {
  boxRecipe,
  buttonRecipe,
  compactSpace,
  stackRecipe,
  textRecipe,
  type BoxVariantProps,
  type ButtonVariantProps,
  type DensityName,
  type SpaceStep,
  type StackVariantProps,
  type TextVariantProps,
  type Theme,
} from '@reactive/silk-core';

export type RnViewStyle = {
  padding?: number;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  backgroundColor?: string;
  flexDirection?: 'row' | 'column';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  flexWrap?: 'nowrap' | 'wrap';
  gap?: number;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: 'solid';
  opacity?: number;
  alignSelf?: 'flex-start';
};

export type RnTextStyle = {
  color?: string;
  fontFamily?: string;
  fontSize?: number;
  /** RN uses absolute lineHeight; callers multiply unitless × size. */
  lineHeight?: number;
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
    | '900';
};

const alignMap = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
} as const;

function spaceScale(
  theme: Theme,
  density: DensityName,
): Readonly<Record<SpaceStep, number>> {
  return density === 'compact' ? compactSpace : theme.semantic.space;
}

function resolveSpaceStep(
  step: string | undefined,
  fallback: string,
): SpaceStep {
  const raw = step ?? fallback;
  return Number(raw) as SpaceStep;
}

/** Web default stacks are CSS font-family lists; RN needs a single face. */
export function resolveNativeFontFamily(family: string): string | undefined {
  const primary = family.split(',')[0]?.trim();
  if (!primary || primary === 'ui-sans-serif' || primary === 'system-ui') {
    // Let RN pick the platform default (omit fontFamily).
    return undefined;
  }
  return primary.replace(/^["']|["']$/g, '');
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
  const direction = props.direction ?? stackRecipe.defaults.direction;
  const gap = resolveSpaceStep(props.gap, stackRecipe.defaults.gap);
  const align = props.align ?? stackRecipe.defaults.align;
  const wrap = props.wrap ?? stackRecipe.defaults.wrap;
  const space = spaceScale(theme, density);

  return {
    flexDirection: direction,
    alignItems: alignMap[align],
    flexWrap: wrap,
    gap: space[gap],
  };
}

export function mapTextStyle(
  theme: Theme,
  props: TextVariantProps = {},
): RnTextStyle {
  const role = props.role ?? textRecipe.defaults.role;
  const tone = props.tone ?? textRecipe.defaults.tone;
  const typo = theme.semantic.typography[role];
  const { color } = theme.semantic;

  const toneColor =
    tone === 'primary'
      ? color.textPrimary
      : tone === 'secondary'
        ? color.textSecondary
        : tone === 'accent'
          ? color.tones.accent.solid
          : color.tones.danger.solid;

  const weight = String(typo.weight) as NonNullable<RnTextStyle['fontWeight']>;

  return {
    color: toneColor,
    fontFamily: resolveNativeFontFamily(typo.family),
    fontSize: typo.size,
    lineHeight: typo.lineHeight * typo.size,
    fontWeight: weight,
  };
}

const sizePadding: Record<
  NonNullable<ButtonVariantProps['size']>,
  { py: SpaceStep; px: SpaceStep }
> = {
  sm: { py: 1, px: 2 },
  md: { py: 2, px: 3 },
  lg: { py: 3, px: 4 },
};

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
  const tone = theme.semantic.color.tones[toneName];
  const space = spaceScale(theme, density);
  const pad = sizePadding[size];
  const label = theme.semantic.typography.label;
  const body = theme.semantic.typography.body;
  const fontSize = size === 'lg' ? body.size : label.size;
  const radius = theme.semantic.radius.md;

  let backgroundColor: string | undefined;
  let color: string;
  let borderColor = 'transparent';
  let borderWidth = 1;

  if (disabled) {
    backgroundColor = tone.disabledBg;
    color = tone.disabledFg;
    borderColor = 'transparent';
  } else if (variant === 'solid') {
    backgroundColor = pressed ? tone.active : tone.solid;
    color = tone.onSolid;
  } else if (variant === 'soft') {
    backgroundColor = pressed ? tone.border : tone.subtle;
    color = tone.solid;
  } else if (variant === 'outline') {
    backgroundColor = pressed ? tone.subtle : 'transparent';
    color = tone.solid;
    borderColor = tone.border;
  } else {
    // ghost
    backgroundColor = pressed ? tone.subtle : 'transparent';
    color = tone.solid;
    borderWidth = 0;
  }

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
      borderWidth,
      borderColor,
      borderStyle: 'solid',
      backgroundColor,
      opacity: disabled ? 0.9 : 1,
    },
    text: {
      color,
      fontFamily: resolveNativeFontFamily(label.family),
      fontSize,
      lineHeight: 1.2 * fontSize,
      fontWeight: String(label.weight) as NonNullable<RnTextStyle['fontWeight']>,
    },
  };
}
