import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';

const avatarVariants = {
  size: ['sm', 'md', 'lg'] as const,
  shape: ['circle', 'rounded', 'square'] as const,
};

export const avatarRecipe: Recipe<typeof avatarVariants> = defineRecipe({
  variants: avatarVariants,
  defaults: {
    size: 'md',
    shape: 'circle',
  },
});

export type AvatarVariantProps = VariantProps<typeof avatarRecipe>;
