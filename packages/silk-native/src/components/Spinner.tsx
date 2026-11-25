import { spinnerRecipe, type SpinnerVariantProps } from '@reactive/silk-core';
import type { JSX } from 'react';
import type { StyleProp, ViewProps, ViewStyle } from 'react-native';
import Animated, { type CSSAnimationKeyframes } from 'react-native-reanimated';
import { useLoop } from '../motion/useLoop.js';
import { mapSpinnerStyle } from '../styles/mappers/visual.js';
import { useMotionPreference } from '../styles/useReducedMotion.js';
import { useComponentDefaults } from '../theme/SilkProvider.js';
import { useTheme } from '../theme/ThemeProvider.js';

const spin: CSSAnimationKeyframes = {
  from: { transform: [{ rotate: '0deg' }] },
  to: { transform: [{ rotate: '360deg' }] },
};

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
  label,
  accessibilityLabel,
  style,
  ...rest
}: SpinnerProps): JSX.Element {
  const { theme, density } = useTheme();
  const defaults = useComponentDefaults('Spinner');
  const resolved: SpinnerVariantProps = {
    size: size ?? defaults.size ?? spinnerRecipe.defaults.size,
    tone: tone ?? defaults.tone ?? spinnerRecipe.defaults.tone,
  };
  const reduced = useMotionPreference() === 'reduced';
  const resolvedLabel = label ?? accessibilityLabel ?? 'Loading';
  const mapped = mapSpinnerStyle(theme, resolved, density, reduced);
  const spinning = useLoop(spin);

  return (
    <Animated.View
      {...rest}
      accessibilityLabel={resolvedLabel}
      // Broader role for RNW `role="status"` mapping.
      role="status"
      // Android-only live region enhancement.
      accessibilityLiveRegion="polite"
      style={[mapped, spinning, style]}
    />
  );
}
