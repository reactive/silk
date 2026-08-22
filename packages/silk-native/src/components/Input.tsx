import { inputRecipe, type InputVariantProps } from '@reactive/silk-core';
import type { JSX, Ref } from 'react';
import {
  TextInput,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
} from 'react-native';
import { mapInputStyle } from '../styles/mappers/controls.js';
import { useComponentDefaults } from '../theme/SilkProvider.js';
import { useTheme } from '../theme/ThemeProvider.js';
import type { AriaInvalid } from './Field.js';
import { useTextControl } from './useTextControl.js';

export interface InputProps
  extends InputVariantProps,
    Omit<
      TextInputProps,
      'style' | 'editable' | 'aria-describedby' | 'aria-invalid'
    > {
  readonly ref?: Ref<TextInput>;
  readonly style?: StyleProp<TextStyle>;
  readonly disabled?: boolean;
  readonly invalid?: boolean;
  readonly required?: boolean;
  readonly 'aria-describedby'?: string;
  readonly 'aria-invalid'?: AriaInvalid;
}

export function Input({
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
}: InputProps): JSX.Element {
  const { theme, density: themeDensity } = useTheme();
  const defaults = useComponentDefaults('Input');
  const resolved: InputVariantProps = {
    size: size ?? defaults.size ?? inputRecipe.defaults.size,
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
  const mapped = mapInputStyle(theme, resolved, themeDensity, {
    focused: control.focused,
    invalid: control.invalid,
    disabled: control.disabled,
  });

  return (
    <TextInput
      {...rest}
      {...control.inputProps}
      placeholderTextColor={theme.semantic.color.textSecondary}
      style={[mapped, style]}
    />
  );
}
