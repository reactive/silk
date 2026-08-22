import {
  Children,
  useCallback,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  type JSX,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { View, type ViewProps } from 'react-native';
import { spaceScale } from '../styles/mappers/shared.js';
import { useTheme } from '../theme/ThemeProvider.js';
import { Text } from './Text.js';

export type FieldMode = 'single' | 'group';
export type FieldOrientation = 'vertical' | 'horizontal';
export type FieldLabelAssociation = 'htmlFor' | 'labelledby';
export type AriaInvalid = boolean | 'true' | 'false' | 'grammar' | 'spelling';

/**
 * Mark a control so Field.Root uses labelledby association (no htmlFor/nativeID
 * auto-wiring). Same symbol as web for cross-package recognition.
 */
export const fieldLabelAssociation: unique symbol = Symbol.for(
  'silk.fieldLabelAssociation',
);

export interface FieldContextValue {
  readonly mode: FieldMode;
  readonly inputId: string;
  readonly labelId: string;
  readonly labelledBy: string | undefined;
  readonly labelAssociation: FieldLabelAssociation;
  readonly descriptionId: string;
  readonly errorId: string;
  readonly describedBy: string | undefined;
  /** Flattened label text for iOS accessibilityLabel fallback. */
  readonly labelText: string | undefined;
  /** Flattened description + error for accessibilityHint. */
  readonly hintText: string | undefined;
  readonly invalid: boolean;
  readonly disabled: boolean;
  readonly required: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);
type FieldActivationContextValue = {
  readonly registerControl: (activate: () => void) => () => void;
  readonly activateControl: () => void;
};
const FieldActivationContext =
  createContext<FieldActivationContextValue | null>(null);

export function useFieldContext(): FieldContextValue | null {
  return useContext(FieldContext);
}

export interface FieldRootProps extends Omit<ViewProps, 'children'> {
  readonly mode?: FieldMode;
  readonly orientation?: FieldOrientation;
  readonly controlId?: string;
  readonly invalid?: boolean;
  readonly disabled?: boolean;
  readonly required?: boolean;
  readonly ref?: Ref<View>;
  readonly children?: ReactNode;
}

type FieldSlot =
  | typeof FieldLabel
  | typeof FieldDescription
  | typeof FieldError;

function isElementOfType(
  child: ReactNode,
  type: FieldSlot,
): child is ReactElement<{
  nativeID?: string;
  id?: string;
  children?: ReactNode;
}> {
  return isValidElement(child) && child.type === type;
}

/** Slot views use nativeID; id is accepted for RNW/web interop. */
function slotNativeId(
  props: { nativeID?: string; id?: string },
  fallback: string,
): string {
  return props.nativeID ?? props.id ?? fallback;
}

function isLabelledByControl(type: unknown): boolean {
  return (
    (typeof type === 'function' ||
      (typeof type === 'object' && type !== null)) &&
    fieldLabelAssociation in type &&
    (type as Record<symbol, unknown>)[fieldLabelAssociation] === 'labelledby'
  );
}

function flattenText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(flattenText).join('');
  if (isValidElement(node)) {
    return flattenText(
      (node.props as { children?: ReactNode }).children,
    );
  }
  return '';
}

function isFieldSlotElement(child: ReactNode): boolean {
  return (
    isElementOfType(child, FieldLabel) ||
    isElementOfType(child, FieldDescription) ||
    isElementOfType(child, FieldError)
  );
}

/**
 * True when `node` is (or wraps) a Field slot. Nested Field.Root is opaque so
 * inner slots stay with the inner field — same boundary as aria wiring.
 */
function containsFieldSlot(node: ReactNode): boolean {
  let found = false;
  const walk = (nodes: ReactNode): void => {
    Children.forEach(nodes, (child) => {
      if (found || !isValidElement(child)) return;
      if (child.type === FieldRoot) return;
      if (isFieldSlotElement(child)) {
        found = true;
        return;
      }
      walk((child.props as { children?: ReactNode }).children);
    });
  };
  walk(node);
  return found;
}

/**
 * Split horizontal Field children into a leading control column and a text
 * column (label + description + error). Mirrors web’s grid placement so
 * supporting copy sits under the label, not inline with the control.
 */
function partitionHorizontalChildren(children: ReactNode): {
  control: ReactNode[];
  labelColumn: ReactNode[];
} {
  const control: ReactNode[] = [];
  const labelColumn: ReactNode[] = [];
  Children.forEach(children, (child) => {
    if (child == null || typeof child === 'boolean') return;
    if (isFieldSlotElement(child) || containsFieldSlot(child)) {
      labelColumn.push(child);
    } else {
      control.push(child);
    }
  });
  return { control, labelColumn };
}

