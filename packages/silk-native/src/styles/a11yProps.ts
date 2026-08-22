/**
 * Emit React Native accessibility object props together with react-native-web
 * ARIA aliases. RNW 0.21 forwards flattened `accessibilityValueMin/Max/Now/Text`
 * and DOM ARIA attributes, not the RN object shapes — without aliases, Checkbox
 * `aria-checked` and Progress `aria-valuenow` would silently vanish in
 * Storybook / jsdom tests.
 */

/** RN / RNW-compatible checked values (excludes string "true"/"false"). */
export type AriaChecked = boolean | 'mixed';

export interface AccessibilityStateCompat {
  readonly disabled?: boolean | undefined;
  readonly selected?: boolean | undefined;
  readonly checked?: boolean | 'mixed' | undefined;
  readonly busy?: boolean | undefined;
  readonly expanded?: boolean | undefined;
}

export interface AccessibilityValueCompat {
  readonly min?: number | undefined;
  readonly max?: number | undefined;
  readonly now?: number | undefined;
  readonly text?: string | undefined;
}

export interface A11yStateProps {
  readonly accessibilityState: AccessibilityStateCompat;
  readonly 'aria-checked'?: AriaChecked;
  readonly 'aria-disabled'?: boolean;
  readonly 'aria-selected'?: boolean;
  readonly 'aria-busy'?: boolean;
  readonly 'aria-expanded'?: boolean;
}

export interface A11yValueProps {
  readonly accessibilityValue: AccessibilityValueCompat;
  readonly accessibilityValueMin?: number;
  readonly accessibilityValueMax?: number;
  readonly accessibilityValueNow?: number;
  readonly accessibilityValueText?: string;
  readonly 'aria-valuemin'?: number;
  readonly 'aria-valuemax'?: number;
  readonly 'aria-valuenow'?: number;
  readonly 'aria-valuetext'?: string;
}

/**
 * RN typings omit attrs RNW and native a11y still read at runtime
 * (`data-*`, `aria-*`, `accessibilityLevel`).
 */
export function rnwAttrs(
  attrs: Record<string, string | number | boolean | undefined>,
): object {
  return attrs;
}

export function a11yState(
  state: AccessibilityStateCompat,
): A11yStateProps {
  return {
    accessibilityState: state,
    ...(state.checked !== undefined ? { 'aria-checked': state.checked } : {}),
    ...(state.disabled !== undefined
      ? { 'aria-disabled': state.disabled }
      : {}),
    ...(state.selected !== undefined
      ? { 'aria-selected': state.selected }
      : {}),
    ...(state.busy !== undefined ? { 'aria-busy': state.busy } : {}),
    ...(state.expanded !== undefined
      ? { 'aria-expanded': state.expanded }
      : {}),
  };
}

export function a11yValue(value: AccessibilityValueCompat): A11yValueProps {
  return {
    accessibilityValue: value,
    ...(value.min !== undefined
      ? { accessibilityValueMin: value.min, 'aria-valuemin': value.min }
      : {}),
    ...(value.max !== undefined
      ? { accessibilityValueMax: value.max, 'aria-valuemax': value.max }
      : {}),
    ...(value.now !== undefined
      ? { accessibilityValueNow: value.now, 'aria-valuenow': value.now }
      : {}),
    ...(value.text !== undefined
      ? { accessibilityValueText: value.text, 'aria-valuetext': value.text }
      : {}),
  };
}
