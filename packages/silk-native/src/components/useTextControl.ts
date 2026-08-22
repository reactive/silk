import {
  useCallback,
  useRef,
  useState,
  type Ref,
} from 'react';
import type { TextInput, TextInputProps } from 'react-native';
import { a11yState, rnwAttrs } from '../styles/a11yProps.js';
import {
  useFieldControlProps,
  useFieldControlRegistration,
  type AriaInvalid,
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

type TextControlHostProps = TextInputProps & {
  readonly ref: (instance: TextInput | null) => void;
};

type TextControlResult = {
  readonly focused: boolean;
  readonly disabled: boolean;
  readonly invalid: boolean;
  readonly inputProps: TextControlHostProps;
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
  const invalid = Boolean(fieldProps.invalid);
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
  const stateProps = a11yState({
    ...options.accessibilityState,
    disabled,
  });

  return {
    focused,
    disabled,
    invalid,
    inputProps: {
      ref: setRef,
      ...stateProps,
      nativeID: fieldProps.nativeID,
      accessibilityLabel: fieldProps.accessibilityLabel,
      accessibilityHint: fieldProps.accessibilityHint,
      accessibilityLabelledBy: fieldProps.accessibilityLabelledBy,
      editable: !disabled,
      onFocus: (event) => {
        setFocused(true);
        options.onFocus?.(event);
      },
      onBlur: (event) => {
        setFocused(false);
        options.onBlur?.(event);
      },
      ...rnwAttrs({
        'aria-describedby': fieldProps['aria-describedby'],
        'aria-invalid': fieldProps['aria-invalid'],
        'aria-required': fieldProps['aria-required'],
        'data-invalid': invalid ? 'true' : undefined,
        'data-disabled': disabled ? 'true' : undefined,
      }),
    } as TextControlHostProps,
  };
}
