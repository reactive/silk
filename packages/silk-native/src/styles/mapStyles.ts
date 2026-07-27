/**
 * Map silk-core Theme + recipe variant props → plain RN-compatible style objects.
 * Style shapes are declared locally rather than imported from react-native so
 * the emitted .d.ts stands alone without RN types installed.
 */
import {
  avatarRecipe,
  badgeRecipe,
  boxRecipe,
  buttonRecipe,
  cardRecipe,
  checkboxRecipe,
  compactSpace,
  headingRecipe,
  inlineRecipe,
  inputRecipe,
  mediaScale,
  progressRecipe,
  radioGroupRecipe,
  separatorRecipe,
  skeletonRecipe,
  spinnerRecipe,
  stackRecipe,
  statusDotRecipe,
  surfaceRecipe,
  switchRecipe,
  textRecipe,
  textareaRecipe,
  type AvatarVariantProps,
  type BadgeVariantProps,
  type BoxVariantProps,
  type ButtonVariantProps,
  type CardVariantProps,
  type CheckboxVariantProps,
  type DensityName,
  type ElevationName,
  type HeadingVariantProps,
  type InlineVariantProps,
  type InputVariantProps,
  type ProgressVariantProps,
  type RadioGroupVariantProps,
  type SeparatorVariantProps,
  type SkeletonVariantProps,
  type SpaceStep,
  type SpinnerVariantProps,
  type StackVariantProps,
  type StatusDotVariantProps,
  type SurfaceVariantProps,
  type SwitchVariantProps,
  type TextVariantProps,
  type TextareaVariantProps,
  type Theme,
  type ToneName,
  type TypographyRole,
} from '@reactive/silk-core';
import {
  chEmApproximation,
  controlLineHeightFactor,
  controlMinHeightStep,
  controlSizePadding,
  progressTrackStep,
  resolveSpaceSum,
  spinnerGeometry,
  switchThumbInset,
  switchTrackWidthStep,
  toggleBoxStep,
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
  borderStyle?: 'solid' | 'dotted' | 'dashed' | undefined;
  borderTopColor?: string | undefined;
  borderStartWidth?: number | undefined;
  borderStartColor?: string | undefined;
  alignSelf?: 'flex-start' | 'stretch' | undefined;
  width?: number | `${number}%` | undefined;
  height?: number | `${number}%` | undefined;
  minHeight?: number | undefined;
  minWidth?: number | undefined;
  maxWidth?: number | undefined;
  overflow?: 'hidden' | 'visible' | undefined;
  opacity?: number | undefined;
  shadowColor?: string | undefined;
  shadowOffset?: { readonly width: number; readonly height: number } | undefined;
  shadowOpacity?: number | undefined;
  shadowRadius?: number | undefined;
  elevation?: number | undefined;
  flexShrink?: number | undefined;
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

type RnTypographyStyle = Pick<
  RnTextStyle,
  'fontFamily' | 'fontSize' | 'lineHeight' | 'fontWeight'
>;

function typographyStyle(
  theme: Theme,
  role: TypographyRole,
): RnTypographyStyle {
  const typo = theme.semantic.typography[role];
  return {
    fontFamily: resolveNativeFontFamily(
      theme.semantic.fontFamily[typo.family],
    ),
    fontSize: typo.size,
    lineHeight: typo.lineHeight * typo.size,
    fontWeight: String(typo.weight) as NonNullable<RnTextStyle['fontWeight']>,
  };
}

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

// --- Elevation ---------------------------------------------------------------

type SurfaceElevation = NonNullable<SurfaceVariantProps['elevation']>;

/** Elevation fill — overlay uses surfaceRaised (no surfaceOverlay token). */
export function elevationBackground(
  theme: Theme,
  elevation: SurfaceElevation,
): string {
  switch (elevation) {
    case 'sunken':
      return theme.semantic.color.surfaceSunken;
    case 'flat':
      return theme.semantic.color.surface;
    case 'raised':
    case 'overlay':
      return theme.semantic.color.surfaceRaised;
  }
}

/** Map core ShadowLayer → RN shadow / Android elevation props. */
export function mapShadow(
  theme: Theme,
  level: ElevationName | 'none',
): Pick<
  RnViewStyle,
  | 'shadowColor'
  | 'shadowOffset'
  | 'shadowOpacity'
  | 'shadowRadius'
  | 'elevation'
> {
  if (level === 'none') {
    return {};
  }
  const layer = theme.semantic.shadow[level];
  return {
    shadowColor: '#000',
    shadowOffset: { width: layer.offsetX, height: layer.offsetY },
    shadowOpacity: layer.opacity,
    shadowRadius: layer.blur / 2,
    elevation: layer.offsetY,
  };
}

function elevationShadowLevel(
  elevation: SurfaceElevation,
): ElevationName | 'none' {
  if (elevation === 'raised') return 'raised';
  if (elevation === 'overlay') return 'overlay';
  return 'none';
}

/** Pressed elevation bump mirrors web hover (sunken/flat→raised, raised/overlay→overlay). */
function pressedShadowLevel(
  elevation: SurfaceElevation,
): ElevationName | 'none' {
  if (elevation === 'sunken' || elevation === 'flat') return 'raised';
  return 'overlay';
}

// --- Layout ------------------------------------------------------------------

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
    style.borderStyle = 'solid';
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

  const style: RnTextStyle = {
    color: textToneColor[tone](theme),
    ...typographyStyle(theme, role),
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
      ...typographyStyle(theme, 'label'),
      fontSize: typo.size,
      lineHeight: controlLineHeightFactor * typo.size,
    },
  };
}

