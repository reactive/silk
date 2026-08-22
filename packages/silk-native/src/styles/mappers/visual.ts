import {
  avatarRecipe,
  badgeRecipe,
  cardRecipe,
  headingRecipe,
  mediaScale,
  progressRecipe,
  separatorRecipe,
  skeletonRecipe,
  spinnerRecipe,
  statusDotRecipe,
  surfaceRecipe,
  textRecipe,
  type AvatarVariantProps,
  type BadgeVariantProps,
  type CardVariantProps,
  type DensityName,
  type ElevationName,
  type HeadingVariantProps,
  type ProgressVariantProps,
  type SeparatorVariantProps,
  type SkeletonVariantProps,
  type SpinnerVariantProps,
  type StatusDotVariantProps,
  type SurfaceVariantProps,
  type TextVariantProps,
  type Theme,
  type TypographyRole,
} from '@reactive/silk-core';
import {
  chEmApproximation,
  progressTrackStep,
  spinnerGeometry,
} from '../controlGeometry.js';
import {
  mapShadow,
  resolveSpaceStep,
  spaceScale,
  typographyStyle,
  type RnTextStyle,
  type RnViewStyle,
} from './shared.js';

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

  return {
    ...mapSurfaceStyle(
      theme,
      { elevation, radius, border: 'subtle', interactive },
      pressed,
    ),
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: space[2],
    padding: space[padding],
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
  return orientation === 'vertical'
    ? { ...base, width: 1 }
    : { ...base, height: 1 };
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
