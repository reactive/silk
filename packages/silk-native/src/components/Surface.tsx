import { surfaceRecipe, type SurfaceVariantProps } from '@reactive/silk-core';
import type { JSX, ReactNode, Ref } from 'react';
import {
  Pressable,
  View,
  type PressableProps,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { mapSurfaceStyle } from '../styles/mapStyles.js';
import { useComponentDefaults } from '../theme/SilkProvider.js';
import { useTheme } from '../theme/ThemeProvider.js';

export interface SurfaceProps
  extends SurfaceVariantProps, Omit<ViewProps, 'children' | 'style'> {
  readonly ref?: Ref<View>;
  readonly children?: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
  /**
   * When provided, the host becomes a Pressable. `interactive` alone never
   * implies clickability (web parity).
   */
  readonly onPress?: PressableProps['onPress'];
  readonly disabled?: boolean;
}

export function Surface({
  elevation,
  radius,
  border,
  interactive,
  style,
  children,
  ref,
  onPress,
  disabled,
  ...rest
}: SurfaceProps): JSX.Element {
  const { theme } = useTheme();
  const defaults = useComponentDefaults('Surface');
  const resolved: SurfaceVariantProps = {
    elevation:
      elevation ?? defaults.elevation ?? surfaceRecipe.defaults.elevation,
    radius: radius ?? defaults.radius ?? surfaceRecipe.defaults.radius,
    border: border ?? defaults.border ?? surfaceRecipe.defaults.border,
    interactive:
      interactive ??
      defaults.interactive ??
      surfaceRecipe.defaults.interactive,
  };
  const resting = mapSurfaceStyle(theme, resolved, false);

  if (onPress) {
    const {
      accessibilityRole = 'button',
      ...pressableRest
    } = rest as Omit<PressableProps, 'children' | 'style'>;
    return (
      <Pressable
        ref={ref}
        {...pressableRest}
        accessibilityRole={accessibilityRole}
        disabled={disabled}
        onPress={onPress}
        style={(state) => [
          state.pressed && !disabled
            ? mapSurfaceStyle(theme, resolved, true)
            : resting,
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View ref={ref} {...rest} style={[resting, style]}>
      {children}
    </View>
  );
}
