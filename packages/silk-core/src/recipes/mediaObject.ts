import { spaceVariantSteps } from '../tokens/scales.js';
import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';

const mediaObjectVariants: {
  readonly align: readonly ['start', 'center'];
  readonly gap: typeof spaceVariantSteps;
  readonly mediaPosition: readonly ['start', 'end'];
} = {
  align: ['start', 'center'],
  gap: spaceVariantSteps,
  mediaPosition: ['start', 'end'],
};

export const mediaObjectRecipe: Recipe<typeof mediaObjectVariants> =
  defineRecipe({
    variants: mediaObjectVariants,
    defaults: {
      align: 'start',
      gap: '3',
      mediaPosition: 'start',
    },
  });

export type MediaObjectVariantProps = VariantProps<typeof mediaObjectRecipe>;
