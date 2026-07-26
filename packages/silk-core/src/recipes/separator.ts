import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';

const separatorVariants = {
  orientation: ['horizontal', 'vertical'] as const,
};

export const separatorRecipe: Recipe<typeof separatorVariants> = defineRecipe({
  variants: separatorVariants,
  defaults: {
    orientation: 'horizontal',
  },
});

export type SeparatorVariantProps = VariantProps<typeof separatorRecipe>;
