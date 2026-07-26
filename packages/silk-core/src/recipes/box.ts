import { spaceVariantSteps } from '../tokens/scales.js';
import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';

const boxVariants: {
  readonly padding: typeof spaceVariantSteps;
} = {
  padding: spaceVariantSteps,
};

export const boxRecipe: Recipe<typeof boxVariants> = defineRecipe({
  variants: boxVariants,
  defaults: {
    padding: '0',
  },
});

export type BoxVariantProps = VariantProps<typeof boxRecipe>;
