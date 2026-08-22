import { badgeRecipe, type BadgeVariantProps } from '@reactive/silk-core';
import type { JSX, ReactNode, Ref } from 'react';
import {
  Text as RNText,
  View,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { mapBadgeStyle } from '../styles/mappers/visual.js';
import { useComponentDefaults } from '../theme/SilkProvider.js';
import { useTheme } from '../theme/ThemeProvider.js';

export interface BadgeProps
  extends BadgeVariantProps, Omit<ViewProps, 'children' | 'style'> {
  readonly ref?: Ref<View>;
  readonly children?: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
}

export function Badge({
  variant,
  tone,
  size,
  style,
  children,
  ref,
  ...rest
}: BadgeProps): JSX.Element {
  const { theme, density } = useTheme();
  const defaults = useComponentDefaults('Badge');
  const resolved: BadgeVariantProps = {
    variant: variant ?? defaults.variant ?? badgeRecipe.defaults.variant,
    tone: tone ?? defaults.tone ?? badgeRecipe.defaults.tone,
    size: size ?? defaults.size ?? badgeRecipe.defaults.size,
  };
  const mapped = mapBadgeStyle(theme, resolved, density);

  return (
    <View ref={ref} {...rest} style={[mapped.view, style]}>
      <RNText style={mapped.text}>{children}</RNText>
    </View>
  );
}
