import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';

const statGroupVariants = {
  size: ['sm', 'md', 'lg'] as const,
  orientation: ['horizontal', 'vertical'] as const,
};

export const statGroupRecipe: Recipe<typeof statGroupVariants> = defineRecipe({
  variants: statGroupVariants,
  defaults: {
    size: 'md',
    orientation: 'horizontal',
  },
});

export type StatGroupVariantProps = VariantProps<typeof statGroupRecipe>;
