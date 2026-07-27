import {
  checkboxRecipe,
  type CheckboxVariantProps,
} from '@reactive/silk-core';
import { useState, type JSX, type ReactNode, type Ref } from 'react';
import {
  Pressable,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { a11yState } from '../styles/a11yProps.js';
import {
  checkboxIndicatorColor,
  mapCheckboxStyle,
} from '../styles/mapStyles.js';
import { useComponentDefaults } from '../theme/SilkProvider.js';
import { useTheme } from '../theme/ThemeProvider.js';
import { useFieldControlProps } from './Field.js';
import { Text } from './Text.js';

export type CheckedState = boolean | 'indeterminate';

export interface CheckboxProps
  extends CheckboxVariantProps,
    Omit<PressableProps, 'children' | 'style' | 'onPress'> {
  readonly ref?: Ref<View>;
  readonly children?: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
  /** Controlled — matches web/Radix tri-state. */
  readonly checked?: CheckedState;
  readonly defaultChecked?: boolean;
  readonly onCheckedChange?: (checked: CheckedState) => void;
  readonly disabled?: boolean;
  readonly invalid?: boolean;
  readonly required?: boolean;
}

function CheckGlyph({ color, size }: { color: string; size: number }): JSX.Element {
  const thickness = Math.max(2, size * 0.12);
  return (
    <View
      style={{
        width: size * 0.55,
        height: size * 0.35,
        borderBottomWidth: thickness,
        borderLeftWidth: thickness,
        borderColor: color,
        transform: [{ rotate: '-45deg' }, { translateY: -size * 0.05 }],
      }}
    />
  );
}

function DashGlyph({ color, size }: { color: string; size: number }): JSX.Element {
  return (
    <View
      style={{
        width: size * 0.55,
        height: Math.max(2, size * 0.12),
        backgroundColor: color,
        borderRadius: 1,
      }}
    />
  );
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
  ...rest
}: CheckboxProps): JSX.Element {
  const { theme, density } = useTheme();
  const defaults = useComponentDefaults('Checkbox');
  const resolved: CheckboxVariantProps = {
    size: size ?? defaults.size ?? checkboxRecipe.defaults.size,
    tone: tone ?? defaults.tone ?? checkboxRecipe.defaults.tone,
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
  const [uncontrolled, setUncontrolled] = useState<CheckedState>(defaultChecked);
  const checked = isControlled ? checkedProp : uncontrolled;

  const { row, box } = mapCheckboxStyle(theme, resolved, density, {
    checked,
    invalid: isInvalid,
    disabled: isDisabled,
  });
  const edge = typeof box.width === 'number' ? box.width : 20;
  const glyphColor = checkboxIndicatorColor(
    theme,
    resolved.tone ?? checkboxRecipe.defaults.tone,
    isDisabled,
  );

  const a11yChecked: boolean | 'mixed' =
    checked === 'indeterminate' ? 'mixed' : Boolean(checked);
  const stateProps = a11yState({
    ...accessibilityState,
    checked: a11yChecked,
    disabled: isDisabled,
  });

  const hitSlop = Math.max(0, Math.ceil((44 - edge) / 2));

  const toggle = (): void => {
    if (isDisabled) return;
    const next: CheckedState =
      checked === 'indeterminate' ? true : !checked;
    if (!isControlled) setUncontrolled(next);
    onCheckedChange?.(next);
  };

  return (
    <Pressable
      ref={ref}
      {...rest}
      {...stateProps}
      accessibilityRole="checkbox"
      accessibilityLabel={fieldProps.accessibilityLabel ?? accessibilityLabel}
      accessibilityHint={fieldProps.accessibilityHint ?? accessibilityHint}
      accessibilityLabelledBy={fieldProps.accessibilityLabelledBy}
      nativeID={fieldProps.nativeID}
      disabled={isDisabled}
      hitSlop={hitSlop}
      onPress={toggle}
      style={[row, style]}
      {...({
        'aria-invalid': fieldProps['aria-invalid'],
        'aria-required': fieldProps['aria-required'],
        'data-invalid': isInvalid ? 'true' : undefined,
        'data-state':
          checked === 'indeterminate'
            ? 'indeterminate'
            : checked
              ? 'checked'
              : 'unchecked',
      } as object)}
    >
      <View style={box}>
        {checked === true ? <CheckGlyph color={glyphColor} size={edge} /> : null}
        {checked === 'indeterminate' ? (
          <DashGlyph color={glyphColor} size={edge} />
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
