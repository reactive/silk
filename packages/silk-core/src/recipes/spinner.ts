import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';

const spinnerVariants = {
  size: ['sm', 'md', 'lg'] as const,
  tone: ['neutral', 'accent', 'danger', 'success'] as const,
};

export const spinnerRecipe: Recipe<typeof spinnerVariants> = defineRecipe({
  variants: spinnerVariants,
  defaults: {
    size: 'md',
    tone: 'accent',
  },
});

export type SpinnerVariantProps = VariantProps<typeof spinnerRecipe>;
