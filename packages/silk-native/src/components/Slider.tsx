import { sliderRecipe, type SliderVariantProps } from '@reactive/silk-core';
import {
  type ComponentRef,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useLayoutEffect,
  useRef,
  useState,
  type JSX,
  type ReactNode,
  type Ref,
} from 'react';
import {
  I18nManager,
  StyleSheet,
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
import {
  fieldLabelAssociation,
  type FieldLabelAssociation,
  useFieldControlProps,
  useFieldControlRegistration,
} from './Field.js';
import { Pressable } from './Pressable.js';
import { sameItems } from './sameItems.js';
import {
  FAR,
  fractionAt,
  fractionIn,
  placeAt,
  type SliderEdge,
  slideFrom,
} from './sliderGeometry.js';
import { useControllableValue } from './useControllableValue.js';
import { WEB, webKeyHandler, type WebKeyDownEvent } from '../web/host.js';

type Thumb = ComponentRef<typeof View>;

export interface SliderProps
  extends SliderVariantProps,
    Omit<ViewProps, 'children' | 'style'> {
  readonly ref?: Ref<ComponentRef<typeof View>>;
  readonly style?: StyleProp<ViewStyle>;
  /**
   * Drawn over the track and under the thumbs (marks, a scale), placed with
   * `useSliderMarkStyle`. They never take touches: a press on them slides
   * the thumb nearest it, as on the track.
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

/** Keys that move a thumb toward `min`, by the edge `min` sits at (Radix's). */
const BACK_KEYS: Record<SliderEdge, readonly string[]> = {
  left: ['PageDown', 'ArrowDown', 'ArrowLeft'],
  right: ['PageDown', 'ArrowDown', 'ArrowRight'],
  bottom: ['PageDown', 'ArrowDown', 'ArrowLeft'],
  top: ['PageDown', 'ArrowUp', 'ArrowLeft'],
};
const PAGE_KEYS = ['PageUp', 'PageDown'];
const ARROW_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

export interface SliderBounds {
  readonly min: number;
  readonly max: number;
  readonly step: number;
  /** The smallest gap between neighboring thumbs, in steps. */
  readonly minSteps: number;
}

/** The decimal places `n` has, including those of an exponent (1e-7 has 7). */
const decimals = (n: number): number => {
  const [digits = '', exponent = '0'] = String(n).split('e');
  return Math.max(0, (digits.split('.')[1] ?? '').length - Number(exponent));
};

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
  // `+ 0` turns a -0 from the rounding into 0, which compares as the same value.
  const value = Math.min(max, Math.max(min, snapped)) + 0;
  const moved = values.map((each, i) => (i === index ? value : each)).sort((a, b) => a - b);
  // Counted in steps with a hair's slack, so float error (0.3 - 0.2, or values near 1e7)
  // doesn't fall short of a step; a half step to an off-grid `max` still does.
  const apart = moved.every(
    (each, i) => i === 0 || (each - moved[i - 1]!) / step >= minSteps - 1e-6,
  );
  return apart ? { values: moved, index: moved.indexOf(value) } : undefined;
}

/** The thumb nearest `value`, the first on a tie (Radix's). */
export function nearestThumb(values: readonly number[], value: number): number {
  const distances = values.map((each) => Math.abs(each - value));
  return distances.indexOf(Math.min(...distances));
}

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
  const resolved = {
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
  // Memoized: a drag re-renders the slider on every move, and its styles don't change with the values.
  const { root, parts, track, range, thumb, thumbSize, crossSize } = useMemo(
    () =>
      mapSliderStyle(
        theme,
        { size: resolved.size, tone: resolved.tone },
        density,
        { orientation, invalid: isInvalid, disabled: isDisabled },
      ),
    [theme, resolved.size, resolved.tone, density, orientation, isInvalid, isDisabled],
  );

  // The values as last rendered, for gestures and keys that outlive a render.
  // Never ahead of the render: a controlled slider whose owner turns a change
  // down stays where it is, and the next change starts from there.
  const latest = useRef(values);
  useLayoutEffect(() => {
    latest.current = values;
  });
  const thumbs = useRef<(Thumb | null)[]>([]);
  const focusThumb = useCallback((index: number) => thumbs.current[index]?.focus(), []);

  /**
   * Moves thumb `index` of `base` (the rendered values unless a drag says) to
   * `next` and reports the change; returns the values, where that thumb is
   * now and whether they changed, or undefined if refused. Whoever moved it commits.
   */
  const setThumb: SetThumb = (next, index, base = latest.current) => {
    const moved = moveThumb(base, next, index, bounds);
    if (!moved) return undefined;
    const changed = !sameItems(moved.values, base);
    if (changed) {
      setUncontrolled(moved.values);
      onValueChange?.(moved.values);
    }
    return { ...moved, changed };
  };
  /**
   * A key or assistive action on thumb `focused` moving thumb `index`: it
   * commits at once, and focus follows the moved thumb when that is another
   * (one pushed past its neighbor takes its place; Home and End move the outer ones).
   */
  const keyMove = (next: number, index: number, focused = index) => {
    const moved = setThumb(next, index);
    if (!moved) return;
    if (moved.changed) onValueCommit?.(moved.values);
    if (moved.index !== focused) focusThumb(moved.index);
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
    disabled: isDisabled,
  });

  const nudge = (index: number, steps: number) =>
    keyMove(latest.current[index]! + steps * step, index);
  const onThumbKey = (index: number) => (event: WebKeyDownEvent) => {
    const { key, shiftKey } = event.nativeEvent;
    if (isDisabled) return;
    if (key === 'Home') keyMove(min, 0, index);
    else if (key === 'End') keyMove(max, latest.current.length - 1, index);
    else if (PAGE_KEYS.includes(key) || ARROW_KEYS.includes(key)) {
      const times = PAGE_KEYS.includes(key) || shiftKey ? 10 : 1;
      nudge(index, BACK_KEYS[from].includes(key) ? -times : times);
    } else return;
    event.preventDefault();
  };
  const onAction = (index: number) => (event: AccessibilityActionEvent) => {
    const { actionName } = event.nativeEvent;
    if (isDisabled) return;
    if (actionName === 'increment') nudge(index, 1);
    else if (actionName === 'decrement') nudge(index, -1);
  };

  // A Field label focuses the first thumb.
  const focusFirst = useCallback(() => {
    if (!isDisabled) focusThumb(0);
  }, [isDisabled, focusThumb]);
  useFieldControlRegistration(focusFirst);

  const fractions = values.map((value) => fractionIn(value, min, max));
  // Changes only with what places a mark, so marks don't re-render as the thumb slides.
  const markStyle = useMemo<MarkStyle>(
    () =>
      (value, offset = 0) =>
        placeAt(fractionIn(value, min, max), thumbSize, offset, from),
    [min, max, thumbSize, from],
  );
  const single = values.length === 1;
  const hitSlop = minTouchHitSlop(crossSize);
  // The web's pointer affordances, while it takes presses.
  const webLive = WEB && !isDisabled;
  const rangeStart = fractions[0]!;
  const rangeEnd = fractions[fractions.length - 1]!;
  return (
    <View
      ref={ref}
      {...rest}
      onLayout={onLayoutProp}
      hitSlop={vertical ? { left: hitSlop, right: hitSlop } : { top: hitSlop, bottom: hitSlop }}
      onStartShouldSetResponder={() => !isDisabled}
      onResponderTerminationRequest={() => false}
      onResponderGrant={slide.start}
      onResponderMove={slide.move}
      onResponderRelease={slide.end}
      onResponderTerminate={slide.end}
      {...(webLive ? WEB_KEEP_FOCUS : undefined)}
      style={[root, webLive ? WEB_SLIDER : undefined, style]}
      {...rnwAttrs(
        {
          'data-orientation': orientation,
          'data-disabled': isDisabled ? '' : undefined,
          'data-invalid': isInvalid ? 'true' : undefined,
        },
        rest,
      )}
    >
      <View pointerEvents="none" style={parts} onLayout={slide.measure}>
        <View style={track}>
          <View
            style={[
              range,
              // A single thumb's range starts at the track's edge, not at a thumb center.
              single ? { [from]: 0 } : placeAt(rangeStart, thumbSize, 0, from),
              placeAt(1 - rangeEnd, thumbSize, 0, FAR[from]),
            ]}
          />
        </View>
        {children === undefined ? null : (
          <View style={StyleSheet.absoluteFill}>
            <MarkContext.Provider value={markStyle}>{children}</MarkContext.Provider>
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
                // Its box centered on the point.
                placeAt(fractions[index]!, thumbSize, -thumbSize / 2, from),
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

(Slider as typeof Slider & { [fieldLabelAssociation]: FieldLabelAssociation })[
  fieldLabelAssociation
] = 'labelledby';

/** Places a mark at `value` on the slider, `offset` further along. */
type MarkStyle = (value: number, offset?: number) => ViewStyle;

const MarkContext = createContext<MarkStyle | null>(null);

/**
 * For a Slider's children: places a mark (a dot, a label, a scale) where the
 * thumb sits at `value`, in the slider's own units, size and direction.
 * `offset` moves it further along from `min`'s end; minus half the mark's
 * size centers it there: `markStyle(1500, -4)` centers an 8-wide dot on the
 * thumb at 1500. A position, so give the mark `position: 'absolute'`. Marks
 * lay out left to right in any app (see `mapSliderStyle`'s `parts`); a box
 * inside a mark can set `direction` to lay its own content out right to left.
 */
export function useSliderMarkStyle(): MarkStyle {
  const markStyle = useContext(MarkContext);
  if (!markStyle) throw new Error('useSliderMarkStyle must be used within a Slider\'s children');
  return markStyle;
}

type SetThumb = (
  next: number,
  index: number,
  base?: readonly number[],
) => { values: number[]; index: number; changed: boolean } | undefined;

interface SlideOptions {
  readonly vertical: boolean;
  readonly from: SliderEdge;
  readonly thumbSize: number;
  readonly bounds: SliderBounds;
  readonly latest: { readonly current: readonly number[] };
  readonly setThumb: SetThumb;
  readonly focusThumb: (index: number) => void;
  readonly onValueCommit: ((value: number[]) => void) | undefined;
  /** A slider disabled mid-drag takes no more of it. */
  readonly disabled: boolean;
}

/**
 * Dragging, through the responder system: a press brings the nearest thumb
 * there and focuses it (on the web), a move slides it, and the end commits
 * once if anything changed. The slider's parts take no touches, so the
 * press's location is the slider's own, less where its parts box starts
 * (past any padding or border); moves add the page distance from
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
  disabled,
}: SlideOptions) {
  // Where the parts box (which the thumbs are placed in) runs, along the
  // slide, from the slider's own top-left corner: inside any padding or border.
  const span = useRef({ start: 0, length: 0 });
  const sliding = useRef<{
    index: number;
    before: readonly number[];
    values: readonly number[];
    start: number;
    page: number;
  }>(undefined);
  const [active, setActive] = useState<number>();

  const offsetOf = ({ nativeEvent }: GestureResponderEvent) => {
    const location = vertical ? nativeEvent.locationY : nativeEvent.locationX;
    return {
      location: location - span.current.start,
      page: vertical ? nativeEvent.pageY : nativeEvent.pageX,
    };
  };
  const valueAt = (offset: number) => {
    const fraction = fractionAt(offset, span.current.length, thumbSize);
    // Offsets run from the top-left corner; the slide may start at the other edge.
    const fromMin = from === 'right' || from === 'bottom' ? 1 - fraction : fraction;
    return bounds.min + fromMin * (bounds.max - bounds.min);
  };

  return {
    active,
    measure: (event: LayoutChangeEvent) => {
      const { x, y, width, height } = event.nativeEvent.layout;
      span.current = vertical ? { start: y, length: height } : { start: x, length: width };
    },
    start: (event: GestureResponderEvent) => {
      const { location, page } = offsetOf(event);
      const value = valueAt(location);
      const before = latest.current;
      const nearest = nearestThumb(before, value);
      const moved = setThumb(value, nearest);
      const index = moved?.index ?? nearest;
      sliding.current = { index, before, values: moved?.values ?? before, start: location, page };
      setActive(index);
      if (WEB) focusThumb(index);
    },
    move: (event: GestureResponderEvent) => {
      const slide = sliding.current;
      if (!slide || disabled) return;
      const offset = slide.start + offsetOf(event).page - slide.page;
      const moved = setThumb(valueAt(offset), slide.index, slide.values);
      if (!moved) return;
      slide.values = moved.values;
      if (moved.index !== slide.index) {
        slide.index = moved.index;
        setActive(moved.index);
        // Thumbs are keyed by place, so focus follows the dragged one past its neighbor, as keys do.
        if (WEB) focusThumb(moved.index);
      }
    },
    end: () => {
      const slide = sliding.current;
      sliding.current = undefined;
      setActive(undefined);
      if (slide && !sameItems(slide.values, slide.before)) onValueCommit?.([...slide.values]);
    },
  };
}

const ACTIONS = [{ name: 'increment' }, { name: 'decrement' }] as const;

/**
 * Web only: a press keeps focus where it put it. The mousedown's default would
 * move focus off the thumb, focused as the press began (it takes no pointer),
 * to the nearest focusable box around it.
 */
const WEB_KEEP_FOCUS = {
  onMouseDown: (event: { preventDefault(): void }) => event.preventDefault(),
};

/** Web only: a pointer over it, no text selected or page scrolled by a drag. */
const WEB_SLIDER = { cursor: 'pointer', userSelect: 'none', touchAction: 'none' } as ViewStyle;
