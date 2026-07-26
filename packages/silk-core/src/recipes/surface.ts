import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';

const surfaceVariants = {
  elevation: ['sunken', 'flat', 'raised', 'overlay'] as const,
  radius: ['none', 'sm', 'md', 'lg'] as const,
  border: ['none', 'subtle'] as const,
};

export const surfaceRecipe: Recipe<typeof surfaceVariants> = defineRecipe({
  variants: surfaceVariants,
  defaults: {
    elevation: 'flat',
    radius: 'md',
    border: 'none',
  },
});

export type SurfaceVariantProps = VariantProps<typeof surfaceRecipe>;
