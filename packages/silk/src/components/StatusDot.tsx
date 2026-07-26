import { css, cx } from '@linaria/core';
import {
  statusDotRecipe,
  type StatusDotVariantProps,
} from '@reactive/silk-core';
import type { ComponentPropsWithoutRef, JSX, Ref } from 'react';
import { useComponentDefaults } from '../theme/SilkProvider';
import { tonePrivateVarsCss } from '../theme/tonePrivateVars';

export interface StatusDotProps
  extends Omit<ComponentPropsWithoutRef<'span'>, 'children' | 'color'>,
    StatusDotVariantProps {
  readonly ref?: Ref<HTMLSpanElement>;
}

const toneRules: string = tonePrivateVarsCss(statusDotRecipe.variants.tone, [
  'solid',
]);

const sizeRules: string = `
  &:where([data-size='sm']) {
    width: var(--silk-space-2);
    height: var(--silk-space-2);
  }
  &:where([data-size='md']) {
    width: var(--silk-space-3);
    height: var(--silk-space-3);
  }
`;

const statusDotClass: string = css`
  display: inline-block;
  box-sizing: border-box;
  flex-shrink: 0;
  border-radius: var(--silk-radius-full);
  background-color: var(--silk-status-dot-bg, var(--_tone-solid));
  ${toneRules}
  ${sizeRules}
`;

/**
 * Decorative status indicator. Hidden from the accessibility tree by default;
 * composites supply text alternatives (e.g. "Unread").
 */
export function StatusDot({
  className,
  tone,
  size,
  'aria-hidden': ariaHidden = true,
  ...props
}: StatusDotProps): JSX.Element {
  const defaults = useComponentDefaults('StatusDot');
  const resolvedTone = tone ?? defaults.tone ?? statusDotRecipe.defaults.tone;
  const resolvedSize = size ?? defaults.size ?? statusDotRecipe.defaults.size;

  return (
    <span
      {...props}
      aria-hidden={ariaHidden}
      className={cx(statusDotClass, className)}
      data-tone={resolvedTone}
      data-size={resolvedSize}
    />
  );
}
