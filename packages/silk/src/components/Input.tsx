import { css, cx } from '@linaria/core';
import { inputRecipe, type InputVariantProps } from '@reactive/silk-core';
import type { ComponentPropsWithoutRef, JSX, Ref } from 'react';
import { densityClass } from '../theme/density.css';
import { useComponentDefaults } from '../theme/SilkProvider';
import { useThemeDensity } from '../theme/ThemeScope';
import { controlBaseCss } from './controlStyles';
import { useFieldControlProps } from './Field';

export interface InputProps
  extends Omit<ComponentPropsWithoutRef<'input'>, 'size'>, InputVariantProps {
  readonly ref?: Ref<HTMLInputElement>;
}

const inputClass: string = css`
  ${controlBaseCss}
`;

/**
 * Text input with Field integration, invalid/disabled token states.
 */
export function Input({
  className,
  size,
  density,
  id,
  disabled,
  required,
  ...props
}: InputProps): JSX.Element {
  const defaults = useComponentDefaults('Input');
  const themeDensity = useThemeDensity();
  const resolvedSize = size ?? defaults.size ?? inputRecipe.defaults.size;
  const resolvedDensity =
    density ??
    defaults.density ??
    themeDensity ??
    inputRecipe.defaults.density;

  const fieldProps = useFieldControlProps({
    id,
    disabled,
    required,
    'aria-describedby': props['aria-describedby'],
    'aria-invalid': props['aria-invalid'],
  });

  return (
    <input
      {...props}
      {...fieldProps}
      type={props.type ?? 'text'}
      className={cx(inputClass, densityClass, className)}
      data-size={resolvedSize}
      data-density={resolvedDensity}
    />
  );
}
