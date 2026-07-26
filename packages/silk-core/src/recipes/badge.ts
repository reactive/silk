import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';

const badgeVariants = {
  variant: ['solid', 'soft', 'outline'] as const,
  tone: ['neutral', 'accent', 'danger', 'success'] as const,
  size: ['sm', 'md'] as const,
};

export const badgeRecipe: Recipe<typeof badgeVariants> = defineRecipe({
  variants: badgeVariants,
  defaults: {
    variant: 'soft',
    tone: 'neutral',
    size: 'md',
  },
});

export type BadgeVariantProps = VariantProps<typeof badgeRecipe>;
