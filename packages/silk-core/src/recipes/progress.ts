import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';

const progressVariants = {
  size: ['sm', 'md', 'lg'] as const,
  tone: ['neutral', 'accent', 'danger', 'success'] as const,
};

export const progressRecipe: Recipe<typeof progressVariants> = defineRecipe({
  variants: progressVariants,
  defaults: {
    size: 'md',
    tone: 'accent',
  },
});

export type ProgressVariantProps = VariantProps<typeof progressRecipe>;
