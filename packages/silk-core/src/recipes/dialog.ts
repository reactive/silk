import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';

const dialogVariants = {
  size: ['sm', 'md', 'lg', 'full'] as const,
};

export const dialogRecipe: Recipe<typeof dialogVariants> = defineRecipe({
  variants: dialogVariants,
  defaults: {
    size: 'md',
  },
});

export type DialogVariantProps = VariantProps<typeof dialogRecipe>;
