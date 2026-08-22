import {
  useCallback,
  useRef,
  useState,
  type Ref,
} from 'react';
import type { TextInput, TextInputProps } from 'react-native';
import {
  a11yState,
  type A11yStateProps,
} from '../styles/a11yProps.js';
import {
  useFieldControlProps,
  useFieldControlRegistration,
  type AriaInvalid,
  type FieldControlProps,
} from './Field.js';

type TextControlOptions = {
  readonly nativeID?: string | undefined;
  readonly ref?: Ref<TextInput> | undefined;
  readonly accessibilityLabel?: string | undefined;
  readonly accessibilityHint?: string | undefined;
  readonly accessibilityLabelledBy?: string | readonly string[] | undefined;
  readonly accessibilityState?: TextInputProps['accessibilityState'];
  readonly ariaDescribedBy?: string | undefined;
  readonly ariaInvalid?: AriaInvalid | undefined;
  readonly disabled?: boolean | undefined;
  readonly invalid?: boolean | undefined;
  readonly required?: boolean | undefined;
  readonly onFocus?: TextInputProps['onFocus'];
  readonly onBlur?: TextInputProps['onBlur'];
};

type TextControlResult = {
  readonly fieldProps: FieldControlProps;
  readonly stateProps: A11yStateProps;
  readonly focused: boolean;
  readonly disabled: boolean;
  readonly invalid: boolean;
  readonly ref: (instance: TextInput | null) => void;
  readonly onFocus: NonNullable<TextInputProps['onFocus']>;
  readonly onBlur: NonNullable<TextInputProps['onBlur']>;
};

/** Shared Field, accessibility, and focus plumbing for Input and Textarea. */
export function useTextControl(
  options: TextControlOptions,
): TextControlResult {
  const fieldProps = useFieldControlProps({
    nativeID: options.nativeID,
    accessibilityLabel: options.accessibilityLabel,
    accessibilityHint: options.accessibilityHint,
    accessibilityLabelledBy: options.accessibilityLabelledBy,
    'aria-describedby': options.ariaDescribedBy,
    'aria-invalid': options.ariaInvalid ?? options.invalid,
    disabled: options.disabled,
    required: options.required,
  });
  const [focused, setFocused] = useState(false);
  const disabled = Boolean(fieldProps.disabled);
  const controlRef = useRef<TextInput | null>(null);
  const setRef = useCallback(
    (instance: TextInput | null) => {
      controlRef.current = instance;
      if (typeof options.ref === 'function') {
        options.ref(instance);
      } else if (options.ref) {
        options.ref.current = instance;
      }
    },
    [options.ref],
  );
  const focus = useCallback(() => {
    if (!disabled) {
      controlRef.current?.focus();
    }
  }, [disabled]);
  useFieldControlRegistration(focus);
  const invalid = Boolean(fieldProps.invalid);
  const stateProps = a11yState({
    ...options.accessibilityState,
    disabled,
  });

  return {
    fieldProps,
    stateProps,
    focused,
    disabled,
    invalid,
    ref: setRef,
    onFocus: ((event) => {
      setFocused(true);
      options.onFocus?.(event);
    }) satisfies NonNullable<TextInputProps['onFocus']>,
    onBlur: ((event) => {
      setFocused(false);
      options.onBlur?.(event);
    }) satisfies NonNullable<TextInputProps['onBlur']>,
  };
}
