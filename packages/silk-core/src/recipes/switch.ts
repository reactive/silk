import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';

const switchVariants = {
  size: ['sm', 'md'] as const,
  tone: ['neutral', 'accent', 'danger', 'success'] as const,
};

export const switchRecipe: Recipe<typeof switchVariants> = defineRecipe({
  variants: switchVariants,
  defaults: {
    size: 'md',
    tone: 'accent',
  },
});

export type SwitchVariantProps = VariantProps<typeof switchRecipe>;
