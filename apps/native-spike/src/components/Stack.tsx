import { stackRecipe, type StackVariantProps } from '@reactive/silk-core';
import type { JSX, ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import { mapStackStyle } from '../styles/mapStyles';
import { useTheme } from '../theme/ThemeProvider';

export interface StackProps
  extends StackVariantProps, Omit<ViewProps, 'children'> {
  readonly children?: ReactNode;
}

export function Stack({
  direction,
  gap,
  align,
  wrap,
  style,
  children,
  ...rest
}: StackProps): JSX.Element {
  const { theme, density } = useTheme();
  const resolved: StackVariantProps = {
    direction: direction ?? stackRecipe.defaults.direction,
    gap: gap ?? stackRecipe.defaults.gap,
    align: align ?? stackRecipe.defaults.align,
    wrap: wrap ?? stackRecipe.defaults.wrap,
  };
  const mapped = mapStackStyle(theme, resolved, density);
  return (
    <View {...rest} style={[mapped, style]}>
      {children}
    </View>
  );
}