function ariaFromFieldChildren(
  children: ReactNode,
  mode: FieldMode,
  labelId: string,
  descriptionId: string,
  errorId: string,
): {
  labelledBy: string | undefined;
  describedBy: string | undefined;
  labelAssociation: FieldLabelAssociation;
  labelText: string | undefined;
  hintText: string | undefined;
} {
  let labelledBy: string | undefined;
  let labelText: string | undefined;
  let labelAssociation: FieldLabelAssociation =
    mode === 'group' ? 'labelledby' : 'htmlFor';
  const describedParts: string[] = [];
  const hintParts: string[] = [];

  const walk = (nodes: ReactNode): void => {
    Children.forEach(nodes, (child) => {
      if (!isValidElement(child)) return;
      if (child.type === FieldRoot) return;
      if (isElementOfType(child, FieldLabel)) {
        labelledBy ??= slotNativeId(child.props, labelId);
        labelText ??= flattenText(child.props.children) || undefined;
        return;
      }
      if (isElementOfType(child, FieldDescription)) {
        describedParts.push(slotNativeId(child.props, descriptionId));
        const text = flattenText(child.props.children);
        if (text) hintParts.push(text);
        return;
      }
      if (isElementOfType(child, FieldError)) {
        describedParts.push(slotNativeId(child.props, errorId));
        const text = flattenText(child.props.children);
        if (text) hintParts.push(text);
        return;
      }
      if (labelAssociation === 'htmlFor' && isLabelledByControl(child.type)) {
        labelAssociation = 'labelledby';
      }
      walk((child.props as { children?: ReactNode }).children);
    });
  };

  walk(children);
  return {
    labelledBy,
    describedBy:
      describedParts.length > 0 ? describedParts.join(' ') : undefined,
    labelAssociation,
    labelText,
    hintText: hintParts.length > 0 ? hintParts.join('. ') : undefined,
  };
}

function FieldRoot({
  mode = 'single',
  orientation = 'vertical',
  controlId,
  invalid = false,
  disabled = false,
  required = false,
  children,
  style,
  ref,
  ...props
}: FieldRootProps): JSX.Element {
  const reactId = useId();
  const inputId = controlId ?? `${reactId}-control`;
  const labelId = `${reactId}-label`;
  const descriptionId = `${reactId}-description`;
  const errorId = `${reactId}-error`;
  const { theme, density } = useTheme();
  const space = spaceScale(theme, density);
  const controlAction = useRef<(() => void) | null>(null);
  const registerControl = useCallback((activate: () => void) => {
    controlAction.current = activate;
    return () => {
      if (controlAction.current === activate) {
        controlAction.current = null;
      }
    };
  }, []);
  const activateControl = useCallback(() => {
    controlAction.current?.();
  }, []);
  const activation = useMemo<FieldActivationContextValue>(
    () => ({ registerControl, activateControl }),
    [registerControl, activateControl],
  );

  const {
    labelledBy,
    describedBy,
    labelAssociation,
    labelText,
    hintText,
  } = useMemo(
    () =>
      ariaFromFieldChildren(
        children,
        mode,
        labelId,
        descriptionId,
        errorId,
      ),
    [children, mode, labelId, descriptionId, errorId],
  );

  const value = useMemo<FieldContextValue>(
    () => ({
      mode,
      inputId,
      labelId,
      labelledBy,
      labelAssociation,
      descriptionId,
      errorId,
      describedBy,
      labelText,
      hintText,
      invalid,
      disabled,
      required,
    }),
    [
      mode,
      inputId,
      labelId,
      labelledBy,
      labelAssociation,
      descriptionId,
      errorId,
      describedBy,
      labelText,
      hintText,
      invalid,
      disabled,
      required,
    ],
  );

  const rootDataProps = {
    'data-invalid': invalid ? 'true' : undefined,
    'data-disabled': disabled ? 'true' : undefined,
    'data-mode': mode,
    'data-orientation': orientation,
    'data-field-root': '',
  } as object;

  if (orientation === 'horizontal') {
    const { control, labelColumn } = partitionHorizontalChildren(children);
    return (
      <FieldContext.Provider value={value}>
        <FieldActivationContext.Provider value={activation}>
          <View
            ref={ref}
            {...props}
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: space[2],
                opacity: disabled ? 0.7 : 1,
              },
              style,
            ]}
            {...rootDataProps}
          >
            {control.length > 0 ? <View>{control}</View> : null}
            {labelColumn.length > 0 ? (
              <View
                style={{
                  flexGrow: 1,
                  flexShrink: 1,
                  minWidth: 0,
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  gap: space[1],
                }}
              >
                {labelColumn}
              </View>
            ) : null}
          </View>
        </FieldActivationContext.Provider>
      </FieldContext.Provider>
    );
  }

  return (
    <FieldContext.Provider value={value}>
      <FieldActivationContext.Provider value={activation}>
        <View
          ref={ref}
          {...props}
          style={[
            {
              flexDirection: 'column',
              alignItems: 'stretch',
              gap: space[1],
              opacity: disabled ? 0.7 : 1,
            },
            style,
          ]}
          {...rootDataProps}
        >
          {children}
        </View>
      </FieldActivationContext.Provider>
    </FieldContext.Provider>
  );
}

