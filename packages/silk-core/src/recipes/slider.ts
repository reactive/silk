import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';

const sliderVariants = {
  size: ['sm', 'md'] as const,
  tone: ['neutral', 'accent', 'danger', 'success'] as const,
};

export const sliderRecipe: Recipe<typeof sliderVariants> = defineRecipe({
  variants: sliderVariants,
  defaults: {
    size: 'md',
    tone: 'accent',
  },
});

export type SliderVariantProps = VariantProps<typeof sliderRecipe>;
