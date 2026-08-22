import {
  statusDotRecipe,
  type StatusDotVariantProps,
} from '@reactive/silk-core';
import type { JSX, Ref } from 'react';
import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { mapStatusDotStyle } from '../styles/mappers/visual.js';
import { useComponentDefaults } from '../theme/SilkProvider.js';
import { useTheme } from '../theme/ThemeProvider.js';

export interface StatusDotProps
  extends StatusDotVariantProps, Omit<ViewProps, 'children' | 'style'> {
  readonly ref?: Ref<View>;
  readonly style?: StyleProp<ViewStyle>;
}

/**
 * Decorative status indicator. Hidden from the accessibility tree by default;
 * composites supply text alternatives (e.g. "Unread").
 */
export function StatusDot({
  tone,
  size,
  style,
  ref,
  accessible = false,
  ...rest
}: StatusDotProps): JSX.Element {
  const { theme, density } = useTheme();
  const defaults = useComponentDefaults('StatusDot');
  const resolved: StatusDotVariantProps = {
    tone: tone ?? defaults.tone ?? statusDotRecipe.defaults.tone,
    size: size ?? defaults.size ?? statusDotRecipe.defaults.size,
  };
  const mapped = mapStatusDotStyle(theme, resolved, density);

  return (
    <View
      ref={ref}
      {...rest}
      accessible={accessible}
      importantForAccessibility={accessible ? 'auto' : 'no'}
      style={[mapped, style]}
    />
  );
}
