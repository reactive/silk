import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';

const centerVariants = {
  axis: ['both', 'inline', 'block'] as const,
};

export const centerRecipe: Recipe<typeof centerVariants> = defineRecipe({
  variants: centerVariants,
  defaults: {
    axis: 'both',
  },
});

export type CenterVariantProps = VariantProps<typeof centerRecipe>;
