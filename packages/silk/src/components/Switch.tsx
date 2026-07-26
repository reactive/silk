import { css, cx } from '@linaria/core';
import { switchRecipe, type SwitchVariantProps } from '@reactive/silk-core';
import { Switch as RadixSwitch } from 'radix-ui';
import type { ComponentPropsWithoutRef, JSX, Ref } from 'react';
import { focusRingCss } from '../theme/focusRing';
import { useComponentDefaults } from '../theme/SilkProvider';
import { tonePrivateVarsCss } from '../theme/tonePrivateVars';
import { useFieldControlProps } from './Field';

export interface SwitchProps
  extends Omit<ComponentPropsWithoutRef<typeof RadixSwitch.Root>, 'asChild'>,
    SwitchVariantProps {
  readonly ref?: Ref<HTMLButtonElement>;
}

const toneRules: string = tonePrivateVarsCss(switchRecipe.variants.tone, [
  'solid',
  'subtle',
  'focus-ring',
  'disabled-bg',
]);

const sizeRules: string = `
  &:where([data-size='sm']) {
    width: calc(var(--silk-space-7) + var(--silk-space-1));
    height: var(--silk-space-4);
  }
  &:where([data-size='md']) {
    width: var(--silk-space-8);
    height: var(--silk-space-5);
  }
`;

const rootClass: string = css`
  display: inline-flex;
  align-items: center;
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: var(--silk-radius-full);
  background-color: var(--silk-color-border-subtle);
  cursor: pointer;
  position: relative;
  transition: background-color var(--silk-motion-fast-duration-ms)
    var(--silk-motion-fast-easing);

  ${toneRules}
  ${sizeRules}

  &:where([data-state='checked']) {
    background-color: var(--_tone-solid);
  }

  &:where(:focus-visible) {
    ${focusRingCss('var(--_tone-focus-ring)')}
  }

  &:where([data-invalid='true']) {
    outline: 1px solid var(--silk-color-tone-danger-solid);
  }

  &:where([data-invalid='true']:focus-visible) {
    ${focusRingCss('var(--silk-color-tone-danger-focus-ring)')}
  }

  &:where(:disabled),
  &:where([data-disabled]) {
    cursor: not-allowed;
    background-color: var(--_tone-disabled-bg);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const thumbClass: string = css`
  display: block;
  width: calc(50% - 2px);
  height: calc(100% - 4px);
  margin: 2px;
  border-radius: var(--silk-radius-full);
  background-color: var(--silk-color-surface);
  box-shadow: var(--silk-shadow-raised);
  transition: transform var(--silk-motion-fast-duration-ms)
    var(--silk-motion-fast-easing);
  transform: translateX(0);

  &:where([data-state='checked']) {
    transform: translateX(100%);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/**
 * Radix-backed switch. Thumb slide respects prefers-reduced-motion.
 */
export function Switch({
  className,
  size,
  tone,
  id,
  disabled,
  required,
  ...props
}: SwitchProps): JSX.Element {
  const defaults = useComponentDefaults('Switch');
  const resolvedSize = size ?? defaults.size ?? switchRecipe.defaults.size;
  const resolvedTone = tone ?? defaults.tone ?? switchRecipe.defaults.tone;

  const fieldProps = useFieldControlProps({
    id,
    disabled,
    required,
    'aria-describedby': props['aria-describedby'],
    'aria-invalid': props['aria-invalid'],
  });

  return (
    <RadixSwitch.Root
      {...props}
      {...fieldProps}
      className={cx(rootClass, className)}
      data-size={resolvedSize}
      data-tone={resolvedTone}
    >
      <RadixSwitch.Thumb className={thumbClass} />
    </RadixSwitch.Root>
  );
}
