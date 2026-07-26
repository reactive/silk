import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';

const emptyStateVariants = {
  size: ['sm', 'md', 'lg'] as const,
};

export const emptyStateRecipe: Recipe<typeof emptyStateVariants> = defineRecipe(
  {
    variants: emptyStateVariants,
    defaults: {
      size: 'md',
    },
  },
);

export type EmptyStateVariantProps = VariantProps<typeof emptyStateRecipe>;
