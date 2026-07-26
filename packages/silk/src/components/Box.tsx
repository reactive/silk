import { css, cx } from '@linaria/core';
import { boxRecipe, type BoxVariantProps } from '@reactive/silk-core';
import { Slot } from 'radix-ui';
import type { ComponentPropsWithoutRef, JSX, ReactNode, Ref } from 'react';
import { useComponentDefaults } from '../theme/SilkProvider';

export interface BoxProps
  extends ComponentPropsWithoutRef<'div'>, BoxVariantProps {
  readonly asChild?: boolean;
  /** Establish a size container for nested `collapseBelow` queries (web-only). */
  readonly contain?: boolean;
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
}

const paddingRules: string = boxRecipe.variants.padding
  .map(
    (padding) => `
    &:where([data-padding='${padding}']) {
      padding: var(--silk-space-${padding});
    }
  `,
  )
  .join('\n');

const boxClass: string = css`
  box-sizing: border-box;
  margin: 0;
  min-width: 0;
  color: var(--silk-color-text-primary);
  background-color: var(--silk-color-surface, transparent);

  &:where([data-contain='true']) {
    container-type: inline-size;
  }

  ${paddingRules}
`;

/**
 * Layout primitive — box model reset with semantic surface/text defaults.
 */
export function Box({
  className,
  asChild = false,
  padding,
  contain = false,
  ...props
}: BoxProps): JSX.Element {
  const defaults = useComponentDefaults('Box');
  const resolvedPadding =
    padding ?? defaults.padding ?? boxRecipe.defaults.padding;

  const Comp = asChild ? Slot.Root : 'div';
  return (
    <Comp
      {...props}
      className={cx(boxClass, className)}
      data-padding={resolvedPadding}
      {...(contain ? { 'data-contain': 'true' } : {})}
    />
  );
}
