import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';

const commentVariants = {
  size: ['sm', 'md', 'lg'] as const,
};

export const commentRecipe: Recipe<typeof commentVariants> = defineRecipe({
  variants: commentVariants,
  defaults: {
    size: 'sm',
  },
});

export type CommentVariantProps = VariantProps<typeof commentRecipe>;
