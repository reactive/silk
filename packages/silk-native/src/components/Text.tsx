import { textRecipe, type TextVariantProps } from '@reactive/silk-core';
import type { JSX, ReactNode, Ref } from 'react';
import {
  Text as RNText,
  type TextProps as RNTextProps,
} from 'react-native';
import { mapTextStyle } from '../styles/mapStyles.js';
import { useComponentDefaults } from '../theme/SilkProvider.js';
import { useTheme } from '../theme/ThemeProvider.js';

export interface TextProps
  extends TextVariantProps, Omit<RNTextProps, 'children' | 'role'> {
  readonly ref?: Ref<RNText>;
  readonly children?: ReactNode;
}

export function Text({
  role,
  tone,
  measure,
  style,
  children,
  ref,
  ...rest
}: TextProps): JSX.Element {
  const { theme } = useTheme();
  const defaults = useComponentDefaults('Text');
  const resolved: TextVariantProps = {
    role: role ?? defaults.role ?? textRecipe.defaults.role,
    tone: tone ?? defaults.tone ?? textRecipe.defaults.tone,
    measure: measure ?? defaults.measure ?? textRecipe.defaults.measure,
  };
  const mapped = mapTextStyle(theme, resolved);
  return (
    <RNText ref={ref} {...rest} style={[mapped, style]}>
      {children}
    </RNText>
  );
}
