import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';

const inputVariants = {
  size: ['sm', 'md', 'lg'] as const,
  density: ['comfortable', 'compact'] as const,
};

export const inputRecipe: Recipe<typeof inputVariants> = defineRecipe({
  variants: inputVariants,
  defaults: {
    size: 'md',
    density: 'comfortable',
  },
});

export type InputVariantProps = VariantProps<typeof inputRecipe>;
