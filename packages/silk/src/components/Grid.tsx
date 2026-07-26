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
      align-items: ${align};
    }
  `,
  )
  .join('\n');

const justifyRules: string = gridRecipe.variants.justify
  .map(
    (justify) => `
    &:where([data-justify='${justify}']) {
      justify-items: ${justify};
    }
  `,
  )
  .join('\n');

const gridClass: string = css`
  display: grid;
  box-sizing: border-box;
  /* asChild targets like <dl>/<ul>/<p> carry UA margin and padding the layout owns. */
  margin: 0;
  padding: 0;
  min-width: 0;
  ${columnsRules}
  ${gapRules}
  ${alignRules}
  ${justifyRules}
`;

/**
 * CSS Grid layout primitive. `columns="auto"` uses fluid auto-fill tracks.
 * `justify` is `justify-items` (item placement in the track) — unlike
 * Stack/Inline, where `justify` distributes content along the main axis.
 */
export function Grid({
  className,
  style,
  asChild = false,
  columns,
  gap,
  align,
  justify,
  minColumnWidth,
  ...props
}: GridProps): JSX.Element {
  const defaults = useComponentDefaults('Grid');
  const resolvedColumns =
    columns ?? defaults.columns ?? gridRecipe.defaults.columns;
  const resolvedGap = gap ?? defaults.gap ?? gridRecipe.defaults.gap;
  const resolvedAlign = align ?? defaults.align ?? gridRecipe.defaults.align;
  const resolvedJustify =
    justify ?? defaults.justify ?? gridRecipe.defaults.justify;

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
      data-justify={resolvedJustify}
    />
  );
}
