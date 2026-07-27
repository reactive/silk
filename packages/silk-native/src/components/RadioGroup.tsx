import {
  radioGroupRecipe,
  type RadioGroupVariantProps,
} from '@reactive/silk-core';
import {
  createContext,
  useContext,
  useState,
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
import { a11yState } from '../styles/a11yProps.js';
import { mapRadioGroupStyle, mapRadioItemStyle } from '../styles/mapStyles.js';
import { useComponentDefaults } from '../theme/SilkProvider.js';
import { useTheme } from '../theme/ThemeProvider.js';
import { useFieldControlProps } from './Field.js';
import { Text } from './Text.js';

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
  ...rest
}: RadioGroupRootProps): JSX.Element {
  const { theme, density } = useTheme();
  const defaults = useComponentDefaults('RadioGroup');
  const resolved: RadioGroupVariantProps = {
    size: size ?? defaults.size ?? radioGroupRecipe.defaults.size,
    tone: tone ?? defaults.tone ?? radioGroupRecipe.defaults.tone,
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
  });
  const isDisabled = Boolean(fieldProps.disabled);
  const isInvalid = Boolean(fieldProps.invalid || invalid);
  const isControlled = valueProp !== undefined;
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const value = isControlled ? valueProp : uncontrolled;

  const { root } = mapRadioGroupStyle(theme, resolved, density);

  const ctx: RadioGroupContextValue = {
    value,
    onValueChange: (next) => {
      if (isDisabled) return;
      if (!isControlled) setUncontrolled(next);
      onValueChange?.(next);
    },
    disabled: isDisabled,
    invalid: isInvalid,
    size: resolved.size ?? radioGroupRecipe.defaults.size,
    tone: resolved.tone ?? radioGroupRecipe.defaults.tone,
    density,
  };

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
        {...({
          'aria-invalid': fieldProps['aria-invalid'],
          'aria-required': fieldProps['aria-required'],
          'data-invalid': isInvalid ? 'true' : undefined,
          'data-orientation': resolved.orientation,
        } as object)}
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
  const { item, indicator } = mapRadioItemStyle(
    theme,
    { size: group.size, tone: group.tone },
    group.density,
    { checked, invalid: group.invalid, disabled: isDisabled },
  );
  const edge = typeof item.width === 'number' ? item.width : 20;
  const hitSlop = Math.max(0, Math.ceil((44 - edge) / 2));
  const stateProps = a11yState({ checked, disabled: isDisabled });

  const content = (
    <>
      <View style={item}>
        {checked ? <View style={indicator} /> : null}
      </View>
      {children !== undefined && children !== null ? (
        typeof children === 'string' || typeof children === 'number' ? (
          <Text role="label">{children}</Text>
        ) : (
          children
        )
      ) : null}
    </>
  );

  return (
    <Pressable
      ref={ref}
      {...rest}
      {...stateProps}
      accessibilityRole="radio"
      disabled={isDisabled}
      hitSlop={hitSlop}
      onPress={() => group.onValueChange(value)}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.semantic.space[2],
        },
        style,
      ]}
      {...({
        'data-state': checked ? 'checked' : 'unchecked',
      } as object)}
    >
      {content}
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
