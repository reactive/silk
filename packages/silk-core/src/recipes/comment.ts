import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';
import { mediaScaleSizes } from './mediaScale.js';

const commentVariants: {
  readonly size: typeof mediaScaleSizes;
} = {
  size: mediaScaleSizes,
};

export const commentRecipe: Recipe<typeof commentVariants> = defineRecipe({
  variants: commentVariants,
  defaults: {
    size: 'sm',
  },
});

export type CommentVariantProps = VariantProps<typeof commentRecipe>;
