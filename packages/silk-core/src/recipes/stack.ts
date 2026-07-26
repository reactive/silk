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
  readonly rail: readonly ['none', 'start'];
} = {
  direction: ['row', 'column'],
  gap: spaceVariantSteps,
  align: ['start', 'center', 'end', 'stretch'],
  wrap: ['nowrap', 'wrap'],
  rail: ['none', 'start'],
};

export const stackRecipe: Recipe<typeof stackVariants> = defineRecipe({
  variants: stackVariants,
  defaults: {
    direction: 'column',
    gap: '2',
    align: 'stretch',
    wrap: 'nowrap',
    rail: 'none',
  },
});

export type StackVariantProps = VariantProps<typeof stackRecipe>;
