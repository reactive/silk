import {
  progressRecipe,
  type ProgressVariantProps,
} from '@reactive/silk-core';
import { useEffect, useRef, useState, type JSX, type Ref } from 'react';
import {
  Animated,
  Easing,
  I18nManager,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { a11yValue } from '../styles/a11yProps.js';
import { mapProgressStyle } from '../styles/mapStyles.js';
import { useReducedMotion } from '../styles/useReducedMotion.js';
import { useComponentDefaults } from '../theme/SilkProvider.js';
import { useTheme } from '../theme/ThemeProvider.js';

export interface ProgressProps
  extends ProgressVariantProps, Omit<ViewProps, 'children' | 'style'> {
  readonly ref?: Ref<View>;
  readonly style?: StyleProp<ViewStyle>;
  /** Omit / null → indeterminate. */
  readonly value?: number | null;
  readonly max?: number;
  readonly label?: string;
}

/**
 * Determinate / indeterminate progress bar.
 * Animations use measured track width (numeric transforms, not % widths).
 * Reduced-motion indeterminate: static tone.subtle fill (native adaptation of
 * web's 35% solid-over-sunken mix).
 */
export function Progress({
  size,
  tone,
  value,
  max = 100,
  label = 'Progress',
  style,
  ref,
  onLayout: onLayoutProp,
  ...rest
}: ProgressProps): JSX.Element {
  const { theme, density } = useTheme();
  const defaults = useComponentDefaults('Progress');
  const resolved: ProgressVariantProps = {
    size: size ?? defaults.size ?? progressRecipe.defaults.size,
    tone: tone ?? defaults.tone ?? progressRecipe.defaults.tone,
  };
  const { track, indicator } = mapProgressStyle(theme, resolved, density);
  const reduced = useReducedMotion();

  // Match web Progress normalization (safeMax + Radix-like indeterminate).
  const safeMax = max > 0 ? max : 100;
  const indeterminate =
    value == null || Number.isNaN(value) || value < 0;
  const resolvedValue = indeterminate ? null : Math.min(value, safeMax);
  const pct =
    resolvedValue == null
      ? 0
      : Math.min(1, Math.max(0, resolvedValue / safeMax));

  const [trackWidth, setTrackWidth] = useState(0);
  const translate = useRef(new Animated.Value(0)).current;
  const rtl = I18nManager.isRTL;

  const onLayout = (event: LayoutChangeEvent): void => {
    setTrackWidth(event.nativeEvent.layout.width);
    onLayoutProp?.(event);
  };

  useEffect(() => {
    if (!indeterminate || reduced || trackWidth === 0) {
      translate.setValue(0);
      return;
    }
    const indicatorWidth = trackWidth * 0.4;
    const travel = trackWidth - indicatorWidth;
    const start = rtl ? travel : -indicatorWidth;
    const end = rtl ? -indicatorWidth : travel;
    translate.setValue(start);
    const loop = theme.semantic.motion.loop.durationMs;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(translate, {
          toValue: end,
          duration: loop,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(translate, {
          toValue: start,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => {
      animation.stop();
    };
  }, [
    indeterminate,
    reduced,
    trackWidth,
    translate,
    rtl,
    theme.semantic.motion.loop.durationMs,
  ]);

  const indicatorWidth = indeterminate
    ? reduced
      ? trackWidth
      : trackWidth * 0.4
    : trackWidth * pct;

  const valueProps = a11yValue(
    indeterminate
      ? { min: 0, max: safeMax }
      : { min: 0, max: safeMax, now: resolvedValue as number },
  );

  const indicatorBg =
    indeterminate && reduced
      ? theme.semantic.color.tones[
          resolved.tone ?? progressRecipe.defaults.tone
        ].subtle
      : indicator.backgroundColor;

  return (
    <View
      ref={ref}
      {...rest}
      {...valueProps}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      onLayout={onLayout}
      style={[track, style]}
    >
      {trackWidth > 0 ? (
        <Animated.View
          style={[
            indicator,
            {
              width: indicatorWidth || 1,
              backgroundColor: indicatorBg,
              transform:
                indeterminate && !reduced
                  ? [{ translateX: translate }]
                  : undefined,
            },
          ]}
        />
      ) : null}
    </View>
  );
}
