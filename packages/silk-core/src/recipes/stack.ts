import { spaceVariantSteps } from '../tokens/scales.js';
import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';

const stackVariants: {
  readonly direction: readonly ['row', 'column'];
  readonly gap: typeof spaceVariantSteps;
  readonly align: readonly ['start', 'center', 'end', 'stretch'];
  readonly wrap: readonly ['nowrap', 'wrap'];
} = {
  direction: ['row', 'column'],
  gap: spaceVariantSteps,
  align: ['start', 'center', 'end', 'stretch'],
  wrap: ['nowrap', 'wrap'],
};

export const stackRecipe: Recipe<typeof stackVariants> = defineRecipe({
  variants: stackVariants,
  defaults: {
    direction: 'column',
    gap: '2',
    align: 'stretch',
    wrap: 'nowrap',
  },
});

export type StackVariantProps = VariantProps<typeof stackRecipe>;
