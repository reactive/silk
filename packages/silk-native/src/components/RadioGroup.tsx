import {
  radioGroupRecipe,
  type RadioGroupVariantProps,
} from '@reactive/silk-core';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type JSX,
  type ReactNode,
  type Ref,
} from 'react';
import {
  Pressable,
  View,
  type PressableProps,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { a11yState, rnwAttrs } from '../styles/a11yProps.js';
import { minTouchHitSlop } from '../styles/controlGeometry.js';
import {
  mapRadioGroupStyle,
  mapRadioItemStyle,
} from '../styles/mappers/controls.js';
import { useComponentDefaults } from '../theme/SilkProvider.js';
import { useTheme } from '../theme/ThemeProvider.js';
import { useFieldControlProps } from './Field.js';
import { Text } from './Text.js';
import { useControllableValue } from './useControllableValue.js';

interface RadioGroupContextValue {
  readonly value: string | undefined;
  readonly onValueChange: (value: string) => void;
  readonly disabled: boolean;
  readonly invalid: boolean;
  readonly size: NonNullable<RadioGroupVariantProps['size']>;
  readonly tone: NonNullable<RadioGroupVariantProps['tone']>;
  readonly density: 'comfortable' | 'compact';
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export interface RadioGroupRootProps
  extends RadioGroupVariantProps, Omit<ViewProps, 'children' | 'style'> {
  readonly ref?: Ref<View>;
  readonly children?: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onValueChange?: (value: string) => void;
  readonly disabled?: boolean;
  readonly invalid?: boolean;
  readonly required?: boolean;
  readonly 'aria-describedby'?: string;
}

function RadioGroupRoot({
  size,
  tone,
  orientation,
  value: valueProp,
  defaultValue,
  onValueChange,
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
  'aria-describedby': ariaDescribedBy,
  ...rest
}: RadioGroupRootProps): JSX.Element {
  const { theme, density } = useTheme();
  const defaults = useComponentDefaults('RadioGroup');
  const resolvedSize = size ?? defaults.size ?? radioGroupRecipe.defaults.size;
  const resolvedTone = tone ?? defaults.tone ?? radioGroupRecipe.defaults.tone;
  const resolved: RadioGroupVariantProps = {
    size: resolvedSize,
    tone: resolvedTone,
    orientation:
      orientation ??
      defaults.orientation ??
      radioGroupRecipe.defaults.orientation,
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
  const [value, setUncontrolled] = useControllableValue<
    string | undefined
  >(valueProp, defaultValue);

  const { root } = mapRadioGroupStyle(theme, resolved, density);
  const handleValueChange = useCallback(
    (next: string) => {
      if (isDisabled) return;
      // Match web/Radix: only emit when the selection actually changes.
      if (next === value) return;
      setUncontrolled(next);
      onValueChange?.(next);
    },
    [isDisabled, value, setUncontrolled, onValueChange],
  );
  const ctx = useMemo<RadioGroupContextValue>(
    () => ({
      value,
      onValueChange: handleValueChange,
      disabled: isDisabled,
      invalid: isInvalid,
      size: resolvedSize,
      tone: resolvedTone,
      density,
    }),
    [
      value,
      handleValueChange,
      isDisabled,
      isInvalid,
      resolvedSize,
      resolvedTone,
      density,
    ],
  );

  return (
    <RadioGroupContext.Provider value={ctx}>
      <View
        ref={ref}
        {...rest}
        accessibilityRole="radiogroup"
        accessibilityLabel={fieldProps.accessibilityLabel}
        accessibilityHint={fieldProps.accessibilityHint}
        accessibilityLabelledBy={fieldProps.accessibilityLabelledBy}
        nativeID={fieldProps.nativeID}
        style={[root, style]}
        {...rnwAttrs({
          'aria-describedby': fieldProps['aria-describedby'],
          'aria-invalid': fieldProps['aria-invalid'],
          'aria-required': fieldProps['aria-required'],
          'data-invalid': isInvalid ? 'true' : undefined,
          'data-orientation': resolved.orientation,
        })}
      >
        {children}
      </View>
    </RadioGroupContext.Provider>
  );
}

export interface RadioGroupItemProps
  extends Omit<PressableProps, 'children' | 'style' | 'onPress'> {
  readonly ref?: Ref<View>;
  readonly value: string;
  readonly children?: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
  readonly disabled?: boolean;
}

function RadioGroupItem({
  value,
  children,
  style,
  disabled,
  ref,
  ...rest
}: RadioGroupItemProps): JSX.Element {
  const group = useContext(RadioGroupContext);
  if (!group) {
    throw new Error('RadioGroup.Item must be used within RadioGroup.Root');
  }
  const { theme } = useTheme();
  const isDisabled = Boolean(disabled || group.disabled);
  const checked = group.value === value;
  const { row, item, indicator } = mapRadioItemStyle(
    theme,
    { size: group.size, tone: group.tone },
    group.density,
    { checked, invalid: group.invalid, disabled: isDisabled },
  );
  const stateProps = a11yState({ checked, disabled: isDisabled });

  return (
    <Pressable
      ref={ref}
      {...rest}
      {...stateProps}
      accessibilityRole="radio"
      disabled={isDisabled}
      hitSlop={minTouchHitSlop(item.width)}
      onPress={() => group.onValueChange(value)}
      style={[row, style]}
      {...rnwAttrs({
        'data-state': checked ? 'checked' : 'unchecked',
      })}
    >
      <View style={item}>
        {checked ? <View style={indicator} /> : null}
      </View>
      {typeof children === 'string' || typeof children === 'number' ? (
        <Text role="label">{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

export interface RadioGroupNamespace {
  readonly Root: typeof RadioGroupRoot;
  readonly Item: typeof RadioGroupItem;
}

export const RadioGroup: RadioGroupNamespace = {
  Root: RadioGroupRoot,
  Item: RadioGroupItem,
};