// --- Visual primitives -------------------------------------------------------

export function mapSurfaceStyle(
  theme: Theme,
  props: SurfaceVariantProps = {},
  pressed = false,
): RnViewStyle {
  const elevation = props.elevation ?? surfaceRecipe.defaults.elevation;
  const radius = props.radius ?? surfaceRecipe.defaults.radius;
  const border = props.border ?? surfaceRecipe.defaults.border;
  const interactive = props.interactive ?? surfaceRecipe.defaults.interactive;
  const shadowLevel =
    pressed && interactive === 'true'
      ? pressedShadowLevel(elevation)
      : elevationShadowLevel(elevation);

  return {
    backgroundColor: elevationBackground(theme, elevation),
    borderRadius: theme.semantic.radius[radius],
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor:
      border === 'subtle' ? theme.semantic.color.borderSubtle : 'transparent',
    ...mapShadow(theme, shadowLevel),
  };
}

export function mapCardStyle(
  theme: Theme,
  props: CardVariantProps = {},
  density: DensityName = 'comfortable',
  pressed = false,
): RnViewStyle {
  const elevation = props.elevation ?? cardRecipe.defaults.elevation;
  const padding = resolveSpaceStep(props.padding, cardRecipe.defaults.padding);
  const radius = props.radius ?? cardRecipe.defaults.radius;
  const interactive = props.interactive ?? cardRecipe.defaults.interactive;
  const space = spaceScale(theme, density);
  const shadowLevel =
    pressed && interactive === 'true'
      ? pressedShadowLevel(elevation)
      : elevationShadowLevel(elevation);

  return {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: space[2],
    padding: space[padding],
    backgroundColor: elevationBackground(theme, elevation),
    borderRadius: theme.semantic.radius[radius],
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.semantic.color.borderSubtle,
    ...mapShadow(theme, shadowLevel),
  };
}

const levelToDefaultSize = {
  '1': 'xl',
  '2': 'lg',
  '3': 'md',
  '4': 'sm',
  '5': 'sm',
  '6': 'sm',
} as const satisfies Record<
  NonNullable<HeadingVariantProps['level']>,
  NonNullable<HeadingVariantProps['size']>
>;

const headingSizeToRole = {
  sm: 'headingSm',
  md: 'heading',
  lg: 'headingLg',
  xl: 'headingXl',
} as const satisfies Record<
  NonNullable<HeadingVariantProps['size']>,
  TypographyRole
>;

export function mapHeadingStyle(
  theme: Theme,
  props: HeadingVariantProps = {},
): RnTextStyle {
  const level = props.level ?? headingRecipe.defaults.level;
  const size = props.size ?? levelToDefaultSize[level];
  const tone = props.tone ?? headingRecipe.defaults.tone;
  const role = headingSizeToRole[size];
  return {
    color: textToneColor[tone](theme),
    ...typographyStyle(theme, role),
  };
}

