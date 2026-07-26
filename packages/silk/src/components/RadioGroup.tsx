import { css, cx } from '@linaria/core';
import {
  radioGroupRecipe,
  type RadioGroupVariantProps,
} from '@reactive/silk-core';
import { RadioGroup as RadixRadioGroup } from 'radix-ui';
import type { ComponentPropsWithoutRef, JSX, ReactNode, Ref } from 'react';
import { focusRingCss } from '../theme/focusRing';
import { useComponentDefaults } from '../theme/SilkProvider';
import { tonePrivateVarsCss } from '../theme/tonePrivateVars';
import { useFieldControlProps } from './Field';

export interface RadioGroupRootProps
  extends Omit<
      ComponentPropsWithoutRef<typeof RadixRadioGroup.Root>,
      'asChild' | 'orientation'
    >,
    RadioGroupVariantProps {
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
}

const toneRules: string = tonePrivateVarsCss(radioGroupRecipe.variants.tone, [
  'solid',
  'border',
  'focus-ring',
  'disabled-bg',
]);

const rootClass: string = css`
  display: flex;
  gap: var(--silk-space-2);
  box-sizing: border-box;
  margin: 0;
  --_radio-size: var(--silk-space-5);

  ${toneRules}

  &:where([data-size='sm']) {
    --_radio-size: var(--silk-space-4);
  }

  &:where([data-orientation='vertical']) {
    flex-direction: column;
  }

  &:where([data-orientation='horizontal']) {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
  }
`;

function RadioGroupRoot({
  className,
  size,
  tone,
  orientation,
  id,
  disabled,
  required,
  ...props
}: RadioGroupRootProps): JSX.Element {
  const defaults = useComponentDefaults('RadioGroup');
  const resolvedSize = size ?? defaults.size ?? radioGroupRecipe.defaults.size;
  const resolvedTone = tone ?? defaults.tone ?? radioGroupRecipe.defaults.tone;
  const resolvedOrientation =
    orientation ??
    defaults.orientation ??
    radioGroupRecipe.defaults.orientation;

  const fieldProps = useFieldControlProps({
    id,
    disabled,
    required,
    'aria-describedby': props['aria-describedby'],
    'aria-invalid': props['aria-invalid'],
    'aria-labelledby': props['aria-labelledby'],
  });

  return (
    <RadixRadioGroup.Root
      {...props}
      {...fieldProps}
      className={cx(rootClass, className)}
      data-size={resolvedSize}
      data-tone={resolvedTone}
      data-orientation={resolvedOrientation}
      orientation={resolvedOrientation}
    />
  );
}

export interface RadioGroupItemProps
  extends Omit<
    ComponentPropsWithoutRef<typeof RadixRadioGroup.Item>,
    'asChild'
  > {
  readonly ref?: Ref<HTMLButtonElement>;
  readonly children?: ReactNode;
}

const itemClass: string = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  width: var(--_radio-size, var(--silk-space-5));
  height: var(--_radio-size, var(--silk-space-5));
  border: 1px solid var(--_tone-border, var(--silk-color-border-subtle));
  border-radius: var(--silk-radius-full);
  background-color: var(--silk-color-surface-sunken);
  cursor: pointer;

  &:where(:focus-visible) {
    ${focusRingCss()}
  }

  &:where([data-state='checked']) {
    border-color: var(--_tone-solid, var(--silk-color-tone-accent-solid));
  }

  :where([data-invalid='true']) & {
    border-color: var(--silk-color-tone-danger-solid);
  }

  :where([data-invalid='true']) &:where(:focus-visible) {
    ${focusRingCss('var(--silk-color-tone-danger-focus-ring)')}
  }

  &:where(:disabled),
  &:where([data-disabled]) {
    cursor: not-allowed;
    background-color: var(
      --_tone-disabled-bg,
      var(--silk-color-tone-neutral-disabled-bg)
    );
    border-color: transparent;
  }
`;

const indicatorClass: string = css`
  display: block;
  width: 45%;
  height: 45%;
  border-radius: var(--silk-radius-full);
  background-color: var(--_tone-solid, var(--silk-color-tone-accent-solid));
`;

const itemRowClass: string = css`
  display: inline-flex;
  align-items: center;
  gap: var(--silk-space-2);
`;

function RadioGroupItem({
  className,
  children,
  ...props
}: RadioGroupItemProps): JSX.Element {
  if (children == null) {
    return (
      <RadixRadioGroup.Item {...props} className={cx(itemClass, className)}>
        <RadixRadioGroup.Indicator className={indicatorClass} />
      </RadixRadioGroup.Item>
    );
  }

  return (
    <label className={itemRowClass}>
      <RadixRadioGroup.Item {...props} className={cx(itemClass, className)}>
        <RadixRadioGroup.Indicator className={indicatorClass} />
      </RadixRadioGroup.Item>
      <span>{children}</span>
    </label>
  );
}

export interface RadioGroupNamespace {
  readonly Root: typeof RadioGroupRoot;
  readonly Item: typeof RadioGroupItem;
}

export const RadioGroup: RadioGroupNamespace = {
  Root: RadioGroupRoot,
  Item: RadioGroupItem,
};
