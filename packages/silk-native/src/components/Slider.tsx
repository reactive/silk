import { sliderRecipe, type SliderVariantProps } from '@reactive/silk-core';
import {
  type ComponentRef,
  createContext,
  useCallback,
  useContext,
  memo,
  useMemo,
  useRef,
  type JSX,
  type ReactNode,
  type Ref,
} from 'react';
import {
  I18nManager,
  StyleSheet,
  View,
  type AccessibilityActionEvent,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
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
import { fractionIn, PHYSICAL_FRAME, placeAt, type SliderEdge, slideFrom } from './sliderGeometry.js';
import { moveThumb, type SliderBounds } from './sliderValues.js';
import { useControllableValue } from './useControllableValue.js';
import { type SliderTrack, useRangeMotion, useSliderDrag, useThumbMotion } from './useSliderDrag.js';
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

/**
 * Picks one number, or several (a range), by sliding a thumb along a track:
 * web `Slider`'s contract (Radix's), with one number per thumb. Drag a thumb,
 * or press the track to bring the nearest thumb there; on the web, the arrow
 * keys move a focused thumb a step (ten with Shift, or Page Up and Page
 * Down), and Home and End send the first thumb to `min` and the last to
 * `max`, as Radix does. Assistive technology adjusts each thumb a step at a
 * time. A drag runs on the UI thread (`useSliderDrag`): the thumb follows the
 * finger from the values it last reported, and commits those on release; a
 * controlled `value` that differs applies again once the drag ends.
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
  // Memoized: a drag re-renders the slider on every step, and its styles don't change with the values.
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

  const thumbs = useRef<(Thumb | null)[]>([]);
  const focusThumb = useCallback((index: number) => thumbs.current[index]?.focus(), []);

  const report = (next: number[]) => {
    setUncontrolled(next);
    onValueChange?.(next);
  };
  /**
   * A key or assistive action on thumb `focused` moving thumb `index` of the
   * rendered values: it reports and commits at once, and focus follows the
   * moved thumb when that is another (one pushed past its neighbor takes its
   * place; Home and End move the outer ones).
   */
  const keyMove = (next: number, index: number, focused = index) => {
    const moved = moveThumb(values, next, index, bounds);
    if (!moved) return;
    if (!sameItems(moved.values, values)) {
      report(moved.values);
      onValueCommit?.(moved.values);
    }
    if (moved.index !== focused) focusThumb(moved.index);
  };

  const drag = useSliderDrag({
    values,
    bounds,
    vertical,
    from,
    thumbSize,
    hitSlop: minTouchHitSlop(crossSize),
    disabled: isDisabled,
    onChange: report,
    onCommit: (next) => onValueCommit?.(next),
    // Thumbs are keyed by place, so focus follows the held one past its neighbor, as keys do.
    onHold: (index) => {
      if (WEB) focusThumb(index);
    },
  });

  const nudge = (index: number, steps: number) =>
    keyMove(values[index]! + steps * step, index);
  const onThumbKey = (index: number) => (event: WebKeyDownEvent) => {
    const { key, shiftKey } = event.nativeEvent;
    if (isDisabled) return;
    if (key === 'Home') keyMove(min, 0, index);
    else if (key === 'End') keyMove(max, values.length - 1, index);
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

  // Changes only with what places a mark, so marks don't re-render as the thumb slides.
  const markStyle = useMemo<MarkStyle>(
    () =>
      (value, offset = 0) =>
        placeAt(fractionIn(value, min, max), thumbSize, offset, from),
    [min, max, thumbSize, from],
  );
  const single = values.length === 1;
  // The web's pointer affordances, while it takes presses.
  const webLive = WEB && !isDisabled;
  // Across the slider, a thumb's box sits centered.
  const thumbBox = useMemo<ViewStyle>(
    () => ({
      position: 'absolute',
      width: thumbSize,
      height: thumbSize,
      ...(vertical
        ? { left: '50%', marginLeft: -thumbSize / 2 }
        : { top: '50%', marginTop: -thumbSize / 2 }),
    }),
    [thumbSize, vertical],
  );
  return (
    <GestureDetector gesture={drag.gesture}>
      <View
        ref={ref}
        {...rest}
        hitSlop={drag.hitSlop}
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
        <View pointerEvents="none" style={[parts, PHYSICAL_FRAME]} onLayout={drag.measure}>
          <View style={[track, styles.clip]}>
            <Range track={drag.track} style={range} />
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
              <ThumbBox key={index} track={drag.track} place={index} style={thumbBox}>
                <Pressable
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
                    'data-active': drag.active === index ? '' : undefined,
                  })}
                  style={thumb}
                />
              </ThumbBox>
            );
          })}
        </View>
      </View>
    </GestureDetector>
  );
}

/** A thumb's box, where the UI thread draws the thumb at `place`. */
function ThumbBox({
  track,
  place,
  style,
  children,
}: {
  readonly track: SliderTrack;
  readonly place: number;
  readonly style: ViewStyle;
  readonly children: ReactNode;
}): JSX.Element {
  const [placement, motion] = useThumbMotion(track, place);
  return <Animated.View style={[style, placement, motion]}>{children}</Animated.View>;
}

/** The range between the thumbs, as the UI thread draws them, in a track that clips it; it renders only as its track or style change. */
const Range = memo(function Range({
  track,
  style,
}: {
  readonly track: SliderTrack;
  readonly style: ViewStyle;
}): JSX.Element {
  const { clip, bar } = useRangeMotion(track);
  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.clip, clip]}>
      <Animated.View style={[style, ...bar]} />
    </Animated.View>
  );
});

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
 * lay out left to right in any app (see `PHYSICAL_FRAME`); a box
 * inside a mark can set `direction` to lay its own content out right to left.
 */
export function useSliderMarkStyle(): MarkStyle {
  const markStyle = useContext(MarkContext);
  if (!markStyle) throw new Error('useSliderMarkStyle must be used within a Slider\'s children');
  return markStyle;
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

const styles = StyleSheet.create({ clip: { overflow: 'hidden' } });