export interface FieldLabelProps
  extends Omit<React.ComponentProps<typeof Text>, 'role' | 'tone'> {
  readonly children?: ReactNode;
}

function FieldLabel({
  children,
  style,
  nativeID,
  onPress,
  ...props
}: FieldLabelProps): JSX.Element {
  const field = useFieldContext();
  const activation = useContext(FieldActivationContext);
  return (
    <Text
      {...props}
      role="label"
      tone={field?.disabled ? 'secondary' : 'primary'}
      nativeID={nativeID ?? field?.labelId}
      onPress={
        onPress || activation
          ? (event) => {
              onPress?.(event);
              if (!event.isDefaultPrevented()) {
                activation?.activateControl();
              }
            }
          : undefined
      }
      style={style}
      {...({ 'data-field-label': '' } as object)}
    >
      {children}
      {field?.required ? (
        <Text role="label" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {' *'}
        </Text>
      ) : null}
    </Text>
  );
}

export interface FieldDescriptionProps
  extends Omit<React.ComponentProps<typeof Text>, 'role' | 'tone'> {
  readonly children?: ReactNode;
}

function FieldDescription({
  children,
  nativeID,
  style,
  ...props
}: FieldDescriptionProps): JSX.Element {
  const field = useFieldContext();
  return (
    <Text
      {...props}
      role="caption"
      tone="secondary"
      nativeID={nativeID ?? field?.descriptionId}
      style={style}
      {...({ 'data-field-description': '' } as object)}
    >
      {children}
    </Text>
  );
}

export interface FieldErrorProps
  extends Omit<React.ComponentProps<typeof Text>, 'role' | 'tone'> {
  readonly children?: ReactNode;
}

function FieldError({
  children,
  nativeID,
  style,
  accessibilityRole = 'alert',
  ...props
}: FieldErrorProps): JSX.Element {
  const field = useFieldContext();
  return (
    <Text
      {...props}
      role="caption"
      tone="danger"
      nativeID={nativeID ?? field?.errorId}
      accessibilityRole={accessibilityRole}
      // Android-only live region enhancement — not an iOS status solution.
      accessibilityLiveRegion="polite"
      style={style}
      {...({ 'data-field-error': '' } as object)}
    >
      {children}
    </Text>
  );
}

export type FieldControlProps = {
  nativeID?: string | undefined;
  /** RN allows string | string[]; we normalize arrays to a space-joined string. */
  accessibilityLabelledBy?: string | undefined;
  accessibilityLabel?: string | undefined;
  accessibilityHint?: string | undefined;
  accessibilityState?:
    | { disabled?: boolean; checked?: boolean | 'mixed' }
    | undefined;
  disabled?: boolean | undefined;
  required?: boolean | undefined;
  /** Visual invalid flag for control chrome. */
  invalid?: boolean | undefined;
  /** RNW / ARIA aliases for Field wiring. */
  'aria-describedby'?: string | undefined;
  'aria-invalid'?: AriaInvalid | undefined;
  'aria-required'?: boolean | undefined;
};

function isVisuallyInvalid(value: AriaInvalid | undefined): boolean {
  return (
    value === true ||
    value === 'true' ||
    value === 'grammar' ||
    value === 'spelling'
  );
}

/**
 * Merge Field context into a control. Explicit props always win.
 * Prefer `Field.Root controlId` over overriding `nativeID` so Label and
 * control stay in sync.
 */
function normalizeLabelledBy(
  value: string | readonly string[] | undefined,
): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'string') return value;
  return value.join(' ');
}

