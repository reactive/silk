import { spaceVariantSteps } from '../tokens/scales.js';
import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';

const inlineVariants: {
  readonly gap: typeof spaceVariantSteps;
  readonly align: readonly [
    'start',
    'center',
    'end',
    'stretch',
    'baseline',
  ];
  readonly justify: readonly [
    'start',
    'center',
    'end',
    'between',
    'around',
    'evenly',
  ];
  readonly wrap: readonly ['nowrap', 'wrap'];
  readonly direction: readonly ['row', 'row-reverse'];
} = {
  gap: spaceVariantSteps,
  align: ['start', 'center', 'end', 'stretch', 'baseline'],
  justify: ['start', 'center', 'end', 'between', 'around', 'evenly'],
  wrap: ['nowrap', 'wrap'],
  direction: ['row', 'row-reverse'],
};

export const inlineRecipe: Recipe<typeof inlineVariants> = defineRecipe({
  variants: inlineVariants,
  defaults: {
    gap: '2',
    align: 'center',
    justify: 'start',
    wrap: 'wrap',
    direction: 'row',
  },
});

export type InlineVariantProps = VariantProps<typeof inlineRecipe>;
