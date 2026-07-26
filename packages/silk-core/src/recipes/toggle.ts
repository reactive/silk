import { defineRecipe, type Recipe, type VariantProps } from './defineRecipe.js';

const toggleVariants = {
  size: ['sm', 'md', 'lg'] as const,
};

export const toggleRecipe: Recipe<typeof toggleVariants> = defineRecipe({
  variants: toggleVariants,
  defaults: {
    size: 'md',
  },
});

export type ToggleVariantProps = VariantProps<typeof toggleRecipe>;
