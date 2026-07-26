import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';

const statusDotVariants = {
  tone: ['neutral', 'accent', 'danger', 'success'] as const,
  size: ['sm', 'md'] as const,
};

export const statusDotRecipe: Recipe<typeof statusDotVariants> = defineRecipe({
  variants: statusDotVariants,
  defaults: {
    tone: 'accent',
    size: 'sm',
  },
});

export type StatusDotVariantProps = VariantProps<typeof statusDotRecipe>;