export function mapBadgeStyle(
  theme: Theme,
  props: BadgeVariantProps = {},
  density: DensityName = 'comfortable',
): { view: RnViewStyle; text: RnTextStyle } {
  const variant = props.variant ?? badgeRecipe.defaults.variant;
  const toneName = props.tone ?? badgeRecipe.defaults.tone;
  const size = props.size ?? badgeRecipe.defaults.size;
  const tone = theme.semantic.color.tones[toneName];
  const space = spaceScale(theme, density);
  const typoRole = size === 'sm' ? 'caption' : 'label';

  let backgroundColor = 'transparent';
  let color = tone.text;
  let borderColor = 'transparent';
  if (variant === 'solid') {
    backgroundColor = tone.solid;
    color = tone.onSolid;
  } else if (variant === 'soft') {
    backgroundColor = tone.subtle;
    color = tone.text;
  } else {
    borderColor = tone.border;
  }

  return {
    view: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.semantic.radius.full,
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor,
      backgroundColor,
      minHeight: size === 'sm' ? space[4] + space[1] : space[5],
      paddingTop: size === 'sm' ? 0 : space[1],
      paddingBottom: size === 'sm' ? 0 : space[1],
      paddingLeft: size === 'sm' ? space[1] : space[2],
      paddingRight: size === 'sm' ? space[1] : space[2],
    },
    text: {
      color,
      ...typographyStyle(theme, typoRole),
    },
  };
}

export function mapSeparatorStyle(
  theme: Theme,
  props: SeparatorVariantProps = {},
): RnViewStyle {
  const orientation = props.orientation ?? separatorRecipe.defaults.orientation;
  const base: RnViewStyle = {
    backgroundColor: theme.semantic.color.borderSubtle,
    alignSelf: 'stretch',
    flexShrink: 0,
  };
  if (orientation === 'vertical') {
    return { ...base, width: 1 };
  }
  return { ...base, height: 1 };
}

const avatarRadius = {
  circle: 'full',
  rounded: 'md',
  square: 'none',
} as const satisfies Record<
  NonNullable<AvatarVariantProps['shape']>,
  keyof Theme['semantic']['radius']
>;

