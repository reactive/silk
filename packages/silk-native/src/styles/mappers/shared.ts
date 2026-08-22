import {
  compactSpace,
  type DensityName,
  type ElevationName,
  type SpaceStep,
  type Theme,
  type TypographyRole,
} from '@reactive/silk-core';

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
  outlineWidth?: number | undefined;
  outlineColor?: string | undefined;
  outlineStyle?: 'solid' | 'dotted' | 'dashed' | undefined;
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

type RnTypographyStyle = Pick<
  RnTextStyle,
  'fontFamily' | 'fontSize' | 'lineHeight' | 'fontWeight'
>;

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

export function typographyStyle(
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

export function spaceScale(
  theme: Theme,
  density: DensityName,
): Readonly<Record<SpaceStep, number>> {
  return density === 'compact' ? compactSpace : theme.semantic.space;
}

export function resolveSpaceStep(
  step: `${SpaceStep}` | undefined,
  fallback: `${SpaceStep}`,
): SpaceStep {
  return Number(step ?? fallback) as SpaceStep;
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
