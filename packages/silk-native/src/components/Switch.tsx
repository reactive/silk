import { switchRecipe, type SwitchVariantProps } from '@reactive/silk-core';
import { useEffect, useRef, useState, type JSX, type Ref } from 'react';
import {
  Animated,
  I18nManager,
  Pressable,
  View,
  type LayoutChangeEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { a11yState } from '../styles/a11yProps.js';
import {
  switchThumbInset,
  switchThumbTravel,
} from '../styles/controlGeometry.js';
import { mapSwitchStyle } from '../styles/mapStyles.js';
import { useReducedMotion } from '../styles/useReducedMotion.js';
import { useComponentDefaults } from '../theme/SilkProvider.js';
import { useTheme } from '../theme/ThemeProvider.js';
import { useFieldControlProps } from './Field.js';

export interface SwitchProps
  extends SwitchVariantProps,
    Omit<PressableProps, 'children' | 'style' | 'onPress'> {
  readonly ref?: Ref<View>;
  readonly style?: StyleProp<ViewStyle>;
  readonly checked?: boolean;
  readonly defaultChecked?: boolean;
  readonly onCheckedChange?: (checked: boolean) => void;
  readonly disabled?: boolean;
  readonly invalid?: boolean;
  readonly required?: boolean;
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
  });
  const isDisabled = Boolean(fieldProps.disabled);
  const isInvalid = Boolean(fieldProps.invalid || invalid);
  const isControlled = checkedProp !== undefined;
  const [uncontrolled, setUncontrolled] = useState(defaultChecked);
  const checked = isControlled ? checkedProp : uncontrolled;

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
  const thumbSize = typeof thumb.width === 'number' ? thumb.width : 0;
  const [layoutWidth, setLayoutWidth] = useState(0);
  const travel =
    layoutWidth > 0
      ? switchThumbTravel(layoutWidth, thumbSize)
      : defaultTravel;
  const reduced = useReducedMotion();
  const rtl = I18nManager.isRTL;
  const signedTravel = (rtl ? -1 : 1) * travel;

  const onLayout = (event: LayoutChangeEvent): void => {
    setLayoutWidth(event.nativeEvent.layout.width);
    onLayoutProp?.(event);
  };
  const offset = useRef(new Animated.Value(checked ? signedTravel : 0)).current;

  useEffect(() => {
    const toValue = checked ? signedTravel : 0;
    if (reduced) {
      offset.setValue(toValue);
      return;
    }
    const animation = Animated.timing(offset, {
      toValue,
      duration: theme.semantic.motion.fast.durationMs,
      useNativeDriver: true,
    });
    animation.start();
    return () => {
      animation.stop();
    };
  }, [
    checked,
    signedTravel,
    reduced,
    offset,
    theme.semantic.motion.fast.durationMs,
  ]);

  const trackHeight = typeof track.height === 'number' ? track.height : 20;
  const hitSlop = Math.max(0, Math.ceil((44 - trackHeight) / 2));
  const stateProps = a11yState({
    ...accessibilityState,
    checked: Boolean(checked),
    disabled: isDisabled,
  });

  const toggle = (): void => {
    if (isDisabled) return;
    const next = !checked;
    if (!isControlled) setUncontrolled(next);
    onCheckedChange?.(next);
  };

  return (
    <Pressable
      ref={ref}
      {...rest}
      {...stateProps}
      accessibilityRole="switch"
      accessibilityLabel={fieldProps.accessibilityLabel ?? accessibilityLabel}
      accessibilityHint={fieldProps.accessibilityHint ?? accessibilityHint}
      accessibilityLabelledBy={fieldProps.accessibilityLabelledBy}
      nativeID={fieldProps.nativeID}
      disabled={isDisabled}
      hitSlop={hitSlop}
      onPress={toggle}
      onLayout={onLayout}
      style={[track, style]}
      {...({
        'aria-invalid': fieldProps['aria-invalid'],
        'aria-required': fieldProps['aria-required'],
        'data-invalid': isInvalid ? 'true' : undefined,
        'data-state': checked ? 'checked' : 'unchecked',
      } as object)}
    >
      <Animated.View
        style={[
          thumb,
          {
            marginStart: switchThumbInset,
            transform: [{ translateX: offset }],
          },
        ]}
      />
    </Pressable>
  );
}
