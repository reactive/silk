import {
  boxRecipe,
  inlineRecipe,
  stackRecipe,
  type BoxVariantProps,
  type DensityName,
  type InlineVariantProps,
  type StackVariantProps,
  type Theme,
} from '@reactive/silk-core';
import {
  resolveSpaceStep,
  spaceScale,
  type RnViewStyle,
} from './shared.js';

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
