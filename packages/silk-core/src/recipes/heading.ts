import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';

const headingVariants = {
  level: ['1', '2', '3', '4', '5', '6'] as const,
  size: ['sm', 'md', 'lg', 'xl'] as const,
  tone: ['primary', 'secondary', 'accent', 'danger', 'success'] as const,
};

export const headingRecipe: Recipe<typeof headingVariants> = defineRecipe({
  variants: headingVariants,
  defaults: {
    level: '2',
    size: 'md',
    tone: 'primary',
  },
});

export type HeadingVariantProps = VariantProps<typeof headingRecipe>;
