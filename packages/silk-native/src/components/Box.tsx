import { boxRecipe, type BoxVariantProps } from '@reactive/silk-core';
import type { JSX, ReactNode, Ref } from 'react';
import { View, type ViewProps } from 'react-native';
import { mapBoxStyle } from '../styles/mapStyles.js';
import { useComponentDefaults } from '../theme/SilkProvider.js';
import { useTheme } from '../theme/ThemeProvider.js';

export interface BoxProps extends BoxVariantProps, Omit<ViewProps, 'children'> {
  readonly ref?: Ref<View>;
  readonly children?: ReactNode;
}

export function Box({
  padding,
  style,
  children,
  ref,
  ...rest
}: BoxProps): JSX.Element {
  const { theme, density } = useTheme();
  const defaults = useComponentDefaults('Box');
  const resolved: BoxVariantProps = {
    padding: padding ?? defaults.padding ?? boxRecipe.defaults.padding,
  };
  const mapped = mapBoxStyle(theme, resolved, density);
  return (
    <View ref={ref} {...rest} style={[mapped, style]}>
      {children}
    </View>
  );
}
