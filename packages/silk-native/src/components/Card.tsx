import { cardRecipe, type CardVariantProps } from '@reactive/silk-core';
import type { JSX, ReactNode, Ref } from 'react';
import {
  Pressable,
  View,
  type PressableProps,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { mapCardStyle } from '../styles/mappers/visual.js';
import { useComponentDefaults } from '../theme/SilkProvider.js';
import { useTheme } from '../theme/ThemeProvider.js';

export interface CardProps
  extends CardVariantProps, Omit<ViewProps, 'children' | 'style'> {
  readonly ref?: Ref<View>;
  readonly children?: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
  /** When provided, host becomes Pressable. `interactive` alone is styling-only. */
  readonly onPress?: PressableProps['onPress'];
  readonly disabled?: boolean;
}

export function Card({
  elevation,
  padding,
  radius,
  interactive,
  style,
  children,
  ref,
  onPress,
  disabled,
  ...rest
}: CardProps): JSX.Element {
  const { theme, density } = useTheme();
  const defaults = useComponentDefaults('Card');
  const resolved: CardVariantProps = {
    elevation: elevation ?? defaults.elevation ?? cardRecipe.defaults.elevation,
    padding: padding ?? defaults.padding ?? cardRecipe.defaults.padding,
    radius: radius ?? defaults.radius ?? cardRecipe.defaults.radius,
    interactive:
      interactive ?? defaults.interactive ?? cardRecipe.defaults.interactive,
  };
  const resting = mapCardStyle(theme, resolved, density, false);

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
            ? mapCardStyle(theme, resolved, density, true)
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
