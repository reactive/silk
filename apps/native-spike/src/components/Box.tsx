import { boxRecipe, type BoxVariantProps } from '@reactive/silk-core';
import type { JSX, ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import { mapBoxStyle } from '../styles/mapStyles';
import { useTheme } from '../theme/ThemeProvider';

export interface BoxProps extends BoxVariantProps, Omit<ViewProps, 'children'> {
  readonly children?: ReactNode;
}

export function Box({
  padding,
  style,
  children,
  ...rest
}: BoxProps): JSX.Element {
  const { theme, density } = useTheme();
  const resolved: BoxVariantProps = {
    padding: padding ?? boxRecipe.defaults.padding,
  };
  const mapped = mapBoxStyle(theme, resolved, density);
  return (
    <View {...rest} style={[mapped, style]}>
      {children}
    </View>
  );
}
