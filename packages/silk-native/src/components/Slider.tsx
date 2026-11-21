import { sliderRecipe, type SliderVariantProps } from '@reactive/silk-core';
import {
  type ComponentRef,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type JSX,
  type ReactNode,
  type Ref,
} from 'react';
import {
  I18nManager,
  Platform,
  StyleSheet,
  View,
  type AccessibilityActionEvent,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import {
  a11yState,
  a11yValue,
  rnwAttrs,
  webKeyHandler,
  type WebKeyDownEvent,
} from '../styles/a11yProps.js';
import { minTouchHitSlop } from '../styles/controlGeometry.js';
import { mapSliderStyle } from '../styles/mappers/controls.js';
import { useComponentDefaults } from '../theme/SilkProvider.js';
import { useTheme } from '../theme/ThemeProvider.js';
import {
  fieldLabelAssociation,
  type FieldLabelAssociation,
  useFieldControlProps,
  useFieldControlRegistration,
} from './Field.js';
import { Pressable } from './Pressable.js';
import { useControllableValue } from './useControllableValue.js';

const WEB = Platform.OS === 'web';

type Thumb = ComponentRef<typeof View> & { focus?: () => void };

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
  /** Greater than 0. @default 1 */
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

/** The far edge from each slide edge, and the margin property of each edge. */
const FAR: Record<SlideFrom, SlideFrom> = { left: 'right', right: 'left', bottom: 'top', top: 'bottom' };
const MARGIN = {
  left: 'marginLeft',
  right: 'marginRight',
  bottom: 'marginBottom',
  top: 'marginTop',
} as const satisfies Record<SlideFrom, keyof ViewStyle>;

export interface SliderBounds {
  readonly min: number;
  readonly max: number;
  readonly step: number;
  /** The smallest gap between neighboring thumbs, in steps. */
  readonly minSteps: number;
}

const sameValues = (a: readonly number[], b: readonly number[]): boolean =>
  a.length === b.length && a.every((value, i) => value === b[i]);

/** Which edge `min` sits at. */
function slideFrom(vertical: boolean, rtl: boolean, inverted: boolean): SlideFrom {
  if (vertical) return inverted ? 'top' : 'bottom';
  // Right to left and inverted cancel out.
  return rtl !== inverted ? 'right' : 'left';
}

const decimals = (n: number): number => (String(n).split('.')[1] ?? '').length;

/**
 * The values after moving thumb `index` to `next` (snapped to the step grid
 * from `min`, within bounds, then sorted), and where that thumb ended up; or
 * undefined if neighbors would come closer than `minSteps` steps. Pure.
 */
export function moveThumb(
  values: readonly number[],
  next: number,
  index: number,
  { min, max, step, minSteps }: SliderBounds,
): { values: number[]; index: number } | undefined {
  const places = Math.max(decimals(step), decimals(min));
  const snapped = Number((Math.round((next - min) / step) * step + min).toFixed(places));
  const value = Math.min(max, Math.max(min, snapped));
  const moved = values.map((each, i) => (i === index ? value : each)).sort((a, b) => a - b);
  // Counted in whole steps, so a float difference (0.3 - 0.2) doesn't fall short of one.
  const apart = moved.every(
    (each, i) => i === 0 || Math.round((each - moved[i - 1]!) / step) >= minSteps,
  );
  return apart ? { values: moved, index: moved.indexOf(value) } : undefined;
}

/** The thumb nearest `value`, the first on a tie (Radix's). */
export function nearestThumb(values: readonly number[], value: number): number {
  const distances = values.map((each) => Math.abs(each - value));
  return distances.indexOf(Math.min(...distances));
}

/**
 * The fraction of the way from `min`'s edge at `offset` along a slider
 * `length` long (clamped). A thumb's center runs from half a thumb in to half
 * a thumb before the far edge, so no thumb overhangs (Radix's in-bounds
 * offset); `atFraction` places it there.
 */
export function fractionAt(offset: number, length: number, thumbSize: number): number {
  const travel = length - thumbSize;
  return travel > 0 ? Math.min(1, Math.max(0, (offset - thumbSize / 2) / travel)) : 0;
}

/**
 * Where `fraction` puts a thumb's center (`fractionAt`'s inverse), as an
 * edge offset: percent plus a fixed margin, so it needs no measured size, as
 * on a server. `inset` moves it back toward the edge (a
 * thumb's half-width, so its box centers on the point).
 */
const atFraction = (edge: SlideFrom, fraction: number, thumbSize: number, inset = 0): ViewStyle => ({
  [edge]: `${fraction * 100}%`,
  [MARGIN[edge]]: thumbSize / 2 - fraction * thumbSize - inset,
});

/**
 * Picks one number, or several (a range), by sliding a thumb along a track:
 * web `Slider`'s contract (Radix's), with one number per thumb. Drag a thumb,
 * or press the track to bring the nearest thumb there; on the web, the arrow
 * keys move a focused thumb a step (ten with Shift, or Page Up and Page
 * Down), and Home and End send the first thumb to `min` and the last to
 * `max`, as Radix does. Assistive technology adjusts each thumb a step at a
 * time. While dragging, the thumb follows the pointer from the values it
 * last reported, and commits those on release; a controlled `value` that
 * differs applies again once the drag ends.
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
  step: stepProp = 1,
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
  const step = stepProp > 0 ? stepProp : 1;
  const bounds: SliderBounds = { min, max, step, minSteps: minStepsBetweenThumbs };
  const vertical = orientation === 'vertical';
  const rtl = (dir ?? (I18nManager.isRTL ? 'rtl' : 'ltr')) === 'rtl';
  const from = slideFrom(vertical, rtl, inverted);
  const { root, track, range, thumb, thumbSize, crossSize } = mapSliderStyle(
    theme,
    resolved,
    density,
    { orientation, invalid: isInvalid, disabled: isDisabled },
  );

  // The values as last rendered, for gestures and keys that outlive a render.
  // Never ahead of the render: a controlled slider whose owner turns a change
  // down stays where it is, and the next change starts from there.
  const latest = useRef(values);
  useLayoutEffect(() => {
    latest.current = values;
  });
  const thumbs = useRef<(Thumb | null)[]>([]);
  const focusThumb = (index: number) => thumbs.current[index]?.focus?.();

  /**
   * Moves thumb `index` of `from` (the rendered values unless a drag says) to
   * `next` and reports it; returns the values and where that thumb is now,
   * or undefined if refused.
   */
  const setThumb: SetThumb = (next, index, commit, base = latest.current) => {
    const moved = moveThumb(base, next, index, bounds);
    if (!moved) return undefined;
    if (!sameValues(moved.values, base)) {
      setUncontrolled(moved.values);
      onValueChange?.(moved.values);
      if (commit) onValueCommit?.(moved.values);
    }
    return moved;
  };

  const slide = useSlide({
    vertical,
    from,
    thumbSize,
    bounds,
    latest,
    setThumb,
    focusThumb,
    onValueCommit,
  });

  const nudge = (index: number, steps: number) => {
    if (isDisabled) return;
    const at = setThumb(latest.current[index]! + steps * step, index, true)?.index;
    // A thumb pushed past its neighbor takes its place; focus follows it.
    if (at !== undefined && at !== index) focusThumb(at);
  };
  const onThumbKey = (index: number) => (event: WebKeyDownEvent) => {
    const { key, shiftKey } = event.nativeEvent;
    if (isDisabled) return;
    if (key === 'Home') setThumb(min, 0, true);
    else if (key === 'End') setThumb(max, latest.current.length - 1, true);
    else if (PAGE_KEYS.includes(key) || ARROW_KEYS.includes(key)) {
      const times = PAGE_KEYS.includes(key) || shiftKey ? 10 : 1;
      nudge(index, BACK_KEYS[from].includes(key) ? -times : times);
    } else return;
    event.preventDefault();
  };
  const onAction = (index: number) => (event: AccessibilityActionEvent) => {
    const { actionName } = event.nativeEvent;
    if (actionName === 'increment') nudge(index, 1);
    else if (actionName === 'decrement') nudge(index, -1);
  };

  // A Field label focuses the first thumb.
  const focusFirst = useCallback(() => {
    if (!isDisabled) thumbs.current[0]?.focus?.();
  }, [isDisabled]);
  useFieldControlRegistration(focusFirst);

  const fractions = values.map((value) => (max > min ? (value - min) / (max - min) : 0));
  const single = values.length === 1;
  const hitSlop = minTouchHitSlop(crossSize);
  const rangeStart = fractions[0]!;
  const rangeEnd = fractions[fractions.length - 1]!;
  return (
    <View
      ref={ref}
      {...rest}
      onLayout={(event: LayoutChangeEvent) => {
        slide.measure(event);
        onLayoutProp?.(event);
      }}
      hitSlop={vertical ? { left: hitSlop, right: hitSlop } : { top: hitSlop, bottom: hitSlop }}
      onStartShouldSetResponder={() => !isDisabled}
      onResponderTerminationRequest={() => false}
      onResponderGrant={slide.start}
      onResponderMove={slide.move}
      onResponderRelease={slide.end}
      onResponderTerminate={slide.end}
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
            // A single thumb's range starts at the track's edge, not at a thumb center.
            single ? { [from]: 0 } : atFraction(from, rangeStart, thumbSize),
            atFraction(FAR[from], 1 - rangeEnd, thumbSize),
          ]}
        />
      </View>
      {children === undefined ? null : (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
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
            {...webKeyHandler(onThumbKey(index))}
            {...rnwAttrs({
              'aria-orientation': orientation,
              'aria-describedby': fieldProps['aria-describedby'],
              'aria-invalid': fieldProps['aria-invalid'],
              'data-active': slide.active === index ? '' : undefined,
            })}
            style={[
              thumb,
              vertical
                ? { left: '50%', marginLeft: -thumbSize / 2 }
                : { top: '50%', marginTop: -thumbSize / 2 },
              atFraction(from, fractions[index]!, thumbSize, thumbSize / 2),
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

type SetThumb = (
  next: number,
  index: number,
  commit: boolean,
  base?: readonly number[],
) => { values: number[]; index: number } | undefined;

interface SlideOptions {
  readonly vertical: boolean;
  readonly from: SlideFrom;
  readonly thumbSize: number;
  readonly bounds: SliderBounds;
  readonly latest: { readonly current: readonly number[] };
  readonly setThumb: SetThumb;
  readonly focusThumb: (index: number) => void;
  readonly onValueCommit: ((value: number[]) => void) | undefined;
}

/**
 * Dragging, through the responder system: a press brings the nearest thumb
 * there and focuses it (on the web), a move slides it, and the end commits
 * once if anything changed. The slider's parts take no touches, so the
 * press's location is the slider's own; moves add the page distance from
 * the press, so a pointer that wanders off the slider keeps sliding. A drag
 * keeps the values it last reported, since a move may not have rendered yet
 * when the next move or the release comes.
 */
function useSlide({
  vertical,
  from,
  thumbSize,
  bounds,
  latest,
  setThumb,
  focusThumb,
  onValueCommit,
}: SlideOptions) {
  const length = useRef(0);
  const sliding = useRef<{
    index: number;
    before: readonly number[];
    values: readonly number[];
    start: number;
    page: number;
  }>(undefined);
  const [active, setActive] = useState<number>();

  const offsetOf = ({ nativeEvent }: GestureResponderEvent) =>
    vertical
      ? { location: nativeEvent.locationY, page: nativeEvent.pageY }
      : { location: nativeEvent.locationX, page: nativeEvent.pageX };
  const valueAt = (offset: number) => {
    const fraction = fractionAt(offset, length.current, thumbSize);
    // Offsets run from the top-left corner; the slide may start at the other edge.
    const fromMin = from === 'right' || from === 'bottom' ? 1 - fraction : fraction;
    return bounds.min + fromMin * (bounds.max - bounds.min);
  };

  return {
    active,
    measure: (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      length.current = vertical ? height : width;
    },
    start: (event: GestureResponderEvent) => {
      const { location, page } = offsetOf(event);
      const value = valueAt(location);
      const before = latest.current;
      const nearest = nearestThumb(before, value);
      const moved = setThumb(value, nearest, false);
      const index = moved?.index ?? nearest;
      sliding.current = { index, before, values: moved?.values ?? before, start: location, page };
      setActive(index);
      if (WEB) focusThumb(index);
    },
    move: (event: GestureResponderEvent) => {
      const slide = sliding.current;
      if (!slide) return;
      const offset = slide.start + offsetOf(event).page - slide.page;
      const moved = setThumb(valueAt(offset), slide.index, false, slide.values);
      if (!moved) return;
      slide.values = moved.values;
      if (moved.index !== slide.index) {
        slide.index = moved.index;
        setActive(moved.index);
      }
    },
    end: () => {
      const slide = sliding.current;
      sliding.current = undefined;
      setActive(undefined);
      if (slide && !sameValues(slide.values, slide.before)) onValueCommit?.([...slide.values]);
    },
  };
}

const ACTIONS = [{ name: 'increment' }, { name: 'decrement' }] as const;

/** Web only: a pointer over it, no text selected or page scrolled by a drag. */
const WEB_SLIDER = { cursor: 'pointer', userSelect: 'none', touchAction: 'none' } as ViewStyle;
