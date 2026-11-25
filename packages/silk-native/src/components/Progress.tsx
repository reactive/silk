import {
  progressRecipe,
  type ProgressVariantProps,
} from '@reactive/silk-core';
import type { ComponentRef, JSX, Ref } from 'react';
import {
  I18nManager,
  View,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import Animated, { type CSSAnimationKeyframes } from 'react-native-reanimated';
import { useLoop } from '../motion/useLoop.js';
import { a11yValue } from '../styles/a11yProps.js';
import { mapProgressStyle } from '../styles/mappers/visual.js';
import { useMotionPreference } from '../styles/useReducedMotion.js';
import { useComponentDefaults } from '../theme/SilkProvider.js';
import { useTheme } from '../theme/ThemeProvider.js';

/** The indeterminate indicator's width, in percent of the track. */
const SWEEP_WIDTH = 40;
/** Where the sweep ends, flush with the far end, in percent of the indicator's own width. */
const SWEEP_END = ((100 - SWEEP_WIDTH) / SWEEP_WIDTH) * 100;

/**
 * The indeterminate sweep, from beyond the track's start to flush with its
 * end. A translate's percent is of the view's own width, so it needs no
 * measured track. It is physical, so RTL (where the indicator rests at the
 * right) flips its sign.
 */
const sweepToward = (sign: 1 | -1): CSSAnimationKeyframes => ({
  from: { transform: [{ translateX: `${-100 * sign}%` }] },
  to: { transform: [{ translateX: `${SWEEP_END * sign}%` }] },
});
const sweep = sweepToward(1);
const sweepRtl = sweepToward(-1);

export interface ProgressProps
  extends ProgressVariantProps, Omit<ViewProps, 'children' | 'style'> {
  readonly ref?: Ref<ComponentRef<typeof View>>;
  readonly style?: StyleProp<ViewStyle>;
  /** Omit / null → indeterminate. */
  readonly value?: number | null;
  readonly max?: number;
  readonly label?: string;
}

/**
 * Determinate / indeterminate progress bar.
 * Reduced-motion indeterminate: static tone.subtle fill (native adaptation of
 * web's 35% solid-over-sunken mix).
 */
export function Progress({
  size,
  tone,
  value,
  max = 100,
  label,
  accessibilityLabel,
  style,
  ref,
  ...rest
}: ProgressProps): JSX.Element {
  const { theme, density } = useTheme();
  const defaults = useComponentDefaults('Progress');
  const resolvedTone = tone ?? defaults.tone ?? progressRecipe.defaults.tone;
  const resolved: ProgressVariantProps = {
    size: size ?? defaults.size ?? progressRecipe.defaults.size,
    tone: resolvedTone,
  };
  const { track, indicator } = mapProgressStyle(theme, resolved, density);
  const reduced = useMotionPreference() === 'reduced';
  const resolvedLabel = label ?? accessibilityLabel ?? 'Progress';

  // Match web Progress normalization (safeMax + Radix-like indeterminate).
  const safeMax = max > 0 ? max : 100;
  const indeterminate =
    value == null || Number.isNaN(value) || value < 0;
  const resolvedValue = indeterminate ? null : Math.min(value, safeMax);
  const pct =
    resolvedValue == null
      ? 0
      : Math.min(1, Math.max(0, resolvedValue / safeMax));

  const swept = useLoop(I18nManager.isRTL ? sweepRtl : sweep);
  const indicatorWidth: `${number}%` = indeterminate
    ? reduced
      ? '100%'
      : `${SWEEP_WIDTH}%`
    : `${pct * 100}%`;

  const valueProps = a11yValue({
    min: 0,
    max: safeMax,
    ...(resolvedValue != null ? { now: resolvedValue } : {}),
  });

  const indicatorBg =
    indeterminate && reduced
      ? theme.semantic.color.tones[resolvedTone].subtle
      : indicator.backgroundColor;

  return (
    <View
      ref={ref}
      {...rest}
      {...valueProps}
      accessibilityRole="progressbar"
      accessibilityLabel={resolvedLabel}
      style={[track, style]}
    >
      <Animated.View
        style={[
          indicator,
          { width: indicatorWidth, backgroundColor: indicatorBg },
          indeterminate && swept,
        ]}
      />
    </View>
  );
}