export function useFieldControlProps(options?: {
  readonly nativeID?: string | undefined;
  readonly id?: string | undefined;
  readonly accessibilityLabel?: string | undefined;
  readonly accessibilityHint?: string | undefined;
  readonly accessibilityLabelledBy?: string | readonly string[] | undefined;
  readonly 'aria-describedby'?: string | undefined;
  readonly 'aria-invalid'?: AriaInvalid | undefined;
  readonly disabled?: boolean | undefined;
  readonly required?: boolean | undefined;
  readonly labelledBy?: boolean | undefined;
}): FieldControlProps {
  const field = useContext(FieldContext);

  if (!field) {
    const result: FieldControlProps = {};
    const id = options?.nativeID ?? options?.id;
    if (id !== undefined) result.nativeID = id;
    if (options?.accessibilityLabel !== undefined) {
      result.accessibilityLabel = options.accessibilityLabel;
    }
    if (options?.accessibilityHint !== undefined) {
      result.accessibilityHint = options.accessibilityHint;
    }
    const labelledBy = normalizeLabelledBy(options?.accessibilityLabelledBy);
    if (labelledBy !== undefined) {
      result.accessibilityLabelledBy = labelledBy;
    }
    if (options?.['aria-describedby'] !== undefined) {
      result['aria-describedby'] = options['aria-describedby'];
    }
    if (options?.disabled !== undefined) result.disabled = options.disabled;
    if (options?.required !== undefined) {
      result.required = options.required;
      if (options.required) result['aria-required'] = true;
    }
    if (options?.['aria-invalid'] !== undefined) {
      result['aria-invalid'] = options['aria-invalid'];
      if (isVisuallyInvalid(options['aria-invalid'])) {
        result.invalid = true;
      }
    }
    return result;
  }

  const invalidValue: AriaInvalid | undefined =
    options?.['aria-invalid'] !== undefined
      ? options['aria-invalid']
      : field.invalid
        ? true
        : undefined;
  const invalidFlag = isVisuallyInvalid(invalidValue);
  const required = options?.required ?? field.required;

  const result: FieldControlProps = {
    disabled: options?.disabled ?? field.disabled,
    required,
    ...(invalidValue !== undefined ? { 'aria-invalid': invalidValue } : {}),
    ...(invalidFlag ? { invalid: true } : {}),
    ...(required ? { 'aria-required': true } : {}),
  };

  const useLabelledBy =
    field.mode === 'group' ||
    field.labelAssociation === 'labelledby' ||
    options?.labelledBy === true;

  if (field.mode === 'single' && !useLabelledBy) {
    result.nativeID = options?.nativeID ?? options?.id ?? field.inputId;
  } else if (options?.nativeID !== undefined || options?.id !== undefined) {
    result.nativeID = options.nativeID ?? options.id;
  }

  // Explicit labelledBy always wins (including outside useLabelledBy mode).
  const explicitLabelledBy = normalizeLabelledBy(
    options?.accessibilityLabelledBy,
  );
  if (explicitLabelledBy !== undefined) {
    result.accessibilityLabelledBy = explicitLabelledBy;
  } else if (useLabelledBy && field.labelledBy !== undefined) {
    result.accessibilityLabelledBy = field.labelledBy;
  }

  const describedBy = options?.['aria-describedby'] ?? field.describedBy;
  if (describedBy !== undefined) {
    result['aria-describedby'] = describedBy;
  }

  // Cross-platform name/hint fallback (accessibilityLabelledBy is Android-only).
  if (options?.accessibilityLabel !== undefined) {
    result.accessibilityLabel = options.accessibilityLabel;
  } else if (field.labelText !== undefined) {
    result.accessibilityLabel = field.labelText;
  }
  if (options?.accessibilityHint !== undefined) {
    result.accessibilityHint = options.accessibilityHint;
  } else if (field.hintText !== undefined) {
    result.accessibilityHint = field.hintText;
  }

  if (result.disabled) {
    result.accessibilityState = { disabled: true };
  }

  return result;
}

/** Register a native control action for Field.Label press activation. */
export function useFieldControlRegistration(
  activate: (() => void) | undefined,
): void {
  const registerControl = useContext(FieldActivationContext)?.registerControl;
  useEffect(() => {
    if (!registerControl || !activate) return;
    return registerControl(activate);
  }, [registerControl, activate]);
}

export interface FieldNamespace {
  readonly Root: typeof FieldRoot;
  readonly Label: typeof FieldLabel;
  readonly Description: typeof FieldDescription;
  readonly Error: typeof FieldError;
}

export const Field: FieldNamespace = {
  Root: FieldRoot,
  Label: FieldLabel,
  Description: FieldDescription,
  Error: FieldError,
};
