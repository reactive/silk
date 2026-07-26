import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';
import { mediaScaleSizes } from './mediaScale.js';

const avatarVariants: {
  readonly size: typeof mediaScaleSizes;
  readonly shape: readonly ['circle', 'rounded', 'square'];
} = {
  size: mediaScaleSizes,
  shape: ['circle', 'rounded', 'square'],
};

export const avatarRecipe: Recipe<typeof avatarVariants> = defineRecipe({
  variants: avatarVariants,
  defaults: {
    size: 'md',
    shape: 'circle',
  },
});

export type AvatarVariantProps = VariantProps<typeof avatarRecipe>;
