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
 * (`data-*`, `aria-*`, `accessibilityLevel`). react-native-web drops raw
 * `data-*` props and writes its `dataSet` prop as `data-*` attributes
 * instead, so `data-*` keys move there (camel-cased, as RNW expects),
 * after the entries of `own`'s `dataSet`: the caller's props spread before
 * these, whose `dataSet` this one would otherwise replace.
 */
export function rnwAttrs(
  attrs: Record<string, string | number | boolean | undefined>,
  own?: object,
): object {
  const props: Record<string, unknown> = {};
  const dataSet: Record<string, unknown> = { ...(own as { dataSet?: object } | undefined)?.dataSet };
  for (const [key, value] of Object.entries(attrs)) {
    if (!key.startsWith('data-')) props[key] = value;
    else if (value !== undefined) {
      dataSet[key.slice(5).replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())] =
        value;
    }
  }
  if (Object.keys(dataSet).length > 0) props.dataSet = dataSet;
  return props;
}

/**
 * A key pressed on a focused element: react-native-web's `onKeyDown`, which
 * React Native's View types lack before 0.84.
 */
export interface WebKeyDownEvent {
  readonly nativeEvent: { readonly key: string; readonly shiftKey?: boolean };
  preventDefault(): void;
}

/**
 * `handler` as react-native-web's `onKeyDown` prop, typed here once so the
 * components that take keys don't each cast it.
 */
export function webKeyHandler(handler: (event: WebKeyDownEvent) => void): {
  readonly onKeyDown: (event: WebKeyDownEvent) => void;
} {
  return { onKeyDown: handler };
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

/** The DOM element react-native-web focuses (silk-native doesn't load DOM types). */
export interface FocusTarget {
  matches?: (selector: string) => boolean;
  ownerDocument?: {
    addEventListener(type: string, listener: () => void, capture: boolean): void;
    removeEventListener(type: string, listener: () => void, capture: boolean): void;
  };
}

/**
 * The browser decides whether focus should show (`:focus-visible`), so a click
 * doesn't ring a button but Tab does.
 */
export function matchesFocusVisible(target: FocusTarget): boolean {
  try {
    return target.matches?.(':focus-visible') ?? true;
  } catch {
    // A browser too old for :focus-visible: show every focus.
    return true;
  }
}
