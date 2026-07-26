import { spaceVariantSteps } from '../tokens/scales.js';
import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';

const containerVariants: {
  readonly size: readonly ['sm', 'md', 'lg', 'xl', 'full'];
  readonly padding: typeof spaceVariantSteps;
} = {
  size: ['sm', 'md', 'lg', 'xl', 'full'],
  padding: spaceVariantSteps,
};

export const containerRecipe: Recipe<typeof containerVariants> = defineRecipe({
  variants: containerVariants,
  defaults: {
    size: 'lg',
    padding: '4',
  },
});

export type ContainerVariantProps = VariantProps<typeof containerRecipe>;
