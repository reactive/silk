import {
  checkboxRecipe,
  type CheckboxVariantProps,
} from '@reactive/silk-core';
import { useCallback, type JSX, type ReactNode } from 'react';
import {
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { a11yState, rnwAttrs } from '../styles/a11yProps.js';
import { minTouchHitSlop } from '../styles/controlGeometry.js';
import {
  checkboxIndicatorColor,
  mapCheckboxStyle,
} from '../styles/mappers/controls.js';
import { useComponentDefaults } from '../theme/SilkProvider.js';
import { useTheme } from '../theme/ThemeProvider.js';
import { CheckGlyph, DashGlyph } from './glyphs.js';
import { Pressable, type PressableProps } from './Pressable.js';
import {
  useFieldControlProps,
  useFieldControlRegistration,
} from './Field.js';
import { Text } from './Text.js';
import { useControllableValue } from './useControllableValue.js';

export type CheckedState = boolean | 'indeterminate';

export interface CheckboxProps
  extends CheckboxVariantProps,
    Omit<PressableProps, 'children' | 'style' | 'onPress' | 'focusRing'> {
  readonly children?: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
  /** Controlled — matches web/Radix tri-state. */
  readonly checked?: CheckedState;
  readonly defaultChecked?: CheckedState;
  readonly onCheckedChange?: (checked: CheckedState) => void;
  readonly disabled?: boolean;
  readonly invalid?: boolean;
  readonly required?: boolean;
  readonly 'aria-describedby'?: string;
}

/**
 * Tri-state checkbox on Pressable (RN has no checkbox primitive).
 * `checked` may be `boolean | 'indeterminate'` — same contract as web/Radix.
 */
export function Checkbox({
  size,
  tone,
  checked: checkedProp,
  defaultChecked = false,
  onCheckedChange,
  disabled,
  invalid,
  required,
  children,
  style,
  ref,
  nativeID,
  accessibilityLabel,
  accessibilityHint,
  accessibilityLabelledBy,
  accessibilityState,
  'aria-describedby': ariaDescribedBy,
  ...rest
}: CheckboxProps): JSX.Element {
  const { theme, density } = useTheme();
  const defaults = useComponentDefaults('Checkbox');
  const resolvedTone = tone ?? defaults.tone ?? checkboxRecipe.defaults.tone;
  const resolved: CheckboxVariantProps = {
    size: size ?? defaults.size ?? checkboxRecipe.defaults.size,
    tone: resolvedTone,
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

  const { row, box } = mapCheckboxStyle(theme, resolved, density, {
    checked,
    invalid: isInvalid,
    disabled: isDisabled,
  });
  const glyphColor = checkboxIndicatorColor(theme, resolvedTone, isDisabled);

  const a11yChecked: boolean | 'mixed' =
    checked === 'indeterminate' ? 'mixed' : Boolean(checked);
  const stateProps = a11yState({
    ...accessibilityState,
    checked: a11yChecked,
    disabled: isDisabled,
  });

  const hitSlop = minTouchHitSlop(box.width);

  const toggle = useCallback((): void => {
    if (isDisabled) return;
    const next: CheckedState =
      checked === 'indeterminate' ? true : !checked;
    setUncontrolled(next);
    onCheckedChange?.(next);
  }, [checked, isDisabled, onCheckedChange, setUncontrolled]);
  useFieldControlRegistration(toggle);

  return (
    <Pressable
      ref={ref}
      {...rest}
      {...stateProps}
      accessibilityRole="checkbox"
      accessibilityLabel={fieldProps.accessibilityLabel}
      accessibilityHint={fieldProps.accessibilityHint}
      accessibilityLabelledBy={fieldProps.accessibilityLabelledBy}
      nativeID={fieldProps.nativeID}
      disabled={isDisabled}
      hitSlop={hitSlop}
      focusRing={isInvalid ? 'danger' : resolved.tone}
      onPress={toggle}
      style={[row, style]}
      {...rnwAttrs({
        'aria-describedby': fieldProps['aria-describedby'],
        'aria-invalid': fieldProps['aria-invalid'],
        'aria-required': fieldProps['aria-required'],
        'data-invalid': isInvalid ? 'true' : undefined,
        'data-state':
          checked === 'indeterminate'
            ? 'indeterminate'
            : checked
              ? 'checked'
              : 'unchecked',
      }, rest)}
    >
      <View style={box}>
        {checked === true ? <CheckGlyph color={glyphColor} size={box.width} /> : null}
        {checked === 'indeterminate' ? (
          <DashGlyph color={glyphColor} size={box.width} />
        ) : null}
      </View>
      {typeof children === 'string' || typeof children === 'number' ? (
        <Text role="label">{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
