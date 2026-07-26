import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';

const radioGroupVariants = {
  size: ['sm', 'md'] as const,
  tone: ['neutral', 'accent', 'danger', 'success'] as const,
  orientation: ['vertical', 'horizontal'] as const,
};

export const radioGroupRecipe: Recipe<typeof radioGroupVariants> = defineRecipe({
  variants: radioGroupVariants,
  defaults: {
    size: 'md',
    tone: 'accent',
    orientation: 'vertical',
  },
});

export type RadioGroupVariantProps = VariantProps<typeof radioGroupRecipe>;
