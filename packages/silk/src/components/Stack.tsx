import { css, cx } from '@linaria/core';
import {
  stackRecipe,
  type StackVariantProps,
} from '@reactive/silk-core';
import { Slot } from 'radix-ui';
import type { ComponentPropsWithoutRef, JSX, ReactNode, Ref } from 'react';
import { useComponentDefaults } from '../theme/SilkProvider';

export interface StackProps
  extends ComponentPropsWithoutRef<'div'>, StackVariantProps {
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

const justifyMap = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
} as const;

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

const justifyRules: string = stackRecipe.variants.justify
  .map(
    (justify) => `
    &:where([data-justify='${justify}']) {
      justify-content: ${justifyMap[justify]};
    }
  `,
  )
  .join('\n');

const railRules: string = `
  &:where([data-rail='none']) {
    border-inline-start: none;
    padding-inline-start: 0;
  }
  &:where([data-rail='start']) {
    border-inline-start: 1px solid var(--silk-color-border-subtle);
    padding-inline-start: var(--silk-space-3);
  }
`;

const stackClass: string = css`
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  min-width: 0;
  ${gapRules}
  ${alignRules}
  ${justifyRules}
  ${railRules}
`;

/**
 * Vertical layout primitive driven by spacing tokens and data-attribute
 * variants. For horizontal flow use `Inline`.
 */
export function Stack({
  className,
  asChild = false,
  gap,
  align,
  justify,
  rail,
  ...props
}: StackProps): JSX.Element {
  const defaults = useComponentDefaults('Stack');
  const resolvedGap = gap ?? defaults.gap ?? stackRecipe.defaults.gap;
  const resolvedAlign = align ?? defaults.align ?? stackRecipe.defaults.align;
  const resolvedJustify =
    justify ?? defaults.justify ?? stackRecipe.defaults.justify;
  const resolvedRail = rail ?? defaults.rail ?? stackRecipe.defaults.rail;

  const Comp = asChild ? Slot.Root : 'div';
  return (
    <Comp
      {...props}
      className={cx(stackClass, className)}
      data-gap={resolvedGap}
      data-align={resolvedAlign}
      data-justify={resolvedJustify}
      data-rail={resolvedRail}
    />
  );
}
