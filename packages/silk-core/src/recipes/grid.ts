import { spaceVariantSteps } from '../tokens/scales.js';
import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';

const gridVariants: {
  readonly columns: readonly ['1', '2', '3', '4', '5', '6', 'auto'];
  readonly gap: typeof spaceVariantSteps;
  readonly align: readonly ['start', 'center', 'end', 'stretch'];
} = {
  columns: ['1', '2', '3', '4', '5', '6', 'auto'],
  gap: spaceVariantSteps,
  align: ['start', 'center', 'end', 'stretch'],
};

export const gridRecipe: Recipe<typeof gridVariants> = defineRecipe({
  variants: gridVariants,
  defaults: {
    columns: 'auto',
    gap: '2',
    align: 'stretch',
  },
});

export type GridVariantProps = VariantProps<typeof gridRecipe>;
