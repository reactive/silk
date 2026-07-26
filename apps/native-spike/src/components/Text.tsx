import { textRecipe, type TextVariantProps } from '@reactive/silk-core';
import type { JSX, ReactNode } from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { mapTextStyle } from '../styles/mapStyles';
import { useTheme } from '../theme/ThemeProvider';

export interface TextProps
  extends TextVariantProps, Omit<RNTextProps, 'children' | 'role'> {
  readonly children?: ReactNode;
}

export function Text({
  role,
  tone,
  style,
  children,
  ...rest
}: TextProps): JSX.Element {
  const { theme } = useTheme();
  const resolved: TextVariantProps = {
    role: role ?? textRecipe.defaults.role,
    tone: tone ?? textRecipe.defaults.tone,
  };
  const mapped = mapTextStyle(theme, resolved);
  return (
    <RNText {...rest} style={[mapped, style]}>
      {children}
    </RNText>
  );
}
