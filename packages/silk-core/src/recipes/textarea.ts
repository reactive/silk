import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';

const textareaVariants = {
  size: ['sm', 'md', 'lg'] as const,
  density: ['comfortable', 'compact'] as const,
};

export const textareaRecipe: Recipe<typeof textareaVariants> = defineRecipe({
  variants: textareaVariants,
  defaults: {
    size: 'md',
    density: 'comfortable',
  },
});

export type TextareaVariantProps = VariantProps<typeof textareaRecipe>;
