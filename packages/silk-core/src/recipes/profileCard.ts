import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';

const profileCardVariants = {
  layout: ['horizontal', 'stacked'] as const,
};

export const profileCardRecipe: Recipe<typeof profileCardVariants> =
  defineRecipe({
    variants: profileCardVariants,
    defaults: {
      layout: 'stacked',
    },
  });

export type ProfileCardVariantProps = VariantProps<typeof profileCardRecipe>;
