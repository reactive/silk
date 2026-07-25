import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';

const buttonVariants = {
  variant: ['solid', 'soft', 'outline', 'ghost'] as const,
  tone: ['neutral', 'accent', 'danger'] as const,
  size: ['sm', 'md', 'lg'] as const,
  density: ['comfortable', 'compact'] as const,
};

export const buttonRecipe: Recipe<typeof buttonVariants> = defineRecipe({
  variants: buttonVariants,
  defaults: {
    variant: 'solid',
    tone: 'accent',
    size: 'md',
    density: 'comfortable',
  },
});

export type ButtonVariantProps = VariantProps<typeof buttonRecipe>;
