import { css, cx } from '@linaria/core';
import { sliderRecipe, type SliderVariantProps } from '@reactive/silk-core';
import { Slider as RadixSlider } from 'radix-ui';
import type { ComponentPropsWithoutRef, JSX, ReactNode, Ref } from 'react';
import { focusRingCss } from '../theme/focusRing';
import { useComponentDefaults } from '../theme/SilkProvider';
import { tonePrivateVarsCss } from '../theme/tonePrivateVars';
import {
  fieldLabelAssociation,
  useFieldControlProps,
  type FieldLabelAssociation,
} from './Field';

export interface SliderProps
  extends Omit<ComponentPropsWithoutRef<typeof RadixSlider.Root>, 'asChild'>,
    SliderVariantProps {
  readonly ref?: Ref<HTMLSpanElement>;
  readonly children?: ReactNode;
  /**
   * Per-thumb accessible names. Preferred when `value` has multiple thumbs.
   * Falls back to Field label, or root `aria-label` (indexed for multi-thumb).
   */
  readonly thumbLabels?: readonly string[];
  /** Per-thumb aria-valuetext; single-thumb also accepts root `aria-valuetext`. */
  readonly thumbValueText?: readonly string[];
}

const toneRules: string = tonePrivateVarsCss(sliderRecipe.variants.tone, [
  'solid',
  'subtle',
  'focus-ring',
  'disabled-bg',
]);

const rootClass: string = css`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  min-height: var(--silk-space-6);
  user-select: none;
  touch-action: none;

  ${toneRules}

  &:where([data-size='sm']) {
    --_track-h: var(--silk-space-1);
    --_thumb: var(--silk-space-4);
  }

  &:where([data-size='md']) {
    --_track-h: var(--silk-space-2);
    --_thumb: var(--silk-space-5);
  }

  &:where([data-disabled]) {
    opacity: 0.55;
  }

  &:where([data-orientation='vertical']) {
    flex-direction: column;
    width: var(--_thumb);
    min-height: calc(var(--silk-space-10) * 2);
  }
`;

const trackClass: string = css`
  position: relative;
  flex-grow: 1;
  background-color: var(--silk-color-surface-sunken);
  border-radius: var(--silk-radius-full);
  height: var(--_track-h);

  /* Self-selector: Field.Root also sets data-orientation, so an ancestor
     match would apply vertical track sizing inside a horizontal Field and
     collapse the line to 0. Radix sets data-orientation on Track/Range. */
  &:where([data-orientation='vertical']) {
    width: var(--_track-h);
    height: 100%;
  }
`;

const rangeClass: string = css`
  position: absolute;
  background-color: var(--_tone-solid);
  border-radius: inherit;
  height: 100%;

  &:where([data-orientation='vertical']) {
    width: 100%;
  }
`;

const thumbClass: string = css`
  display: block;
  width: var(--_thumb);
  height: var(--_thumb);
  background-color: var(--silk-color-surface);
  border: 2px solid var(--_tone-solid);
  border-radius: var(--silk-radius-full);
  box-shadow: var(--silk-shadow-raised);
  cursor: pointer;

  &:where(:focus-visible) {
    ${focusRingCss('var(--_tone-focus-ring)')}
  }

  :where([data-invalid='true']) & {
    border-color: var(--silk-color-tone-danger-solid);
  }

  :where([data-invalid='true']) &:where(:focus-visible) {
    ${focusRingCss('var(--silk-color-tone-danger-focus-ring)')}
  }

  &:where([data-disabled]) {
    cursor: not-allowed;
    background-color: var(--_tone-disabled-bg);
  }
`;

/**
 * Radix-backed slider. Accessible name/description/valuetext live on Thumb
 * (the `role="slider"` node), not the Root span. Thumbs are not HTML-labelable,
 * so Field associates via `aria-labelledby` (not Label `htmlFor`).
 *
 * `Field.Root required` is presentation-only here: `role="slider"` does not
 * support `aria-required`, and a range always has a value (unlike Checkbox).
 */
export function Slider({
  className,
  size,
  tone,
  id,
  disabled,
  children,
  thumbLabels,
  thumbValueText,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-valuetext': ariaValueText,
  'aria-invalid': ariaInvalid,
  ...props
}: SliderProps): JSX.Element {
  const defaults = useComponentDefaults('Slider');
  const resolvedSize = size ?? defaults.size ?? sliderRecipe.defaults.size;
  const resolvedTone = tone ?? defaults.tone ?? sliderRecipe.defaults.tone;

  const fieldProps = useFieldControlProps({
    id,
    disabled,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    'aria-labelledby': ariaLabelledBy,
    // htmlFor does not name role=slider spans.
    labelledBy: true,
  });

  const thumbCount = (props.value ?? props.defaultValue ?? [0]).length;
  const fieldLabelledBy = fieldProps['aria-labelledby'];
  const fieldDescribedBy = fieldProps['aria-describedby'];
  const fieldInvalid = fieldProps['aria-invalid'];
  const resolvedDisabled = fieldProps.disabled;

  return (
    <RadixSlider.Root
      {...props}
      // exactOptionalPropertyTypes: Radix rejects an explicit `disabled: undefined`.
      {...(resolvedDisabled !== undefined
        ? { disabled: resolvedDisabled }
        : {})}
      className={cx(rootClass, className)}
      data-size={resolvedSize}
      data-tone={resolvedTone}
      data-invalid={fieldProps['data-invalid']}
    >
      <RadixSlider.Track className={trackClass}>
        <RadixSlider.Range className={rangeClass} />
      </RadixSlider.Track>
      {Array.from({ length: thumbCount }, (_, index) => {
        const thumbLabel = thumbLabels?.[index];
        // labelledby wins over aria-label in accname — clear Field wiring when
        // an explicit per-thumb label is provided.
        const labelledBy =
          thumbLabel !== undefined ? undefined : fieldLabelledBy;
        let label = thumbLabel;
        if (label === undefined && !fieldLabelledBy && ariaLabel !== undefined) {
          label = thumbCount === 1 ? ariaLabel : `${ariaLabel} (${index + 1})`;
        }
        const valueText =
          thumbValueText?.[index] ??
          (thumbCount === 1 ? ariaValueText : undefined);
        const thumbId =
          thumbCount === 1
            ? fieldProps.id
            : fieldProps.id
              ? `${fieldProps.id}-${index}`
              : undefined;

        return (
          <RadixSlider.Thumb
            key={index}
            className={thumbClass}
            id={thumbId}
            aria-label={label}
            aria-labelledby={labelledBy}
            aria-describedby={fieldDescribedBy}
            aria-valuetext={valueText}
            aria-invalid={fieldInvalid}
          />
        );
      })}
      {children}
    </RadixSlider.Root>
  );
}

(
  Slider as typeof Slider & {
    [fieldLabelAssociation]: FieldLabelAssociation;
  }
)[fieldLabelAssociation] = 'labelledby';
