import { css, cx } from '@linaria/core';
import {
  avatarRecipe,
  mediaScale,
  type AvatarVariantProps,
} from '@reactive/silk-core';
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

/**
 * Off the space scale on purpose: `density` rescales whitespace, and a face is
 * content — compacting a layout should not shrink the person in it.
 */
const sizeMap = {
  sm: `${mediaScale.sm.media}px`,
  md: `${mediaScale.md.media}px`,
  lg: `${mediaScale.lg.media}px`,
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
      --_size: ${sizeMap[size]};
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
  --_size: ${sizeMap.md};
  --_resolved-size: var(--silk-avatar-size, var(--_size));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  box-sizing: border-box;
  width: var(--_resolved-size);
  height: var(--_resolved-size);
  background-color: var(--silk-color-tone-neutral-subtle);
  color: var(--silk-color-text-secondary);
  font-family: var(--silk-typography-label-family);
  font-weight: var(--silk-typography-label-weight);
  /* Fallback initials track the circle instead of sitting at one fixed size. */
  font-size: calc(var(--_resolved-size) * 0.4);
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
