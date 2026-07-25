import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';

const stackVariants = {
  direction: ['row', 'column'] as const,
  gap: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] as const,
  align: ['start', 'center', 'end', 'stretch'] as const,
  wrap: ['nowrap', 'wrap'] as const,
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
