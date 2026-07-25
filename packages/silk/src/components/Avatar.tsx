import { css, cx } from '@linaria/core';
import { avatarRecipe, type AvatarVariantProps } from '@reactive/silk-core';
import { Slot } from 'radix-ui';
import type { ComponentPropsWithoutRef, JSX, ReactNode, Ref } from 'react';
import { useComponentDefaults } from '../theme/SilkProvider';

export interface AvatarProps
  extends ComponentPropsWithoutRef<'span'>, AvatarVariantProps {
  readonly asChild?: boolean;
  readonly ref?: Ref<HTMLSpanElement>;
  readonly children?: ReactNode;
  readonly src?: string;
  readonly alt?: string;
  readonly fallback?: ReactNode;
}

const sizeMap = {
  sm: 'var(--silk-space-6)',
  md: 'var(--silk-space-8)',
  lg: 'var(--silk-space-10)',
} as const;

const radiusMap = {
  circle: 'var(--silk-radius-full)',
  rounded: 'var(--silk-radius-md)',
  square: 'var(--silk-radius-none)',
} as const;

const sizeRules: string = avatarRecipe.variants.size
  .map(
    (size) => `
    &:where([data-size='${size}']) {
      width: ${sizeMap[size]};
      height: ${sizeMap[size]};
    }
  `,
  )
  .join('\n');

const shapeRules: string = avatarRecipe.variants.shape
  .map(
    (shape) => `
    &:where([data-shape='${shape}']) {
      border-radius: ${radiusMap[shape]};
    }
  `,
  )
  .join('\n');

const avatarClass: string = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  box-sizing: border-box;
  background-color: var(--silk-color-tone-neutral-subtle);
  color: var(--silk-color-text-secondary);
  font-family: var(--silk-typography-label-family);
  font-weight: var(--silk-typography-label-weight);
  font-size: var(--silk-typography-label-size);
  line-height: 1;
  ${sizeRules}
  ${shapeRules}

  & img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

/**
 * Minimal avatar — image with fallback initials/content.
 */
export function Avatar({
  className,
  asChild = false,
  size,
  shape,
  src,
  alt = '',
  fallback,
  children,
  ...props
}: AvatarProps): JSX.Element {
  const defaults = useComponentDefaults('Avatar');
  const resolvedSize = size ?? defaults.size ?? avatarRecipe.defaults.size;
  const resolvedShape = shape ?? defaults.shape ?? avatarRecipe.defaults.shape;

  const Comp = asChild ? Slot.Root : 'span';
  const content =
    children ??
    (src ? <img src={src} alt={alt} /> : (fallback ?? null));

  return (
    <Comp
      {...props}
      className={cx(avatarClass, className)}
      data-size={resolvedSize}
      data-shape={resolvedShape}
    >
      {content}
    </Comp>
  );
}
