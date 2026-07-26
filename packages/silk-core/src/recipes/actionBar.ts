import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';

const actionBarVariants = {
  justify: ['start', 'end', 'between'] as const,
  density: ['comfortable', 'compact'] as const,
};

export const actionBarRecipe: Recipe<typeof actionBarVariants> = defineRecipe({
  variants: actionBarVariants,
  defaults: {
    justify: 'start',
    density: 'comfortable',
  },
});

export type ActionBarVariantProps = VariantProps<typeof actionBarRecipe>;
