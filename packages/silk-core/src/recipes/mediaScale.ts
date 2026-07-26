import type { SpaceStep } from '../tokens/types.js';
import type { TextVariantProps } from './text.js';

/**
 * Sizes shared by every composite that pairs leading media with a text column
 * (`Identity`, `MediaObject`, `Comment`, `Notification`).
 */
export type MediaScaleSize = 'sm' | 'md' | 'lg';

export interface MediaScaleStep {
  /**
   * Media edge length in px. Deliberately not a space step: an avatar is
   * content, and `density` rescales whitespace, not content.
   */
  readonly media: number;
  /** Space step for the media-to-text gap. */
  readonly gap: `${SpaceStep}`;
  /** Typography role for the primary line (a person's name). */
  readonly primaryRole: NonNullable<TextVariantProps['role']>;
  /** Typography role for the secondary line (handle, timestamp). */
  readonly metaRole: NonNullable<TextVariantProps['role']>;
}

/**
 * One table so that `size` scales a media-and-text unit as a whole. Without it
 * each composite picks a media size, a gap, and two type roles independently,
 * and the same relationship ends up spelled differently in each one.
 */
export const mediaScale: Readonly<Record<MediaScaleSize, MediaScaleStep>> = {
  sm: { media: 24, gap: '2', primaryRole: 'label', metaRole: 'caption' },
  md: { media: 40, gap: '3', primaryRole: 'headingSm', metaRole: 'caption' },
  lg: { media: 64, gap: '4', primaryRole: 'headingSm', metaRole: 'bodySm' },
};

export const mediaScaleSizes: readonly MediaScaleSize[] = ['sm', 'md', 'lg'];
