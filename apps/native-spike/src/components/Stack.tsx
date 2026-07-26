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
  gap,
  align,
  justify,
  style,
  children,
  ...rest
}: StackProps): JSX.Element {
  const { theme, density } = useTheme();
  const resolved: StackVariantProps = {
    gap: gap ?? stackRecipe.defaults.gap,
    align: align ?? stackRecipe.defaults.align,
    justify: justify ?? stackRecipe.defaults.justify,
  };
  const mapped = mapStackStyle(theme, resolved, density);
  return (
    <View {...rest} style={[mapped, style]}>
      {children}
    </View>
  );
}
