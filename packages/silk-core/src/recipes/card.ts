import { spaceVariantSteps } from '../tokens/scales.js';
import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';

const cardVariants: {
  readonly elevation: readonly ['flat', 'raised', 'overlay'];
  readonly padding: typeof spaceVariantSteps;
  readonly radius: readonly ['sm', 'md', 'lg'];
  readonly interactive: readonly ['false', 'true'];
} = {
  elevation: ['flat', 'raised', 'overlay'] as const,
  padding: spaceVariantSteps,
  radius: ['sm', 'md', 'lg'] as const,
  interactive: ['false', 'true'] as const,
};

export const cardRecipe: Recipe<typeof cardVariants> = defineRecipe({
  variants: cardVariants,
  defaults: {
    elevation: 'raised',
    padding: '4',
    radius: 'lg',
    interactive: 'false',
  },
});

export type CardVariantProps = VariantProps<typeof cardRecipe>;
