import { stackRecipe, type StackVariantProps } from '@reactive/silk-core';
import type { JSX, ReactNode, Ref } from 'react';
import { View, type ViewProps } from 'react-native';
import { mapStackStyle } from '../styles/mapStyles.js';
import { useComponentDefaults } from '../theme/SilkProvider.js';
import { useTheme } from '../theme/ThemeProvider.js';

export interface StackProps
  extends StackVariantProps, Omit<ViewProps, 'children'> {
  readonly ref?: Ref<View>;
  readonly children?: ReactNode;
}

export function Stack({
  gap,
  align,
  justify,
  rail,
  style,
  children,
  ref,
  ...rest
}: StackProps): JSX.Element {
  const { theme, density } = useTheme();
  const defaults = useComponentDefaults('Stack');
  const resolved: StackVariantProps = {
    gap: gap ?? defaults.gap ?? stackRecipe.defaults.gap,
    align: align ?? defaults.align ?? stackRecipe.defaults.align,
    justify: justify ?? defaults.justify ?? stackRecipe.defaults.justify,
    rail: rail ?? defaults.rail ?? stackRecipe.defaults.rail,
  };
  const mapped = mapStackStyle(theme, resolved, density);
  return (
    <View ref={ref} {...rest} style={[mapped, style]}>
      {children}
    </View>
  );
}
