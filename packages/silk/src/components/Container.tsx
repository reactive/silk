import { css, cx } from '@linaria/core';
import {
  containerRecipe,
  type ContainerVariantProps,
} from '@reactive/silk-core';
import { Slot } from 'radix-ui';
import type { ComponentPropsWithoutRef, JSX, ReactNode, Ref } from 'react';
import { containerMaxWidths } from '../layout/containerBreakpoints';
import { useComponentDefaults } from '../theme/SilkProvider';

export interface ContainerProps
  extends ComponentPropsWithoutRef<'div'>, ContainerVariantProps {
  readonly asChild?: boolean;
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
}

const sizeRules: string = containerRecipe.variants.size
  .map((size) => {
    const max = containerMaxWidths[size];
    if (max === null) {
      return `
    &:where([data-size='${size}']) {
      max-width: none;
    }
  `;
    }
    return `
    &:where([data-size='${size}']) {
      max-width: ${max}px;
    }
  `;
  })
  .join('\n');

const paddingRules: string = containerRecipe.variants.padding
  .map(
    (padding) => `
    &:where([data-padding='${padding}']) {
      padding-inline: var(--silk-space-${padding});
    }
  `,
  )
  .join('\n');

const containerClass: string = css`
  box-sizing: border-box;
  width: 100%;
  /* asChild targets like <dl>/<ul>/<p> carry UA margins the layout owns. */
  margin-block: 0;
  margin-inline: auto;
  min-width: 0;
  container-type: inline-size;
  ${sizeRules}
  ${paddingRules}
`;

/**
 * Centered content column with max-width and horizontal padding.
 * Always establishes a size container for nested `collapseBelow` queries.
 */
export function Container({
  className,
  asChild = false,
  size,
  padding,
  ...props
}: ContainerProps): JSX.Element {
  const defaults = useComponentDefaults('Container');
  const resolvedSize = size ?? defaults.size ?? containerRecipe.defaults.size;
  const resolvedPadding =
    padding ?? defaults.padding ?? containerRecipe.defaults.padding;

  const Comp = asChild ? Slot.Root : 'div';
  return (
    <Comp
      {...props}
      className={cx(containerClass, className)}
      data-size={resolvedSize}
      data-padding={resolvedPadding}
    />
  );
}
