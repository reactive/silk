import { sliderRecipe, type SliderVariantProps } from '@reactive/silk-core';
import {
  type ComponentRef,
  useCallback,
  useRef,
  useState,
  type JSX,
  type ReactNode,
  type Ref,
} from 'react';
import {
  I18nManager,
  Platform,
  View,
  type AccessibilityActionEvent,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { a11yState, a11yValue, rnwAttrs } from '../styles/a11yProps.js';
import { minTouchHitSlop } from '../styles/controlGeometry.js';
import { mapSliderStyle } from '../styles/mappers/controls.js';
import { useComponentDefaults } from '../theme/SilkProvider.js';
import { useTheme } from '../theme/ThemeProvider.js';
import { fieldLabelAssociation, type FieldLabelAssociation, useFieldControlProps, useFieldControlRegistration } from './Field.js';
import { Pressable } from './Pressable.js';
import { useControllableValue } from './useControllableValue.js';

const WEB = Platform.OS === 'web';

/** A key pressed on a thumb: react-native-web's `onKeyDown`, which React Native's types lack. */
interface ThumbKeyEvent {
  readonly nativeEvent: { readonly key: string; readonly shiftKey?: boolean };
  preventDefault(): void;
}

export interface SliderProps
  extends SliderVariantProps,
    Omit<ViewProps, 'children' | 'style'> {
  readonly ref?: Ref<ComponentRef<typeof View>>;
  readonly style?: StyleProp<ViewStyle>;
  /**
   * Drawn over the track and under the thumbs (marks, a scale). They never
   * take touches: a press on them slides the thumb nearest it, as on the track.
   */
  readonly children?: ReactNode;
  /** One number per thumb, in order (controlled). */
  readonly value?: readonly number[];
  /** One number per thumb, in order (uncontrolled). @default [min] */
  readonly defaultValue?: readonly number[];
  /** Every change while sliding or on each key. */
  readonly onValueChange?: (value: number[]) => void;
  /** Once per change: as a slide ends, or on each key or assistive action. */
  readonly onValueCommit?: (value: number[]) => void;
  /** @default 0 */
  readonly min?: number;
  /** @default 100 */
  readonly max?: number;
  /** @default 1 */
  readonly step?: number;
  /** How many steps apart neighboring thumbs stay. @default 0 */
  readonly minStepsBetweenThumbs?: number;
  /** @default 'horizontal' */
  readonly orientation?: 'horizontal' | 'vertical';
  /** Reading direction of a horizontal slider. @default the app's (I18nManager) */
  readonly dir?: 'ltr' | 'rtl';
  /** Runs from the end to the start (right to left, or top to bottom). */
  readonly inverted?: boolean;
  readonly disabled?: boolean;
  readonly invalid?: boolean;
  /** Per-thumb accessible names; preferred with more than one thumb. */
  readonly thumbLabels?: readonly string[];
  /** Per-thumb spoken values ("1,500 rating" for 1500). */
  readonly thumbValueText?: readonly string[];
  readonly 'aria-describedby'?: string;
}

/** Which edge a value of `min` sits at. */
type SlideFrom = 'left' | 'right' | 'bottom' | 'top';

/** Keys that move a thumb toward `min`, by the edge `min` sits at (Radix's). */
const BACK_KEYS: Record<SlideFrom, readonly string[]> = {
  left: ['Home', 'PageDown', 'ArrowDown', 'ArrowLeft'],
  right: ['Home', 'PageDown', 'ArrowDown', 'ArrowRight'],
  bottom: ['Home', 'PageDown', 'ArrowDown', 'ArrowLeft'],
  top: ['Home', 'PageDown', 'ArrowUp', 'ArrowLeft'],
};
const PAGE_KEYS = ['PageUp', 'PageDown'];
const ARROW_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

const decimals = (n: number): number => (String(n).split('.')[1] ?? '').length;

/** `value` on the step grid from `min`, within bounds. */
function snap(value: number, min: number, max: number, step: number): number {
  const snapped = Math.round((value - min) / step) * step + min;
  const rounded = Number(snapped.toFixed(Math.max(decimals(step), decimals(min))));
  return Math.min(max, Math.max(min, rounded));
}

/** `values` with the one at `index` replaced by `next`, sorted. */
const replaced = (values: readonly number[], next: number, index: number): number[] =>
  values.map((value, i) => (i === index ? next : value)).sort((a, b) => a - b);

const keepsApart = (values: readonly number[], gap: number): boolean =>
  values.every((value, i) => i === 0 || value - values[i - 1]! >= gap);

/** The thumb nearest `value`, the first on a tie. */
function nearest(values: readonly number[], value: number): number {
  const distances = values.map((each) => Math.abs(each - value));
  return distances.indexOf(Math.min(...distances));
}

/**
 * Where a part `size` long sits along the slider, `fraction` of the way from
 * `min`'s edge: its center runs from `thumbSize / 2` to `thumbSize / 2` before
 * the far edge, so no thumb overhangs the slider (Radix's in-bounds offset).
 * Percent plus a fixed margin, so it needs no measured size, as on a server.
 */
function along(from: SlideFrom, fraction: number, thumbSize: number, size: number): ViewStyle {
  const margin = thumbSize / 2 - fraction * thumbSize - size / 2;
  const position = `${fraction * 100}%` as const;
  switch (from) {
    case 'left':
      return { left: position, marginLeft: margin };
    case 'right':
      return { right: position, marginRight: margin };
    case 'bottom':
      return { bottom: position, marginBottom: margin };
    case 'top':
      return { top: position, marginTop: margin };
  }
}

/** The range's two ends: from `start` to `end`, fractions of the way from `min`'s edge. */
function span(from: SlideFrom, start: number, end: number, thumbSize: number): ViewStyle {
  const near = (fraction: number) => thumbSize / 2 - fraction * thumbSize;
  const [startEdge, endEdge] = {
    left: ['left', 'right'],
    right: ['right', 'left'],
    bottom: ['bottom', 'top'],
    top: ['top', 'bottom'],
  }[from] as [SlideFrom, SlideFrom];
  const margin = (edge: SlideFrom) => `margin${edge[0]!.toUpperCase()}${edge.slice(1)}`;
  return {
    [startEdge]: `${start * 100}%`,
    [margin(startEdge)]: start === 0 ? 0 : near(start),
    [endEdge]: `${(1 - end) * 100}%`,
    [margin(endEdge)]: near(1 - end),
  };
}

/**
 * Picks one number, or several (a range), by sliding a thumb along a track:
 * web `Slider`'s contract (Radix's), with one number per thumb. Drag a thumb,
 * or press the track to bring the nearest thumb there; on the web, the arrow
 * keys move a focused thumb a step (ten with Shift, or Page Up and Page
 * Down), Home and End send the first thumb to `min` and the last to `max`.
 * Assistive technology adjusts each thumb a step at a time.
 */
export function Slider({
  size,
  tone,
  value: valueProp,
  defaultValue,
  onValueChange,
  onValueCommit,
  min = 0,
  max = 100,
  step = 1,
  minStepsBetweenThumbs = 0,
  orientation = 'horizontal',
  dir,
  inverted = false,
  disabled,
  invalid,
  thumbLabels,
  thumbValueText,
  children,
  style,
  ref,
  onLayout: onLayoutProp,
  nativeID,
  accessibilityLabel,
  accessibilityHint,
  accessibilityLabelledBy,
  'aria-describedby': ariaDescribedBy,
  ...rest
}: SliderProps): JSX.Element {
  const { theme, density } = useTheme();
  const defaults = useComponentDefaults('Slider');
  const resolved: SliderVariantProps = {
    size: size ?? defaults.size ?? sliderRecipe.defaults.size,
    tone: tone ?? defaults.tone ?? sliderRecipe.defaults.tone,
  };
  const fieldProps = useFieldControlProps({
    disabled,
    'aria-invalid': invalid,
    nativeID,
    accessibilityLabel,
    accessibilityHint,
    accessibilityLabelledBy,
    'aria-describedby': ariaDescribedBy,
  });
  const isDisabled = Boolean(fieldProps.disabled);
  const isInvalid = Boolean(fieldProps.invalid);
  const [values, setUncontrolled] = useControllableValue<readonly number[]>(
    valueProp,
    defaultValue ?? [min],
  );
  const vertical = orientation === 'vertical';
  const rtl = (dir ?? (I18nManager.isRTL ? 'rtl' : 'ltr')) === 'rtl';
  const from: SlideFrom = vertical
    ? inverted
      ? 'top'
      : 'bottom'
    : rtl !== inverted
      ? 'right'
      : 'left';
  const { root, track, range, thumb, thumbSize } = mapSliderStyle(theme, resolved, density, {
    orientation,
    invalid: isInvalid,
    disabled: isDisabled,
  });

  // Read by gestures and keys that outlive the render that set them up.
  const latest = useRef(values);
  latest.current = values;
  const extent = useRef(0);
  const thumbs = useRef<(ComponentRef<typeof View> | null)[]>([]);
  const sliding = useRef<{ index: number; before: readonly number[]; start: number; page: number }>(
    undefined,
  );
  const [active, setActive] = useState<number>();

  const fractionOf = (value: number) => (max > min ? (value - min) / (max - min) : 0);

  /** Puts `next` at thumb `index`; returns where that thumb is after sorting, or undefined if refused. */
  const update = (next: number, index: number, commit: boolean): number | undefined => {
    const before = latest.current;
    const snapped = snap(next, min, max, step);
    const after = replaced(before, snapped, index);
    if (!keepsApart(after, minStepsBetweenThumbs * step)) return undefined;
    const at = after.indexOf(snapped);
    if (String(after) === String(before)) return at;
    latest.current = after;
    setUncontrolled(after);
    onValueChange?.(after);
    if (commit) onValueCommit?.(after);
    return at;
  };

  /** The value at `offset` along the slider from its top-left corner. */
  const valueAt = (offset: number): number => {
    const travel = extent.current - thumbSize;
    const fraction = travel > 0 ? Math.min(1, Math.max(0, (offset - thumbSize / 2) / travel)) : 0;
    const fromMin = from === 'right' || from === 'bottom' ? 1 - fraction : fraction;
    return min + fromMin * (max - min);
  };

  const onLayout = (event: LayoutChangeEvent): void => {
    const { width, height } = event.nativeEvent.layout;
    extent.current = vertical ? height : width;
    onLayoutProp?.(event);
  };

  const offsetOf = ({ nativeEvent }: GestureResponderEvent) =>
    vertical
      ? { location: nativeEvent.locationY, page: nativeEvent.pageY }
      : { location: nativeEvent.locationX, page: nativeEvent.pageX };

  const onGrant = (event: GestureResponderEvent) => {
    // The slider is the target (its parts take no touches), so the location is its own.
    const { location, page } = offsetOf(event);
    const value = valueAt(location);
    const before = latest.current;
    const index = update(value, nearest(before, value), false) ?? nearest(before, value);
    sliding.current = { index, before, start: location, page };
    setActive(index);
    if (WEB) (thumbs.current[index] as { focus?: () => void } | null)?.focus?.();
  };
  const onMove = (event: GestureResponderEvent) => {
    const slide = sliding.current;
    if (!slide) return;
    // From the page, as the pointer may now be over something else.
    const { page } = offsetOf(event);
    const at = update(valueAt(slide.start + page - slide.page), slide.index, false);
    if (at !== undefined && at !== slide.index) {
      slide.index = at;
      setActive(at);
    }
  };
  const onEnd = () => {
    const slide = sliding.current;
    sliding.current = undefined;
    setActive(undefined);
    if (slide && String(latest.current) !== String(slide.before)) onValueCommit?.([...latest.current]);
  };

  const nudge = (index: number, steps: number) =>
    update(latest.current[index]! + steps * step, index, true);

  const onThumbKey = (index: number) => (event: ThumbKeyEvent) => {
    const { key, shiftKey } = event.nativeEvent;
    if (key === 'Home') update(min, 0, true);
    else if (key === 'End') update(max, latest.current.length - 1, true);
    else if (PAGE_KEYS.includes(key) || ARROW_KEYS.includes(key)) {
      const times = PAGE_KEYS.includes(key) || (shiftKey && ARROW_KEYS.includes(key)) ? 10 : 1;
      const at = nudge(index, BACK_KEYS[from].includes(key) ? -times : times);
      if (at !== undefined && at !== index) focusThumb(at);
    } else return;
    event.preventDefault();
  };
  const focusThumb = (index: number) =>
    (thumbs.current[index] as { focus?: () => void } | null)?.focus?.();

  const onAction = (index: number) => (event: AccessibilityActionEvent) => {
    const { actionName } = event.nativeEvent;
    if (actionName === 'increment') nudge(index, 1);
    else if (actionName === 'decrement') nudge(index, -1);
  };

  // A Field label focuses the first thumb.
  const focusFirst = useCallback(() => focusThumb(0), []);
  useFieldControlRegistration(focusFirst);

  const fractions = values.map(fractionOf);
  const single = values.length === 1;
  const hitSlop = minTouchHitSlop(vertical ? Number(root.width) : Number(root.minHeight));
  return (
    <View
      ref={ref}
      {...rest}
      onLayout={onLayout}
      hitSlop={vertical ? { left: hitSlop, right: hitSlop } : { top: hitSlop, bottom: hitSlop }}
      onStartShouldSetResponder={() => !isDisabled}
      onResponderTerminationRequest={() => false}
      onResponderGrant={onGrant}
      onResponderMove={onMove}
      onResponderRelease={onEnd}
      onResponderTerminate={onEnd}
      style={[root, WEB && !isDisabled ? WEB_SLIDER : undefined, style]}
      {...rnwAttrs(
        {
          'data-orientation': orientation,
          'data-disabled': isDisabled ? '' : undefined,
          'data-invalid': isInvalid ? 'true' : undefined,
        },
        rest,
      )}
    >
      <View pointerEvents="none" style={track}>
        <View
          style={[
            range,
            span(from, single ? 0 : fractions[0]!, fractions[fractions.length - 1]!, thumbSize),
          ]}
        />
      </View>
      {children === undefined ? null : (
        <View pointerEvents="none" style={FILL}>
          {children}
        </View>
      )}
      {values.map((value, index) => {
        const label =
          thumbLabels?.[index] ??
          (single
            ? fieldProps.accessibilityLabel
            : fieldProps.accessibilityLabel && `${fieldProps.accessibilityLabel} (${index + 1})`);
        return (
          <Pressable
            key={index}
            ref={(node) => {
              thumbs.current[index] = node;
            }}
            pointerEvents="none"
            focusable={!isDisabled}
            disabled={isDisabled}
            focusRing={isInvalid ? 'danger' : resolved.tone}
            accessibilityRole="adjustable"
            accessibilityLabel={label}
            accessibilityHint={fieldProps.accessibilityHint}
            accessibilityLabelledBy={
              thumbLabels?.[index] === undefined && single
                ? fieldProps.accessibilityLabelledBy
                : undefined
            }
            nativeID={single ? fieldProps.nativeID : undefined}
            accessibilityActions={ACTIONS}
            onAccessibilityAction={onAction(index)}
            {...a11yState({ disabled: isDisabled })}
            {...a11yValue({ min, max, now: value, text: thumbValueText?.[index] })}
            {...({ onKeyDown: onThumbKey(index) } as object)}
            {...rnwAttrs({
              'aria-orientation': orientation,
              'aria-describedby': fieldProps['aria-describedby'],
              'aria-invalid': fieldProps['aria-invalid'],
              'data-active': active === index ? '' : undefined,
            })}
            style={[
              thumb,
              vertical
                ? { left: '50%', marginLeft: -thumbSize / 2 }
                : { top: '50%', marginTop: -thumbSize / 2 },
              along(from, fractions[index]!, thumbSize, thumbSize),
            ]}
          />
        );
      })}
    </View>
  );
}

(Slider as typeof Slider & { [fieldLabelAssociation]: FieldLabelAssociation })[
  fieldLabelAssociation
] = 'labelledby';

const ACTIONS = [{ name: 'increment' }, { name: 'decrement' }] as const;

const FILL: ViewStyle = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 };

/** Web only: a pointer over it, no text selected or page scrolled by a drag. */
const WEB_SLIDER = { cursor: 'pointer', userSelect: 'none', touchAction: 'none' } as ViewStyle;
