import { css, cx } from '@linaria/core';
import { skeletonRecipe, type SkeletonVariantProps } from '@reactive/silk-core';
import type { ComponentPropsWithoutRef, JSX, ReactNode, Ref } from 'react';
import { useComponentDefaults } from '../theme/SilkProvider';
import { shimmerFillCss } from '../theme/shimmerCss';

export interface SkeletonProps
  extends ComponentPropsWithoutRef<'div'>, SkeletonVariantProps {
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
}

const skeletonClass: string = css`
  display: block;
  box-sizing: border-box;
  margin: 0;
  background-color: var(--silk-color-border-subtle);
  color: transparent;
  pointer-events: none;
  user-select: none;
  ${shimmerFillCss(
    'silk-skeleton-shimmer',
    'color-mix(in srgb, var(--silk-color-surface) 55%, transparent)',
  )}

  &:where([data-shape='text']) {
    height: 1em;
    width: 100%;
    border-radius: var(--silk-radius-sm);
  }

  &:where([data-shape='rect']) {
    width: 100%;
    min-height: var(--silk-space-8);
    border-radius: var(--silk-radius-md);
  }

  &:where([data-shape='circle']) {
    width: var(--silk-space-8);
    height: var(--silk-space-8);
    border-radius: var(--silk-radius-full);
  }
`;

/**
 * Loading placeholder. Shimmer is static under prefers-reduced-motion.
 */
export function Skeleton({
  className,
  shape,
  ...props
}: SkeletonProps): JSX.Element {
  const defaults = useComponentDefaults('Skeleton');
  const resolvedShape = shape ?? defaults.shape ?? skeletonRecipe.defaults.shape;

  return (
    <div
      {...props}
      className={cx(skeletonClass, className)}
      data-shape={resolvedShape}
      aria-hidden="true"
    />
  );
}
