import { css, cx } from '@linaria/core';
import { textareaRecipe, type TextareaVariantProps } from '@reactive/silk-core';
import type { ComponentPropsWithoutRef, JSX, Ref } from 'react';
import { densityClass } from '../theme/density.css';
import { useComponentDefaults } from '../theme/SilkProvider';
import { useThemeDensity } from '../theme/ThemeScope';
import { controlBaseCss } from './controlStyles';
import { useFieldControlProps } from './Field';

export interface TextareaProps
  extends ComponentPropsWithoutRef<'textarea'>, TextareaVariantProps {
  readonly ref?: Ref<HTMLTextAreaElement>;
}

const textareaClass: string = css`
  ${controlBaseCss}
  resize: vertical;
  min-height: calc(var(--silk-space-8) * 2);
`;

/**
 * Multiline text control with Field integration.
 */
export function Textarea({
  className,
  size,
  density,
  id,
  disabled,
  required,
  ...props
}: TextareaProps): JSX.Element {
  const defaults = useComponentDefaults('Textarea');
  const themeDensity = useThemeDensity();
  const resolvedSize = size ?? defaults.size ?? textareaRecipe.defaults.size;
  const resolvedDensity =
    density ??
    defaults.density ??
    themeDensity ??
    textareaRecipe.defaults.density;

  const fieldProps = useFieldControlProps({
    id,
    disabled,
    required,
    'aria-describedby': props['aria-describedby'],
    'aria-invalid': props['aria-invalid'],
  });

  return (
    <textarea
      {...props}
      {...fieldProps}
      className={cx(textareaClass, densityClass, className)}
      data-size={resolvedSize}
      data-density={resolvedDensity}
    />
  );
}
