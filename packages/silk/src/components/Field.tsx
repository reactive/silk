import { css, cx } from '@linaria/core';
import { Label as RadixLabel } from 'radix-ui';
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useId,
  useMemo,
  type AriaAttributes,
  type ComponentPropsWithoutRef,
  type JSX,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { typographyRoleCss } from '../theme/typographyCss';

export type FieldMode = 'single' | 'group';

export type AriaInvalid = NonNullable<AriaAttributes['aria-invalid']>;

/** Wiring a Field publishes to its label, description, error, and control. */
export interface FieldContextValue {
  readonly mode: FieldMode;
  readonly inputId: string;
  readonly labelId: string;
  /** Id of the rendered Field.Label, or undefined when the Field has none. */
  readonly labelledBy: string | undefined;
  readonly descriptionId: string;
  readonly errorId: string;
  readonly describedBy: string | undefined;
  readonly invalid: boolean;
  readonly disabled: boolean;
  readonly required: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

/**
 * Consume Field wiring. Returns null when used outside Field.Root (standalone no-op).
 */
export function useFieldContext(): FieldContextValue | null {
  return useContext(FieldContext);
}

export interface FieldRootProps extends ComponentPropsWithoutRef<'div'> {
  /**
   * `single` — control receives id + aria-describedby; Label uses htmlFor.
   * `group` — group receives aria-labelledby; Label is not htmlFor-associated.
   */
  readonly mode?: FieldMode;
  /**
   * Id for the labelled control, defaulting to a generated one. Set it here
   * rather than on the control so Label `htmlFor` and the control agree on the
   * server as well as after hydration.
   */
  readonly controlId?: string;
  readonly invalid?: boolean;
  readonly disabled?: boolean;
  readonly required?: boolean;
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
}

const rootClass: string = css`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--silk-space-1);
  box-sizing: border-box;
  margin: 0;
  min-width: 0;

  &:where([data-disabled='true']) {
    opacity: 0.7;
  }
`;

type FieldSlot = typeof FieldLabel | typeof FieldDescription | typeof FieldError;

function isElementOfType(
  child: ReactNode,
  type: FieldSlot,
): child is ReactElement<
  FieldLabelProps | FieldDescriptionProps | FieldErrorProps
> {
  return isValidElement(child) && child.type === type;
}

/** SSR-safe: build aria-describedby from direct Description/Error children. */
function describedByFromChildren(
  children: ReactNode,
  descriptionId: string,
  errorId: string,
): string | undefined {
  const parts: string[] = [];
  Children.forEach(children, (child) => {
    if (isElementOfType(child, FieldDescription)) {
      parts.push(child.props.id ?? descriptionId);
    }
    if (isElementOfType(child, FieldError)) {
      parts.push(child.props.id ?? errorId);
    }
  });
  return parts.length > 0 ? parts.join(' ') : undefined;
}

/**
 * SSR-safe: id of a direct Label child. Controls must not point
 * `aria-labelledby` at an id no element carries.
 */
function labelledByFromChildren(
  children: ReactNode,
  labelId: string,
): string | undefined {
  let found: string | undefined;
  Children.forEach(children, (child) => {
    if (found === undefined && isElementOfType(child, FieldLabel)) {
      found = child.props.id ?? labelId;
    }
  });
  return found;
}

function FieldRoot({
  className,
  mode = 'single',
  controlId,
  invalid = false,
  disabled = false,
  required = false,
  children,
  ...props
}: FieldRootProps): JSX.Element {
  const reactId = useId();
  const inputId = controlId ?? `${reactId}-control`;
  const labelId = `${reactId}-label`;
  const descriptionId = `${reactId}-description`;
  const errorId = `${reactId}-error`;

  const describedBy = useMemo(
    () => describedByFromChildren(children, descriptionId, errorId),
    [children, descriptionId, errorId],
  );
  const labelledBy = useMemo(
    () => labelledByFromChildren(children, labelId),
    [children, labelId],
  );

  const value = useMemo<FieldContextValue>(
    () => ({
      mode,
      inputId,
      labelId,
      labelledBy,
      descriptionId,
      errorId,
      describedBy,
      invalid,
      disabled,
      required,
    }),
    [
      mode,
      inputId,
      labelId,
      labelledBy,
      descriptionId,
      errorId,
      describedBy,
      invalid,
      disabled,
      required,
    ],
  );

  return (
    <FieldContext.Provider value={value}>
      <div
        {...props}
        className={cx(rootClass, className)}
        data-invalid={invalid ? 'true' : undefined}
        data-disabled={disabled ? 'true' : undefined}
        data-mode={mode}
      >
        {children}
      </div>
    </FieldContext.Provider>
  );
}

const labelClass: string = css`
  display: inline-flex;
  align-items: baseline;
  gap: var(--silk-space-1);
  margin: 0;
  ${typographyRoleCss('label')}
  color: var(--silk-color-text-primary);
  cursor: default;

  &:where([data-disabled='true']) {
    color: var(--silk-color-tone-neutral-disabled-fg);
    cursor: not-allowed;
  }
`;

export interface FieldLabelProps
  extends ComponentPropsWithoutRef<typeof RadixLabel.Root> {
  readonly ref?: Ref<HTMLLabelElement>;
  readonly children?: ReactNode;
}

function FieldLabel({
  className,
  children,
  ...props
}: FieldLabelProps): JSX.Element {
  const field = useFieldContext();
  const htmlFor =
    field?.mode === 'single'
      ? (props.htmlFor ?? field.inputId)
      : props.htmlFor;

  return (
    <RadixLabel.Root
      {...props}
      id={props.id ?? field?.labelId}
      htmlFor={htmlFor}
      className={cx(labelClass, className)}
      data-disabled={field?.disabled ? 'true' : undefined}
    >
      {children}
      {field?.required ? (
        <span aria-hidden="true" data-required-indicator="">
          *
        </span>
      ) : null}
    </RadixLabel.Root>
  );
}

const hintClass: string = css`
  margin: 0;
  ${typographyRoleCss('caption')}
  color: var(--silk-color-text-secondary);
`;

const errorClass: string = css`
  margin: 0;
  ${typographyRoleCss('caption')}
  color: var(--silk-color-tone-danger-text);
`;

export interface FieldDescriptionProps extends ComponentPropsWithoutRef<'p'> {
  readonly ref?: Ref<HTMLParagraphElement>;
  readonly children?: ReactNode;
}

function FieldDescription({
  className,
  ...props
}: FieldDescriptionProps): JSX.Element {
  const field = useFieldContext();
  return (
    <p
      {...props}
      id={props.id ?? field?.descriptionId}
      className={cx(hintClass, className)}
      data-field-description=""
    />
  );
}

export interface FieldErrorProps extends ComponentPropsWithoutRef<'p'> {
  readonly ref?: Ref<HTMLParagraphElement>;
  readonly children?: ReactNode;
}

function FieldError({ className, ...props }: FieldErrorProps): JSX.Element {
  const field = useFieldContext();
  return (
    <p
      {...props}
      id={props.id ?? field?.errorId}
      className={cx(errorClass, className)}
      data-field-error=""
      role="alert"
    />
  );
}

/**
 * Merge Field context into a single control's props.
 * Explicit id / aria-* / disabled on the control always win. Overriding `id`
 * here detaches the control from Label `htmlFor`; prefer `Field.Root controlId`,
 * which keeps both ends in sync.
 */
export type FieldControlProps = {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: AriaInvalid;
  'aria-labelledby'?: string;
  disabled?: boolean;
  required?: boolean;
  'data-invalid'?: 'true';
};

function isVisuallyInvalid(value: AriaInvalid | undefined): boolean {
  return (
    value === true ||
    value === 'true' ||
    value === 'grammar' ||
    value === 'spelling'
  );
}

export function useFieldControlProps(options?: {
  readonly id?: string | undefined;
  readonly 'aria-describedby'?: string | undefined;
  readonly 'aria-invalid'?: AriaInvalid | undefined;
  readonly 'aria-labelledby'?: string | undefined;
  readonly disabled?: boolean | undefined;
  readonly required?: boolean | undefined;
  /**
   * When true (or in `group` mode), wire `aria-labelledby` to the Field label.
   * Use for controls where `htmlFor` does not provide an accessible name
   * (e.g. `role="slider"`).
   */
  readonly labelledBy?: boolean | undefined;
}): FieldControlProps {
  const field = useContext(FieldContext);

  if (!field) {
    const result: FieldControlProps = {};
    if (options?.id !== undefined) result.id = options.id;
    if (options?.['aria-describedby'] !== undefined) {
      result['aria-describedby'] = options['aria-describedby'];
    }
    if (options?.['aria-invalid'] !== undefined) {
      result['aria-invalid'] = options['aria-invalid'];
      if (isVisuallyInvalid(options['aria-invalid'])) {
        result['data-invalid'] = 'true';
      }
    }
    if (options?.['aria-labelledby'] !== undefined) {
      result['aria-labelledby'] = options['aria-labelledby'];
    }
    if (options?.disabled !== undefined) result.disabled = options.disabled;
    if (options?.required !== undefined) result.required = options.required;
    return result;
  }

  const invalid: AriaInvalid | undefined =
    options?.['aria-invalid'] !== undefined
      ? options['aria-invalid']
      : field.invalid
        ? true
        : undefined;

  const result: FieldControlProps = {
    disabled: options?.disabled ?? field.disabled,
    required: options?.required ?? field.required,
  };

  if (field.mode === 'single') {
    result.id = options?.id ?? field.inputId;
  } else if (options?.id !== undefined) {
    result.id = options.id;
  }

  if (field.mode === 'group' || options?.labelledBy === true) {
    const labelledBy = options?.['aria-labelledby'] ?? field.labelledBy;
    if (labelledBy !== undefined) result['aria-labelledby'] = labelledBy;
  }

  const describedBy = options?.['aria-describedby'] ?? field.describedBy;
  if (describedBy !== undefined) result['aria-describedby'] = describedBy;
  if (invalid !== undefined) result['aria-invalid'] = invalid;
  if (isVisuallyInvalid(invalid)) result['data-invalid'] = 'true';
  return result;
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
