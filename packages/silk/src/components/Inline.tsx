import { css, cx } from '@linaria/core';
import { inlineRecipe, type InlineVariantProps } from '@reactive/silk-core';
import { Slot } from 'radix-ui';
import type { ComponentPropsWithoutRef, JSX, ReactNode, Ref } from 'react';
import {
  collapseBelowDomProps,
  collapseBelowRulesInline,
  type CollapseBelowProp,
} from '../layout/collapseBelow';
import { flexAlignMap, flexJustifyMap } from '../layout/flexMaps';
import { useComponentDefaults } from '../theme/SilkProvider';

export interface InlineProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'wrap'>, InlineVariantProps {
  /**
   * Switch to column direction when the nearest size container is narrower
   * than this breakpoint (web-only; container queries).
   */
  readonly collapseBelow?: CollapseBelowProp;
  readonly asChild?: boolean;
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
}

const gapRules: string = inlineRecipe.variants.gap
  .map(
    (gap) => `
    &:where([data-gap='${gap}']) {
      gap: var(--silk-space-${gap});
    }
  `,
  )
  .join('\n');

const alignRules: string = inlineRecipe.variants.align
  .map(
    (align) => `
    &:where([data-align='${align}']) {
      align-items: ${flexAlignMap[align]};
    }
  `,
  )
  .join('\n');

const justifyRules: string = inlineRecipe.variants.justify
  .map(
    (justify) => `
    &:where([data-justify='${justify}']) {
      justify-content: ${flexJustifyMap[justify]};
    }
  `,
  )
  .join('\n');

const wrapRules: string = inlineRecipe.variants.wrap
  .map(
    (wrap) => `
    &:where([data-wrap='${wrap}']) {
      flex-wrap: ${wrap};
    }
  `,
  )
  .join('\n');

const directionRules: string = inlineRecipe.variants.direction
  .map(
    (direction) => `
    &:where([data-direction='${direction}']) {
      flex-direction: ${direction};
    }
  `,
  )
  .join('\n');

const inlineClass: string = css`
  display: flex;
  flex-direction: row;
  box-sizing: border-box;
  min-width: 0;
  ${gapRules}
  ${alignRules}
  ${justifyRules}
  ${wrapRules}
  ${directionRules}
  /* Adaptive rules must stay last — equal specificity, source order wins. */
  ${collapseBelowRulesInline}
`;

/**
 * Horizontal flow layout. Defaults to wrapping — the intrinsic-first counterpart
 * of vertical `Stack`.
 */
export function Inline({
  className,
  asChild = false,
  gap,
  align,
  justify,
  wrap,
  direction,
  collapseBelow,
  ...props
}: InlineProps): JSX.Element {
  const defaults = useComponentDefaults('Inline');
  const resolvedGap = gap ?? defaults.gap ?? inlineRecipe.defaults.gap;
  const resolvedAlign = align ?? defaults.align ?? inlineRecipe.defaults.align;
  const resolvedJustify =
    justify ?? defaults.justify ?? inlineRecipe.defaults.justify;
  const resolvedWrap = wrap ?? defaults.wrap ?? inlineRecipe.defaults.wrap;
  const resolvedDirection =
    direction ?? defaults.direction ?? inlineRecipe.defaults.direction;

  const Comp = asChild ? Slot.Root : 'div';
  return (
    <Comp
      {...props}
      className={cx(inlineClass, className)}
      data-gap={resolvedGap}
      data-align={resolvedAlign}
      data-justify={resolvedJustify}
      data-wrap={resolvedWrap}
      data-direction={resolvedDirection}
      {...collapseBelowDomProps(collapseBelow)}
    />
  );
}
