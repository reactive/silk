import {
  textareaRecipe,
  type TextareaVariantProps,
} from '@reactive/silk-core';
import type { JSX, Ref } from 'react';
import {
  TextInput,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
} from 'react-native';
import { mapTextareaStyle } from '../styles/mappers/controls.js';
import { useComponentDefaults } from '../theme/SilkProvider.js';
import { useTheme } from '../theme/ThemeProvider.js';
import type { AriaInvalid } from './Field.js';
import { useTextControl } from './useTextControl.js';

export interface TextareaProps
  extends TextareaVariantProps,
    Omit<
      TextInputProps,
      | 'style'
      | 'editable'
      | 'multiline'
      | 'aria-describedby'
      | 'aria-invalid'
    > {
  readonly ref?: Ref<TextInput>;
  readonly style?: StyleProp<TextStyle>;
  readonly disabled?: boolean;
  readonly invalid?: boolean;
  readonly required?: boolean;
  readonly 'aria-describedby'?: string;
  readonly 'aria-invalid'?: AriaInvalid;
}

export function Textarea({
  size,
  density,
  style,
  ref,
  disabled,
  invalid,
  required,
  onFocus,
  onBlur,
  nativeID,
  accessibilityLabel,
  accessibilityHint,
  accessibilityLabelledBy,
  accessibilityState,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...rest
}: TextareaProps): JSX.Element {
  const { theme, density: themeDensity } = useTheme();
  const defaults = useComponentDefaults('Textarea');
  const resolved: TextareaVariantProps = {
    size: size ?? defaults.size ?? textareaRecipe.defaults.size,
    density: density ?? defaults.density ?? themeDensity,
  };
  const control = useTextControl({
    ref,
    nativeID,
    accessibilityLabel,
    accessibilityHint,
    accessibilityLabelledBy,
    accessibilityState,
    ariaDescribedBy,
    ariaInvalid,
    disabled,
    invalid,
    required,
    onFocus,
    onBlur,
  });
  const mapped = mapTextareaStyle(theme, resolved, themeDensity, {
    focused: control.focused,
    invalid: control.invalid,
    disabled: control.disabled,
  });

  return (
    <TextInput
      ref={control.ref}
      {...rest}
      {...control.stateProps}
      multiline
      textAlignVertical="top"
      nativeID={control.fieldProps.nativeID}
      accessibilityLabel={control.fieldProps.accessibilityLabel}
      accessibilityHint={control.fieldProps.accessibilityHint}
      accessibilityLabelledBy={control.fieldProps.accessibilityLabelledBy}
      editable={!control.disabled}
      placeholderTextColor={theme.semantic.color.textSecondary}
      onFocus={control.onFocus}
      onBlur={control.onBlur}
      style={[mapped, style]}
      {...({
        'aria-describedby': control.fieldProps['aria-describedby'],
        'aria-invalid': control.fieldProps['aria-invalid'],
        'aria-required': control.fieldProps['aria-required'],
        'data-invalid': control.invalid ? 'true' : undefined,
        'data-disabled': control.disabled ? 'true' : undefined,
      } as object)}
    />
  );
}
