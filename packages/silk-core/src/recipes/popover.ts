import { defineRecipe, type Recipe, type VariantProps } from './defineRecipe.js';

const popoverVariants = {
  size: ['sm', 'md', 'lg'] as const,
};

export const popoverRecipe: Recipe<typeof popoverVariants> = defineRecipe({
  variants: popoverVariants,
  defaults: {
    size: 'md',
  },
});

export type PopoverVariantProps = VariantProps<typeof popoverRecipe>;
