import { css, cx } from '@linaria/core';
import {
  stackRecipe,
  type StackVariantProps,
} from '@reactive/silk-core';
import { Slot } from 'radix-ui';
import type { ComponentPropsWithoutRef, JSX, ReactNode, Ref } from 'react';
import { useComponentDefaults } from '../theme/SilkProvider';

export interface StackProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'wrap'>, StackVariantProps {
  readonly asChild?: boolean;
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
}

const alignMap = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
} as const;

const directionRules: string = stackRecipe.variants.direction
  .map(
    (direction) => `
    &:where([data-direction='${direction}']) {
      flex-direction: ${direction};
    }
  `,
  )
  .join('\n');

const gapRules: string = stackRecipe.variants.gap
  .map(
    (gap) => `
    &:where([data-gap='${gap}']) {
      gap: var(--silk-space-${gap});
    }
  `,
  )
  .join('\n');

const alignRules: string = stackRecipe.variants.align
  .map(
    (align) => `
    &:where([data-align='${align}']) {
      align-items: ${alignMap[align]};
    }
  `,
  )
  .join('\n');

const wrapRules: string = stackRecipe.variants.wrap
  .map(
    (wrap) => `
    &:where([data-wrap='${wrap}']) {
      flex-wrap: ${wrap};
    }
  `,
  )
  .join('\n');

const stackClass: string = css`
  display: flex;
  box-sizing: border-box;
  min-width: 0;
  ${directionRules}
  ${gapRules}
  ${alignRules}
  ${wrapRules}
`;

/**
 * Flex layout primitive driven by spacing tokens and data-attribute variants.
 */
export function Stack({
  className,
  asChild = false,
  direction,
  gap,
  align,
  wrap,
  ...props
}: StackProps): JSX.Element {
  const defaults = useComponentDefaults('Stack');
  const resolvedDirection =
    direction ?? defaults.direction ?? stackRecipe.defaults.direction;
  const resolvedGap = gap ?? defaults.gap ?? stackRecipe.defaults.gap;
  const resolvedAlign = align ?? defaults.align ?? stackRecipe.defaults.align;
  const resolvedWrap = wrap ?? defaults.wrap ?? stackRecipe.defaults.wrap;

  const Comp = asChild ? Slot.Root : 'div';
  return (
    <Comp
      {...props}
      className={cx(stackClass, className)}
      data-direction={resolvedDirection}
      data-gap={resolvedGap}
      data-align={resolvedAlign}
      data-wrap={resolvedWrap}
    />
  );
}
