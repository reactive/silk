import { spaceVariantSteps } from '../tokens/scales.js';
import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';
import { mediaScale, mediaScaleSizes } from './mediaScale.js';

const mediaObjectVariants: {
  readonly align: readonly ['start', 'center'];
  readonly gap: typeof spaceVariantSteps;
  readonly mediaPosition: readonly ['start', 'end'];
  readonly size: typeof mediaScaleSizes;
} = {
  align: ['start', 'center'],
  gap: spaceVariantSteps,
  mediaPosition: ['start', 'end'],
  size: mediaScaleSizes,
};

/**
 * The `gap` default restates the `md` step of `mediaScale`. Renderers resolve
 * gap from `size` so the media-to-text distance follows the media it separates;
 * this default is what that resolution produces at the default size.
 */
export const mediaObjectRecipe: Recipe<typeof mediaObjectVariants> =
  defineRecipe({
    variants: mediaObjectVariants,
    defaults: {
      align: 'start',
      gap: mediaScale.md.gap,
      mediaPosition: 'start',
      size: 'md',
    },
  });

export type MediaObjectVariantProps = VariantProps<typeof mediaObjectRecipe>;
