import {
  separatorRecipe,
  type SeparatorVariantProps,
} from '@reactive/silk-core';
import type { JSX, Ref } from 'react';
import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { rnwAttrs } from '../styles/a11yProps.js';
import { mapSeparatorStyle } from '../styles/mappers/visual.js';
import { useComponentDefaults } from '../theme/SilkProvider.js';
import { useTheme } from '../theme/ThemeProvider.js';

export interface SeparatorProps
  extends SeparatorVariantProps, Omit<ViewProps, 'children' | 'style'> {
  readonly ref?: Ref<View>;
  readonly style?: StyleProp<ViewStyle>;
  /** When true (default), hidden from the accessibility tree. */
  readonly decorative?: boolean;
}

export function Separator({
  orientation,
  decorative = true,
  style,
  ref,
  ...rest
}: SeparatorProps): JSX.Element {
  const { theme } = useTheme();
  const defaults = useComponentDefaults('Separator');
  const resolvedOrientation =
    orientation ?? defaults.orientation ?? separatorRecipe.defaults.orientation;
  const resolved: SeparatorVariantProps = {
    orientation: resolvedOrientation,
  };
  const mapped = mapSeparatorStyle(theme, resolved);

  if (decorative) {
    return (
      <View
        ref={ref}
        {...rest}
        accessible={false}
        importantForAccessibility="no"
        style={[mapped, style]}
      />
    );
  }

  return (
    <View
      ref={ref}
      {...rest}
      role="separator"
      {...rnwAttrs({ 'aria-orientation': resolvedOrientation })}
      style={[mapped, style]}
    />
  );
}
