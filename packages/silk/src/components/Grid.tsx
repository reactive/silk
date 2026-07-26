import { css, cx } from '@linaria/core';
import { gridRecipe, type GridVariantProps } from '@reactive/silk-core';
import { Slot } from 'radix-ui';
import type {
  ComponentPropsWithoutRef,
  CSSProperties,
  JSX,
  ReactNode,
  Ref,
} from 'react';
import { cssVars } from '../theme/componentVars';
import { useComponentDefaults } from '../theme/SilkProvider';

export interface GridProps
  extends ComponentPropsWithoutRef<'div'>, GridVariantProps {
  /**
   * Minimum track size for `columns="auto"` (`repeat(auto-fill, minmax(...))`).
   * Sets the public `--silk-grid-min` CSS variable. Default `16rem`.
   */
  readonly minColumnWidth?: string;
  readonly asChild?: boolean;
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
}

const alignMap = {
  start: 'start',
  center: 'center',
  end: 'end',
  stretch: 'stretch',
} as const;

const columnsRules: string = gridRecipe.variants.columns
  .map((columns) => {
    const template =
      columns === 'auto'
        ? 'repeat(auto-fill, minmax(var(--silk-grid-min, 16rem), 1fr))'
        : `repeat(${columns}, minmax(0, 1fr))`;
    return `
    &:where([data-columns='${columns}']) {
      grid-template-columns: ${template};
    }
  `;
  })
  .join('\n');

const gapRules: string = gridRecipe.variants.gap
  .map(
    (gap) => `
    &:where([data-gap='${gap}']) {
      gap: var(--silk-space-${gap});
    }
  `,
  )
  .join('\n');

const alignRules: string = gridRecipe.variants.align
  .map(
    (align) => `
    &:where([data-align='${align}']) {
      align-items: ${alignMap[align]};
    }
  `,
  )
  .join('\n');

const gridClass: string = css`
  display: grid;
  box-sizing: border-box;
  min-width: 0;
  ${columnsRules}
  ${gapRules}
  ${alignRules}
`;

/**
 * CSS Grid layout primitive. `columns="auto"` uses fluid auto-fill tracks.
 */
export function Grid({
  className,
  style,
  asChild = false,
  columns,
  gap,
  align,
  minColumnWidth,
  ...props
}: GridProps): JSX.Element {
  const defaults = useComponentDefaults('Grid');
  const resolvedColumns =
    columns ?? defaults.columns ?? gridRecipe.defaults.columns;
  const resolvedGap = gap ?? defaults.gap ?? gridRecipe.defaults.gap;
  const resolvedAlign = align ?? defaults.align ?? gridRecipe.defaults.align;

  const mergedStyle: CSSProperties | undefined =
    minColumnWidth !== undefined
      ? { ...style, ...cssVars({ '--silk-grid-min': minColumnWidth }) }
      : style;

  const Comp = asChild ? Slot.Root : 'div';
  return (
    <Comp
      {...props}
      className={cx(gridClass, className)}
      style={mergedStyle}
      data-columns={resolvedColumns}
      data-gap={resolvedGap}
      data-align={resolvedAlign}
    />
  );
}
