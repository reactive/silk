import { css, cx } from '@linaria/core';
import { Label as RadixLabel, Slot } from 'radix-ui';
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

/** How Field.Label associates with the control. */
export type FieldLabelAssociation = 'htmlFor' | 'labelledby';

/**
 * Mark a control component so Field.Root omits Label `htmlFor` and does not
 * auto-assign `inputId` (see `useFieldControlProps({ labelledBy: true })`).
 * Used when the focusable node is not HTML-labelable (e.g. `role="slider"`).
 *
 * Detection walks JSX children (layout wrappers are transparent). Opaque
 * wrappers that hide the marked component should use `mode="group"` instead,
 * or re-export the marker on the wrapper component type.
 */
export const fieldLabelAssociation: unique symbol = Symbol.for(
  'silk.fieldLabelAssociation',
);

export type AriaInvalid = NonNullable<AriaAttributes['aria-invalid']>;

/** Wiring a Field publishes to its label, description, error, and control. */
export interface FieldContextValue {
  readonly mode: FieldMode;
  readonly inputId: string;
  readonly labelId: string;
  /** Id of the rendered Field.Label, or undefined when the Field has none. */
  readonly labelledBy: string | undefined;
  /**
   * `htmlFor` — Label uses `htmlFor={inputId}` (native labelable controls).
   * `labelledby` — Label omits `htmlFor`; control uses `aria-labelledby`.
   */
  readonly labelAssociation: FieldLabelAssociation;
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
   * `single` — control receives id + aria-describedby; Label uses htmlFor
   * (unless a labelledby-marked control like Slider is present).
   * `group` — group receives aria-labelledby; Label is not htmlFor-associated.
   */
  readonly mode?: FieldMode;
  /**
   * Id for the labelled control when using `htmlFor` association, defaulting to
   * a generated one. Set it here rather than on the control so Label `htmlFor`
   * and the control agree during SSR. Ignored for labelledby-marked controls
   * (e.g. Slider) and in `group` mode, where Label omits `htmlFor`.
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

function isLabelledByControl(type: unknown): boolean {
  return (
    (typeof type === 'function' ||
      (typeof type === 'object' && type !== null)) &&
    fieldLabelAssociation in type &&
    (type as Record<symbol, unknown>)[fieldLabelAssociation] === 'labelledby'
  );
}

/**
 * SSR-safe aria wiring from Field.Root descendants.
 * Layout wrappers (Inline, Stack, Fragment, …) are transparent; nested
 * Field.Root boundaries are not — their slots belong to the inner field.
 * Controls must not point `aria-labelledby` at an id no element carries.
 */
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
} {
  let labelledBy: string | undefined;
  let labelAssociation: FieldLabelAssociation =
    mode === 'group' ? 'labelledby' : 'htmlFor';
  const describedParts: string[] = [];

  const walk = (nodes: ReactNode): void => {
    Children.forEach(nodes, (child) => {
      if (!isValidElement(child)) return;
      if (child.type === FieldRoot) return;
      if (isElementOfType(child, FieldLabel)) {
        labelledBy ??= child.props.id ?? labelId;
        return;
      }
      if (isElementOfType(child, FieldDescription)) {
        describedParts.push(child.props.id ?? descriptionId);
        return;
      }
      if (isElementOfType(child, FieldError)) {
        describedParts.push(child.props.id ?? errorId);
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
  };
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

  const { labelledBy, describedBy, labelAssociation } = useMemo(
    () =>
      ariaFromFieldChildren(children, mode, labelId, descriptionId, errorId),
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
    props.htmlFor ??
    (field?.labelAssociation === 'htmlFor' ? field.inputId : undefined);

  return (
    <RadixLabel.Root
      {...props}
      id={props.id ?? field?.labelId}
      htmlFor={htmlFor}
      className={cx(labelClass, className)}
      data-disabled={field?.disabled ? 'true' : undefined}
    >
      {/* Unconditional even when the field is optional: the `null` branch still
          counts as a child. See ARCHITECTURE.md#aschild-with-decorations */}
      <Slot.Slottable>{children}</Slot.Slottable>
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
   * When true (or in `group` mode / `labelAssociation: 'labelledby'`), wire
   * `aria-labelledby` to the Field label and skip auto `id` (Label will not
   * use `htmlFor`). Use for controls where `htmlFor` cannot supply an
   * accessible name (e.g. `role="slider"`). Mark the component with
   * `fieldLabelAssociation` so Field.Root omits Label `htmlFor` as well.
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

  const useLabelledBy =
    field.mode === 'group' ||
    field.labelAssociation === 'labelledby' ||
    options?.labelledBy === true;

  // labelledby association: no auto id (Label omits htmlFor). Explicit id wins.
  if (field.mode === 'single' && !useLabelledBy) {
    result.id = options?.id ?? field.inputId;
  } else if (options?.id !== undefined) {
    result.id = options.id;
  }

  if (useLabelledBy) {
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
