import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';

const postCardVariants = {
  density: ['comfortable', 'compact'] as const,
};

export const postCardRecipe: Recipe<typeof postCardVariants> = defineRecipe({
  variants: postCardVariants,
  defaults: {
    density: 'comfortable',
  },
});

export type PostCardVariantProps = VariantProps<typeof postCardRecipe>;
