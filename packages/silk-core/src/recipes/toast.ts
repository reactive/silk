import { defineRecipe, type Recipe, type VariantProps } from './defineRecipe.js';

const toastVariants = {
  tone: ['neutral', 'success', 'danger'] as const,
};

export const toastRecipe: Recipe<typeof toastVariants> = defineRecipe({
  variants: toastVariants,
  defaults: {
    tone: 'neutral',
  },
});

export type ToastVariantProps = VariantProps<typeof toastRecipe>;
