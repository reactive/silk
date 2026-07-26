import { spaceVariantSteps } from '../tokens/scales.js';
import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';

/**
 * Vertical-only. `align` is always the horizontal (cross) axis and `justify`
 * always the vertical (main) axis, so the standard flexbox reading of both
 * names holds at every call site.
 */
const stackVariants: {
  readonly gap: typeof spaceVariantSteps;
  readonly align: readonly ['start', 'center', 'end', 'stretch'];
  readonly justify: readonly [
    'start',
    'center',
    'end',
    'between',
    'around',
    'evenly',
  ];
  readonly rail: readonly ['none', 'start'];
} = {
  gap: spaceVariantSteps,
  align: ['start', 'center', 'end', 'stretch'],
  justify: ['start', 'center', 'end', 'between', 'around', 'evenly'],
  rail: ['none', 'start'],
};

export const stackRecipe: Recipe<typeof stackVariants> = defineRecipe({
  variants: stackVariants,
  defaults: {
    gap: '2',
    align: 'stretch',
    justify: 'start',
    rail: 'none',
  },
});

export type StackVariantProps = VariantProps<typeof stackRecipe>;
