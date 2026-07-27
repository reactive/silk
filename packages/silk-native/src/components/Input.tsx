import { inputRecipe, type InputVariantProps } from '@reactive/silk-core';
import { useState, type JSX, type Ref } from 'react';
import {
  TextInput,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
} from 'react-native';
import { mapInputStyle } from '../styles/mapStyles.js';
import { useComponentDefaults } from '../theme/SilkProvider.js';
import { useTheme } from '../theme/ThemeProvider.js';
import { useFieldControlProps } from './Field.js';

export interface InputProps
  extends InputVariantProps,
    Omit<TextInputProps, 'style' | 'editable'> {
  readonly ref?: Ref<TextInput>;
  readonly style?: StyleProp<TextStyle>;
  readonly disabled?: boolean;
  readonly invalid?: boolean;
}

export function Input({
  size,
  density,
  style,
  ref,
  disabled,
  invalid,
  onFocus,
  onBlur,
  nativeID,
  accessibilityLabel,
  accessibilityHint,
  accessibilityLabelledBy,
  ...rest
}: InputProps): JSX.Element {
  const { theme, density: themeDensity } = useTheme();
  const defaults = useComponentDefaults('Input');
  const resolved: InputVariantProps = {
    size: size ?? defaults.size ?? inputRecipe.defaults.size,
    density: density ?? defaults.density ?? themeDensity,
  };
  const fieldProps = useFieldControlProps({
    nativeID,
    accessibilityLabel,
    accessibilityHint,
    accessibilityLabelledBy,
    disabled,
    'aria-invalid': invalid,
  });
  const [focused, setFocused] = useState(false);
  const isDisabled = Boolean(fieldProps.disabled);
  const isInvalid = Boolean(fieldProps.invalid || invalid);
  const mapped = mapInputStyle(theme, resolved, themeDensity, {
    focused,
    invalid: isInvalid,
    disabled: isDisabled,
  });

  return (
    <TextInput
      ref={ref}
      {...rest}
      nativeID={fieldProps.nativeID}
      accessibilityLabel={fieldProps.accessibilityLabel}
      accessibilityHint={fieldProps.accessibilityHint}
      accessibilityLabelledBy={fieldProps.accessibilityLabelledBy}
      editable={!isDisabled}
      placeholderTextColor={theme.semantic.color.textSecondary}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      style={[mapped, style]}
      {...({
        'aria-invalid': fieldProps['aria-invalid'],
        'aria-required': fieldProps['aria-required'],
        'data-invalid': isInvalid ? 'true' : undefined,
        'data-disabled': isDisabled ? 'true' : undefined,
      } as object)}
    />
  );
}
