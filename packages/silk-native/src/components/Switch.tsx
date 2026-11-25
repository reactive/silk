import { switchRecipe, type SwitchVariantProps } from '@reactive/silk-core';
import { useCallback, useState, type JSX } from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { a11yState, rnwAttrs } from '../styles/a11yProps.js';
import {
  minTouchHitSlop,
  switchThumbInset,
  switchThumbTravel,
} from '../styles/controlGeometry.js';
import { mapSwitchStyle } from '../styles/mappers/controls.js';
import { useReducedMotion } from '../styles/useReducedMotion.js';
import { useComponentDefaults } from '../theme/SilkProvider.js';
import { useTheme } from '../theme/ThemeProvider.js';
import { Pressable, type PressableProps } from './Pressable.js';
import {
  useFieldControlProps,
  useFieldControlRegistration,
} from './Field.js';
import { useControllableValue } from './useControllableValue.js';
import { useSwitchDrag } from './useSwitchDrag.js';

export interface SwitchProps
  extends SwitchVariantProps,
    Omit<PressableProps, 'children' | 'style' | 'onPress' | 'focusRing'> {
  readonly style?: StyleProp<ViewStyle>;
  readonly checked?: boolean;
  readonly defaultChecked?: boolean;
  readonly onCheckedChange?: (checked: boolean) => void;
  readonly disabled?: boolean;
  readonly invalid?: boolean;
  readonly required?: boolean;
  readonly 'aria-describedby'?: string;
}

export function Switch({
  size,
  tone,
  checked: checkedProp,
  defaultChecked = false,
  onCheckedChange,
  disabled,
  invalid,
  required,
  style,
  ref,
  onLayout: onLayoutProp,
  nativeID,
  accessibilityLabel,
  accessibilityHint,
  accessibilityLabelledBy,
  accessibilityState,
  'aria-describedby': ariaDescribedBy,
  ...rest
}: SwitchProps): JSX.Element {
  const { theme, density } = useTheme();
  const defaults = useComponentDefaults('Switch');
  const resolved: SwitchVariantProps = {
    size: size ?? defaults.size ?? switchRecipe.defaults.size,
    tone: tone ?? defaults.tone ?? switchRecipe.defaults.tone,
  };
  const fieldProps = useFieldControlProps({
    disabled,
    required,
    'aria-invalid': invalid,
    nativeID,
    accessibilityLabel,
    accessibilityHint,
    accessibilityLabelledBy,
    'aria-describedby': ariaDescribedBy,
  });
  const isDisabled = Boolean(fieldProps.disabled);
  const isInvalid = Boolean(fieldProps.invalid);
  const [checked, setUncontrolled] = useControllableValue(
    checkedProp,
    defaultChecked,
  );

  const { track, thumb, travel: defaultTravel } = mapSwitchStyle(
    theme,
    resolved,
    density,
    {
      checked,
      invalid: isInvalid,
      disabled: isDisabled,
    },
  );
  const { outlineWidth, outlineStyle, outlineColor, ...trackWithoutOutline } =
    track;
  const thumbSize = thumb.width;
  const [layoutWidth, setLayoutWidth] = useState(0);
  const travel =
    layoutWidth > 0
      ? switchThumbTravel(layoutWidth, thumbSize)
      : defaultTravel;

  const onLayout = (event: LayoutChangeEvent): void => {
    setLayoutWidth(event.nativeEvent.layout.width);
    onLayoutProp?.(event);
  };
  const stateProps = a11yState({
    ...accessibilityState,
    checked: Boolean(checked),
    disabled: isDisabled,
  });

  const turn = useCallback(
    (next: boolean): void => {
      if (isDisabled) return;
      setUncontrolled(next);
      onCheckedChange?.(next);
    },
    [isDisabled, onCheckedChange, setUncontrolled],
  );
  const hitSlop = minTouchHitSlop(track.height);
  // Until the system answers, as if motion were reduced: no spring it may have turned off.
  const reduced = useReducedMotion();
  const drag = useSwitchDrag({
    checked: Boolean(checked),
    travel,
    disabled: isDisabled,
    reduced,
    hitSlop,
    onLand: turn,
  });
  const toggle = useCallback((): void => {
    if (!isDisabled) drag.flip();
  }, [isDisabled, drag.flip]);
  useFieldControlRegistration(toggle);

  return (
    <GestureDetector gesture={drag.pan} touchAction={drag.touchAction}>
      <Pressable
        ref={ref}
        {...rest}
        {...stateProps}
        accessibilityRole="switch"
        accessibilityLabel={fieldProps.accessibilityLabel}
        accessibilityHint={fieldProps.accessibilityHint}
        accessibilityLabelledBy={fieldProps.accessibilityLabelledBy}
        nativeID={fieldProps.nativeID}
        disabled={isDisabled}
        hitSlop={hitSlop}
        focusRing={isInvalid ? 'danger' : resolved.tone}
        onPress={toggle}
        onLayout={onLayout}
        // The ring replaces the invalid outline while focused (web parity).
        style={({ focusVisible }) => [
          focusVisible ? trackWithoutOutline : track,
          style,
        ]}
        {...rnwAttrs({
          'aria-describedby': fieldProps['aria-describedby'],
          'aria-invalid': fieldProps['aria-invalid'],
          'aria-required': fieldProps['aria-required'],
          'data-invalid': isInvalid ? 'true' : undefined,
          'data-state': checked ? 'checked' : 'unchecked',
        }, rest)}
      >
        <Animated.View
          style={[thumb, { marginStart: switchThumbInset }, drag.thumbMotion]}
        />
      </Pressable>
    </GestureDetector>
  );
}
