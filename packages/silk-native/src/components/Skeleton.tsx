import {
  skeletonRecipe,
  type SkeletonVariantProps,
} from '@reactive/silk-core';
import { useEffect, useRef, type JSX } from 'react';
import {
  Animated,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { mapSkeletonStyle } from '../styles/mapStyles.js';
import { useReducedMotion } from '../styles/useReducedMotion.js';
import { useComponentDefaults } from '../theme/SilkProvider.js';
import { useTheme } from '../theme/ThemeProvider.js';

export interface SkeletonProps
  extends SkeletonVariantProps, Omit<ViewProps, 'children' | 'style' | 'ref'> {
  readonly style?: StyleProp<ViewStyle>;
}

/**
 * Loading placeholder. Native adaptation: opacity pulse (web uses a moving
 * gradient unavailable in plain RN views). Static under reduced motion.
 */
export function Skeleton({
  shape,
  style,
  ...rest
}: SkeletonProps): JSX.Element {
  const { theme, density } = useTheme();
  const defaults = useComponentDefaults('Skeleton');
  const resolved: SkeletonVariantProps = {
    shape: shape ?? defaults.shape ?? skeletonRecipe.defaults.shape,
  };
  const mapped = mapSkeletonStyle(theme, resolved, density);
  const reduced = useReducedMotion();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduced) {
      opacity.setValue(1);
      return;
    }
    const loop = theme.semantic.motion.loop.durationMs;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.55,
          duration: loop / 2,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: loop / 2,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => {
      animation.stop();
    };
  }, [reduced, opacity, theme.semantic.motion.loop.durationMs]);

  return (
    <Animated.View
      {...rest}
      accessible={false}
      importantForAccessibility="no"
      style={[mapped, { opacity }, style]}
    />
  );
}
