import { spaceVariantSteps } from '../tokens/scales.js';
import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';

/**
 * `align` and `justify` are both item-level: they place each item inside its
 * own track (`align-items` / `justify-items`). Track distribution is not an
 * axis because `columns` always produces `1fr` tracks that consume the row.
 */
const itemPlacement = ['start', 'center', 'end', 'stretch'] as const;

const gridVariants: {
  readonly columns: readonly ['1', '2', '3', '4', '5', '6', 'auto'];
  readonly gap: typeof spaceVariantSteps;
  readonly align: typeof itemPlacement;
  readonly justify: typeof itemPlacement;
} = {
  columns: ['1', '2', '3', '4', '5', '6', 'auto'],
  gap: spaceVariantSteps,
  align: itemPlacement,
  justify: itemPlacement,
};

export const gridRecipe: Recipe<typeof gridVariants> = defineRecipe({
  variants: gridVariants,
  defaults: {
    columns: 'auto',
    gap: '2',
    align: 'stretch',
    justify: 'stretch',
  },
});

export type GridVariantProps = VariantProps<typeof gridRecipe>;
