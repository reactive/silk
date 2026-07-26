import { css, cx } from '@linaria/core';
import { centerRecipe, type CenterVariantProps } from '@reactive/silk-core';
import { Slot } from 'radix-ui';
import type { ComponentPropsWithoutRef, JSX, ReactNode, Ref } from 'react';
import { useComponentDefaults } from '../theme/SilkProvider';

export interface CenterProps
  extends ComponentPropsWithoutRef<'div'>, CenterVariantProps {
  readonly asChild?: boolean;
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
}

const axisRules: string = `
  &:where([data-axis='both']) {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &:where([data-axis='inline']) {
    display: flex;
    justify-content: center;
  }

  &:where([data-axis='block']) {
    display: flex;
    align-items: center;
  }
`;

const centerClass: string = css`
  box-sizing: border-box;
  min-width: 0;
  ${axisRules}
`;

/**
 * Centers children along one or both axes. For max-width measure centering,
 * compose with Container or set style.
 */
export function Center({
  className,
  asChild = false,
  axis,
  ...props
}: CenterProps): JSX.Element {
  const defaults = useComponentDefaults('Center');
  const resolvedAxis = axis ?? defaults.axis ?? centerRecipe.defaults.axis;

  const Comp = asChild ? Slot.Root : 'div';
  return (
    <Comp
      {...props}
      className={cx(centerClass, className)}
      data-axis={resolvedAxis}
    />
  );
}
