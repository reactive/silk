import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';

const dialogVariants = {
  size: ['sm', 'md', 'lg', 'full'] as const,
  /** Where the dialog sits: the middle of the screen, or risen from its bottom edge (a sheet). */
  placement: ['center', 'bottom'] as const,
};

export const dialogRecipe: Recipe<typeof dialogVariants> = defineRecipe({
  variants: dialogVariants,
  defaults: {
    size: 'md',
    placement: 'center',
  },
});

export type DialogVariantProps = VariantProps<typeof dialogRecipe>;
