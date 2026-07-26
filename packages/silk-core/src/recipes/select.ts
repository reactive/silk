import { defineRecipe, type Recipe, type VariantProps } from './defineRecipe.js';

const selectVariants = {
  size: ['sm', 'md', 'lg'] as const,
  density: ['comfortable', 'compact'] as const,
};

export const selectRecipe: Recipe<typeof selectVariants> = defineRecipe({
  variants: selectVariants,
  defaults: {
    size: 'md',
    density: 'comfortable',
  },
});

export type SelectVariantProps = VariantProps<typeof selectRecipe>;
