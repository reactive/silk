import { css, cx } from '@linaria/core';
import { checkboxRecipe, type CheckboxVariantProps } from '@reactive/silk-core';
import { Checkbox as RadixCheckbox } from 'radix-ui';
import type { ComponentPropsWithoutRef, JSX, ReactNode, Ref } from 'react';
import { focusRingCss } from '../theme/focusRing';
import { useComponentDefaults } from '../theme/SilkProvider';
import { tonePrivateVarsCss } from '../theme/tonePrivateVars';
import { useFieldControlProps } from './Field';

export interface CheckboxProps
  extends Omit<
      ComponentPropsWithoutRef<typeof RadixCheckbox.Root>,
      'asChild'
    >,
    CheckboxVariantProps {
  readonly ref?: Ref<HTMLButtonElement>;
  readonly children?: ReactNode;
}

const toneRules: string = tonePrivateVarsCss(checkboxRecipe.variants.tone, [
  'solid',
  'on-solid',
  'border',
  'focus-ring',
  'disabled-fg',
  'disabled-bg',
]);

const sizeRules: string = `
  &:where([data-size='sm']) {
    width: var(--silk-space-4);
    height: var(--silk-space-4);
  }
  &:where([data-size='md']) {
    width: var(--silk-space-5);
    height: var(--silk-space-5);
  }
`;

const rootClass: string = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  flex-shrink: 0;
  border: 1px solid var(--_tone-border);
  border-radius: var(--silk-radius-sm);
  background-color: var(--silk-color-surface-sunken);
  color: var(--_tone-on-solid);
  cursor: pointer;
  transition:
    background-color var(--silk-motion-fast-duration-ms)
      var(--silk-motion-fast-easing),
    border-color var(--silk-motion-fast-duration-ms)
      var(--silk-motion-fast-easing);

  ${toneRules}
  ${sizeRules}

  &:where(:focus-visible) {
    ${focusRingCss('var(--_tone-focus-ring)')}
  }

  &:where([data-state='checked']),
  &:where([data-state='indeterminate']) {
    background-color: var(--_tone-solid);
    border-color: var(--_tone-solid);
  }

  &:where([data-invalid='true']) {
    border-color: var(--silk-color-tone-danger-solid);
  }

  &:where([data-invalid='true']:focus-visible) {
    ${focusRingCss('var(--silk-color-tone-danger-focus-ring)')}
  }

  &:where(:disabled),
  &:where([data-disabled]) {
    cursor: not-allowed;
    background-color: var(--_tone-disabled-bg);
    border-color: transparent;
    color: var(--_tone-disabled-fg);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const indicatorClass: string = css`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 70%;
  height: 70%;

  & svg {
    width: 100%;
    height: 100%;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  /* Select icon from Radix Indicator data-state (works for controlled + uncontrolled). */
  & [data-icon='check'] {
    display: none;
  }
  & [data-icon='dash'] {
    display: none;
  }
  &:where([data-state='checked']) [data-icon='check'] {
    display: block;
  }
  &:where([data-state='indeterminate']) [data-icon='dash'] {
    display: block;
  }
`;

function CheckIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <polyline points="3.5 8.5 6.5 11.5 12.5 4.5" />
    </svg>
  );
}

function DashIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <line x1="3" y1="8" x2="13" y2="8" />
    </svg>
  );
}

/**
 * Radix-backed checkbox. Integrates with Field single-control contract.
 */
export function Checkbox({
  className,
  size,
  tone,
  id,
  disabled,
  required,
  children,
  ...props
}: CheckboxProps): JSX.Element {
  const defaults = useComponentDefaults('Checkbox');
  const resolvedSize = size ?? defaults.size ?? checkboxRecipe.defaults.size;
  const resolvedTone = tone ?? defaults.tone ?? checkboxRecipe.defaults.tone;

  const fieldProps = useFieldControlProps({
    id,
    disabled,
    required,
    'aria-describedby': props['aria-describedby'],
    'aria-invalid': props['aria-invalid'],
  });

  return (
    <RadixCheckbox.Root
      {...props}
      {...fieldProps}
      className={cx(rootClass, className)}
      data-size={resolvedSize}
      data-tone={resolvedTone}
    >
      <RadixCheckbox.Indicator className={indicatorClass}>
        <span data-icon="check">
          <CheckIcon />
        </span>
        <span data-icon="dash">
          <DashIcon />
        </span>
      </RadixCheckbox.Indicator>
      {children}
    </RadixCheckbox.Root>
  );
}
