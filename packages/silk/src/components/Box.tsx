import { css, cx } from '@linaria/core';
import type { ComponentPropsWithoutRef, JSX } from 'react';

export type BoxProps = ComponentPropsWithoutRef<'div'>;

const boxClass = css`
  box-sizing: border-box;
  margin: 0;
  min-width: 0;
  color: var(--silk-text-primary, #111827);
  background-color: var(--silk-surface, transparent);
`;

/**
 * Layout primitive scaffold — proves Linaria static CSS extraction.
 */
export function Box({ className, ...props }: BoxProps): JSX.Element {
  return <div {...props} className={cx(boxClass, className)} />;
}
