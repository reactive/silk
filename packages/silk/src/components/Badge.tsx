import { css, cx } from '@linaria/core';
import { badgeRecipe, type BadgeVariantProps } from '@reactive/silk-core';
import { Slot } from 'radix-ui';
import type { ComponentPropsWithoutRef, JSX, ReactNode, Ref } from 'react';
import { useComponentDefaults } from '../theme/SilkProvider';
import { tonePrivateVarsCss } from '../theme/tonePrivateVars';

export interface BadgeProps
  extends Omit<ComponentPropsWithoutRef<'span'>, 'color'>, BadgeVariantProps {
  readonly asChild?: boolean;
  readonly ref?: Ref<HTMLSpanElement>;
  readonly children?: ReactNode;
}

const toneRules: string = tonePrivateVarsCss(badgeRecipe.variants.tone, [
  'solid',
  'on-solid',
  'text',
  'subtle',
  'border',
]);

const sizeRules: string = `
  &:where([data-size='sm']) {
    padding: 0 var(--silk-space-1);
    font-size: var(--silk-typography-caption-size);
    line-height: var(--silk-typography-caption-line-height);
    min-height: calc(var(--silk-space-4) + var(--silk-space-1));
  }
  &:where([data-size='md']) {
    padding: var(--silk-space-1) var(--silk-space-2);
    font-size: var(--silk-typography-label-size);
    line-height: var(--silk-typography-label-line-height);
    min-height: var(--silk-space-5);
  }
`;

const badgeClass: string = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  margin: 0;
  border-radius: var(--silk-badge-radius, var(--silk-radius-full));
  font-family: var(--silk-typography-label-family);
  font-weight: var(--silk-typography-label-weight);
  white-space: nowrap;
  vertical-align: middle;

  ${toneRules}
  ${sizeRules}

  &:where([data-variant='solid']) {
    background-color: var(--silk-badge-bg, var(--_tone-solid));
    color: var(--silk-badge-fg, var(--_tone-on-solid));
    border: 1px solid transparent;
  }

  &:where([data-variant='soft']) {
    background-color: var(--silk-badge-bg, var(--_tone-subtle));
    color: var(--silk-badge-fg, var(--_tone-text));
    border: 1px solid transparent;
  }

  &:where([data-variant='outline']) {
    background-color: var(--silk-badge-bg, transparent);
    color: var(--silk-badge-fg, var(--_tone-text));
    border: 1px solid var(--silk-badge-border, var(--_tone-border));
  }
`;

/**
 * Compact status / category label.
 */
export function Badge({
  className,
  asChild = false,
  variant,
  tone,
  size,
  ...props
}: BadgeProps): JSX.Element {
  const defaults = useComponentDefaults('Badge');
  const resolvedVariant =
    variant ?? defaults.variant ?? badgeRecipe.defaults.variant;
  const resolvedTone = tone ?? defaults.tone ?? badgeRecipe.defaults.tone;
  const resolvedSize = size ?? defaults.size ?? badgeRecipe.defaults.size;

  const Comp = asChild ? Slot.Root : 'span';
  return (
    <Comp
      {...props}
      className={cx(badgeClass, className)}
      data-variant={resolvedVariant}
      data-tone={resolvedTone}
      data-size={resolvedSize}
    />
  );
}
