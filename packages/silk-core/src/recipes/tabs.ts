import { defineRecipe, type Recipe, type VariantProps } from './defineRecipe.js';

const tabsVariants = {
  variant: ['line', 'enclosed'] as const,
};

export const tabsRecipe: Recipe<typeof tabsVariants> = defineRecipe({
  variants: tabsVariants,
  defaults: {
    variant: 'line',
  },
});

export type TabsVariantProps = VariantProps<typeof tabsRecipe>;