export function mapAvatarStyle(
  theme: Theme,
  props: AvatarVariantProps = {},
): { view: RnViewStyle; text: RnTextStyle } {
  const size = props.size ?? avatarRecipe.defaults.size;
  const shape = props.shape ?? avatarRecipe.defaults.shape;
  const edge = mediaScale[size].media;
  return {
    view: {
      width: edge,
      height: edge,
      borderRadius: theme.semantic.radius[avatarRadius[shape]],
      overflow: 'hidden',
      backgroundColor: theme.semantic.color.tones.neutral.subtle,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    text: {
      color: theme.semantic.color.textSecondary,
      ...typographyStyle(theme, 'label'),
      fontSize: edge * 0.4,
      lineHeight: edge * 0.4,
    },
  };
}

export function mapStatusDotStyle(
  theme: Theme,
  props: StatusDotVariantProps = {},
  density: DensityName = 'comfortable',
): RnViewStyle {
  const toneName = props.tone ?? statusDotRecipe.defaults.tone;
  const size = props.size ?? statusDotRecipe.defaults.size;
  const space = spaceScale(theme, density);
  const edge = size === 'sm' ? space[2] : space[3];
  return {
    width: edge,
    height: edge,
    borderRadius: theme.semantic.radius.full,
    backgroundColor: theme.semantic.color.tones[toneName].solid,
    flexShrink: 0,
  };
}

export function mapSkeletonStyle(
  theme: Theme,
  props: SkeletonVariantProps = {},
  density: DensityName = 'comfortable',
): RnViewStyle {
  const shape = props.shape ?? skeletonRecipe.defaults.shape;
  const space = spaceScale(theme, density);
  const base: RnViewStyle = {
    backgroundColor: theme.semantic.color.borderSubtle,
  };
  if (shape === 'circle') {
    return {
      ...base,
      width: space[8],
      height: space[8],
      borderRadius: theme.semantic.radius.full,
    };
  }
  if (shape === 'rect') {
    return {
      ...base,
      width: '100%',
      minHeight: space[8],
      borderRadius: theme.semantic.radius.md,
    };
  }
  return {
    ...base,
    width: '100%',
    height: theme.semantic.typography.body.size,
    borderRadius: theme.semantic.radius.sm,
  };
}

export function mapSpinnerStyle(
  theme: Theme,
  props: SpinnerVariantProps = {},
  density: DensityName = 'comfortable',
  reducedMotion = false,
): RnViewStyle {
  const size = props.size ?? spinnerRecipe.defaults.size;
  const toneName = props.tone ?? spinnerRecipe.defaults.tone;
  const space = spaceScale(theme, density);
  const geo = spinnerGeometry[size];
  const edge = space[geo.sizeStep];
  const tone = theme.semantic.color.tones[toneName];
  return {
    width: edge,
    height: edge,
    borderRadius: theme.semantic.radius.full,
    borderWidth: geo.border,
    borderStyle: reducedMotion ? 'dotted' : 'solid',
    borderColor: tone.subtle,
    borderTopColor: tone.solid,
  };
}

export function mapProgressStyle(
  theme: Theme,
  props: ProgressVariantProps = {},
  density: DensityName = 'comfortable',
): { track: RnViewStyle; indicator: RnViewStyle } {
  const size = props.size ?? progressRecipe.defaults.size;
  const toneName = props.tone ?? progressRecipe.defaults.tone;
  const space = spaceScale(theme, density);
  const height = space[progressTrackStep[size]];
  const tone = theme.semantic.color.tones[toneName];
  return {
    track: {
      width: '100%',
      height,
      borderRadius: theme.semantic.radius.full,
      backgroundColor: theme.semantic.color.surfaceSunken,
      overflow: 'hidden',
    },
    indicator: {
      height,
      borderRadius: theme.semantic.radius.full,
      backgroundColor: tone.solid,
    },
  };
}

// --- Forms -------------------------------------------------------------------

export type TextControlState = {
  readonly focused?: boolean;
  readonly invalid?: boolean;
  readonly disabled?: boolean;
};

export function mapInputStyle(
  theme: Theme,
  props: InputVariantProps = {},
  density: DensityName = 'comfortable',
  state: TextControlState = {},
): RnTextStyle & RnViewStyle {
  const size = props.size ?? inputRecipe.defaults.size;
  const resolvedDensity = props.density ?? density;
  const space = spaceScale(theme, resolvedDensity);
  const pad = controlSizePadding[size];
  const minHeight = resolveSpaceSum(space, controlMinHeightStep[size]);

  let borderColor = theme.semantic.color.borderSubtle;
  let backgroundColor = theme.semantic.color.surfaceSunken;
  let color = theme.semantic.color.textPrimary;

  if (state.disabled) {
    const tone = theme.semantic.color.tones.neutral;
    backgroundColor = tone.disabledBg;
    color = tone.disabledFg;
    borderColor = 'transparent';
  } else if (state.invalid) {
    borderColor = theme.semantic.color.tones.danger.solid;
  } else if (state.focused) {
    borderColor = theme.semantic.color.tones.accent.border;
  }

  return {
    minHeight,
    paddingTop: space[pad.py],
    paddingBottom: space[pad.py],
    paddingLeft: space[pad.px],
    paddingRight: space[pad.px],
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor,
    borderRadius: theme.semantic.radius.md,
    backgroundColor,
    color,
    ...typographyStyle(theme, size === 'sm' ? 'bodySm' : 'body'),
  };
}

export function mapTextareaStyle(
  theme: Theme,
  props: TextareaVariantProps = {},
  density: DensityName = 'comfortable',
  state: TextControlState = {},
): RnTextStyle & RnViewStyle {
  const size = props.size ?? textareaRecipe.defaults.size;
  const resolvedDensity = props.density ?? density;
  const space = spaceScale(theme, resolvedDensity);
  const inputProps: InputVariantProps = {
    size,
    ...(props.density !== undefined ? { density: props.density } : {}),
  };
  const base = mapInputStyle(theme, inputProps, resolvedDensity, state);
  // Web: min-height: space-8 × 2
  return {
    ...base,
    minHeight: space[8] * 2,
  };
}

export type ToggleVisualState = {
  readonly checked?: boolean | 'indeterminate';
  readonly invalid?: boolean;
  readonly disabled?: boolean;
};

export function mapCheckboxStyle(
  theme: Theme,
  props: CheckboxVariantProps = {},
  density: DensityName = 'comfortable',
  state: ToggleVisualState = {},
): RnViewStyle {
  const size = props.size ?? checkboxRecipe.defaults.size;
  const toneName = props.tone ?? checkboxRecipe.defaults.tone;
  const space = spaceScale(theme, density);
  const edge = space[toggleBoxStep[size]];
  const tone = theme.semantic.color.tones[toneName];
  const checked = state.checked === true || state.checked === 'indeterminate';

  let backgroundColor = theme.semantic.color.surfaceSunken;
  let borderColor = tone.border;
  if (state.disabled) {
    backgroundColor = tone.disabledBg;
    borderColor = 'transparent';
  } else if (checked) {
    backgroundColor = tone.solid;
    borderColor = tone.solid;
  }
  if (state.invalid && !state.disabled) {
    borderColor = theme.semantic.color.tones.danger.solid;
  }

  return {
    width: edge,
    height: edge,
    borderRadius: theme.semantic.radius.sm,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor,
    backgroundColor,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };
}

export function mapSwitchStyle(
  theme: Theme,
  props: SwitchVariantProps = {},
  density: DensityName = 'comfortable',
  state: { readonly checked?: boolean; readonly invalid?: boolean; readonly disabled?: boolean } = {},
): { track: RnViewStyle; thumb: RnViewStyle; travel: number } {
  const size = props.size ?? switchRecipe.defaults.size;
  const toneName = props.tone ?? switchRecipe.defaults.tone;
  const space = spaceScale(theme, density);
  const trackHeight = space[toggleBoxStep[size]];
  const trackWidth = resolveSpaceSum(space, switchTrackWidthStep[size]);
  const tone = theme.semantic.color.tones[toneName];
  const thumbSize = trackHeight - switchThumbInset * 2;
  const travel = trackWidth - thumbSize - switchThumbInset * 2;

  let trackBg = theme.semantic.color.borderSubtle;
  if (state.disabled) {
    trackBg = tone.disabledBg;
  } else if (state.checked) {
    trackBg = tone.solid;
  }

  return {
    track: {
      width: trackWidth,
      height: trackHeight,
      borderRadius: theme.semantic.radius.full,
      backgroundColor: trackBg,
      borderWidth: state.invalid && !state.disabled ? 1 : 0,
      borderStyle: 'solid',
      borderColor:
        state.invalid && !state.disabled
          ? theme.semantic.color.tones.danger.solid
          : 'transparent',
      justifyContent: 'center',
      flexShrink: 0,
    },
    thumb: {
      width: thumbSize,
      height: thumbSize,
      borderRadius: theme.semantic.radius.full,
      backgroundColor: state.disabled
        ? tone.disabledBg
        : theme.semantic.color.surface,
      ...mapShadow(theme, 'raised'),
    },
    travel,
  };
}

export function mapRadioGroupStyle(
  theme: Theme,
  props: RadioGroupVariantProps = {},
  density: DensityName = 'comfortable',
): { root: RnViewStyle; item: RnViewStyle; indicator: RnViewStyle } {
  const orientation =
    props.orientation ?? radioGroupRecipe.defaults.orientation;
  const space = spaceScale(theme, density);
  const { item, indicator } = mapRadioItemStyle(theme, props, density);

  return {
    root: {
      flexDirection: orientation === 'horizontal' ? 'row' : 'column',
      flexWrap: orientation === 'horizontal' ? 'wrap' : 'nowrap',
      alignItems: orientation === 'horizontal' ? 'center' : 'stretch',
      gap: space[2],
    },
    item,
    indicator,
  };
}

export function mapRadioItemStyle(
  theme: Theme,
  props: RadioGroupVariantProps = {},
  density: DensityName = 'comfortable',
  state: ToggleVisualState = {},
): { item: RnViewStyle; indicator: RnViewStyle } {
  const size = props.size ?? radioGroupRecipe.defaults.size;
  const toneName = props.tone ?? radioGroupRecipe.defaults.tone;
  const space = spaceScale(theme, density);
  const edge = space[toggleBoxStep[size]];
  const tone = theme.semantic.color.tones[toneName];
  let borderColor = tone.border;
  let backgroundColor = theme.semantic.color.surfaceSunken;
  if (state.disabled) {
    backgroundColor = tone.disabledBg;
    borderColor = 'transparent';
  } else if (state.checked === true) {
    borderColor = tone.solid;
  }
  if (state.invalid && !state.disabled) {
    borderColor = theme.semantic.color.tones.danger.solid;
  }
  return {
    item: {
      width: edge,
      height: edge,
      borderRadius: theme.semantic.radius.full,
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor,
      backgroundColor,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    indicator: {
      width: edge * 0.5,
      height: edge * 0.5,
      borderRadius: theme.semantic.radius.full,
      backgroundColor: tone.solid,
    },
  };
}

/** Indicator color for checked/indeterminate checkbox glyphs. */
export function checkboxIndicatorColor(
  theme: Theme,
  toneName: ToneName,
  disabled: boolean,
): string {
  const tone = theme.semantic.color.tones[toneName];
  return disabled ? tone.disabledFg : tone.onSolid;
}
