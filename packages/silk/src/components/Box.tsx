import { css, cx } from '@linaria/core';
import { Slot } from 'radix-ui';
import type { ComponentPropsWithoutRef, JSX, ReactNode, Ref } from 'react';

export interface BoxProps extends ComponentPropsWithoutRef<'div'> {
  readonly asChild?: boolean;
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
}

const boxClass: string = css`
  box-sizing: border-box;
  margin: 0;
  min-width: 0;
  color: var(--silk-color-text-primary);
  background-color: var(--silk-color-surface, transparent);
`;

/**
 * Layout primitive — box model reset with semantic surface/text defaults.
 */
export function Box({
  className,
  asChild = false,
  ...props
}: BoxProps): JSX.Element {
  const Comp = asChild ? Slot.Root : 'div';
  return <Comp {...props} className={cx(boxClass, className)} />;
}
