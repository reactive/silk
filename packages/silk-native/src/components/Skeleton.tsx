import {
  skeletonRecipe,
  type SkeletonVariantProps,
} from '@reactive/silk-core';
import type { JSX } from 'react';
import type { StyleProp, ViewProps, ViewStyle } from 'react-native';
import Animated, { type CSSAnimationKeyframes } from 'react-native-reanimated';
import { useLoop } from '../motion/useLoop.js';
import { mapSkeletonStyle } from '../styles/mappers/visual.js';
import { useComponentDefaults } from '../theme/SilkProvider.js';
import { useTheme } from '../theme/ThemeProvider.js';

/**
 * Dims and brightens once per loop, easing in and out of each turn: a pulse
 * turns around mid-cycle, so it keeps its own curve and takes only the loop
 * token's duration. A keyframe selector is a percent string: Reanimated reads
 * a number as a fraction.
 */
const pulse: CSSAnimationKeyframes = {
  from: { opacity: 1, animationTimingFunction: 'ease-in-out' },
  '50%': { opacity: 0.55, animationTimingFunction: 'ease-in-out' },
  to: { opacity: 1 },
};

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
  const pulsing = useLoop(pulse, style);

  return (
    <Animated.View
      {...rest}
      accessible={false}
      importantForAccessibility="no"
      style={[mapped, pulsing, style]}
    />
  );
}
