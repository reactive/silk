import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';

const skeletonVariants = {
  shape: ['text', 'rect', 'circle'] as const,
};

export const skeletonRecipe: Recipe<typeof skeletonVariants> = defineRecipe({
  variants: skeletonVariants,
  defaults: {
    shape: 'text',
  },
});

export type SkeletonVariantProps = VariantProps<typeof skeletonRecipe>;
