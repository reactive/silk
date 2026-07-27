import { spinnerRecipe, type SpinnerVariantProps } from '@reactive/silk-core';
import { useEffect, useRef, type JSX } from 'react';
import {
  Animated,
  Easing,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { mapSpinnerStyle } from '../styles/mapStyles.js';
import { useReducedMotion } from '../styles/useReducedMotion.js';
import { useComponentDefaults } from '../theme/SilkProvider.js';
import { useTheme } from '../theme/ThemeProvider.js';

export interface SpinnerProps
  extends SpinnerVariantProps, Omit<ViewProps, 'children' | 'style' | 'ref'> {
  readonly style?: StyleProp<ViewStyle>;
  /** Accessible name announced to assistive tech. */
  readonly label?: string;
}

/**
 * Indeterminate loading indicator. Ring uses tone.subtle + tone.solid
 * (semantic analog of web's 25% solid mix — no color-string parsing).
 */
export function Spinner({
  size,
  tone,
  label = 'Loading',
  style,
  ...rest
}: SpinnerProps): JSX.Element {
  const { theme, density } = useTheme();
  const defaults = useComponentDefaults('Spinner');
  const resolved: SpinnerVariantProps = {
    size: size ?? defaults.size ?? spinnerRecipe.defaults.size,
    tone: tone ?? defaults.tone ?? spinnerRecipe.defaults.tone,
  };
  const reduced = useReducedMotion();
  const mapped = mapSpinnerStyle(theme, resolved, density, reduced);
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) {
      rotation.setValue(0);
      return;
    }
    const loop = theme.semantic.motion.loop.durationMs;
    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: loop,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => {
      animation.stop();
    };
  }, [reduced, rotation, theme.semantic.motion.loop.durationMs]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      {...rest}
      accessibilityLabel={label}
      // Broader role for RNW `role="status"` mapping.
      role="status"
      // Android-only live region enhancement.
      accessibilityLiveRegion="polite"
      style={[mapped, { transform: [{ rotate }] }, style]}
    />
  );
}
