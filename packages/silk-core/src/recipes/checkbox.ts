import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';

const checkboxVariants = {
  size: ['sm', 'md'] as const,
  tone: ['neutral', 'accent', 'danger', 'success'] as const,
};

export const checkboxRecipe: Recipe<typeof checkboxVariants> = defineRecipe({
  variants: checkboxVariants,
  defaults: {
    size: 'md',
    tone: 'accent',
  },
});

export type CheckboxVariantProps = VariantProps<typeof checkboxRecipe>;
