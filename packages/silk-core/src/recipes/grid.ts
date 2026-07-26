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
const gridVariants: {
  readonly columns: readonly ['1', '2', '3', '4', '5', '6', 'auto'];
  readonly gap: typeof spaceVariantSteps;
  readonly align: readonly ['start', 'center', 'end', 'stretch'];
  readonly justify: readonly ['start', 'center', 'end', 'stretch'];
} = {
  columns: ['1', '2', '3', '4', '5', '6', 'auto'],
  gap: spaceVariantSteps,
  align: ['start', 'center', 'end', 'stretch'],
  justify: ['start', 'center', 'end', 'stretch'],
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
