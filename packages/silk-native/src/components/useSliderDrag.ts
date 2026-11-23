import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Insets, LayoutChangeEvent } from 'react-native';
import { useExclusiveGestures, usePanGesture, useTapGesture } from 'react-native-gesture-handler';
import {
  cancelAnimation,
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { gestureConventions, releaseVelocity } from '../gesture/conventions.js';
import { SUBPIXEL, springTo } from '../motion/springTo.js';
import { useMotionPreference } from '../styles/useReducedMotion.js';
import { useTheme } from '../theme/ThemeProvider.js';
import { WEB } from '../web/host.js';
import { sameItems } from './sameItems.js';
import {
  along,
  centerAt,
  FAR,
  fractionAt,
  fractionIn,
  placeAt,
  type SliderEdge,
  towardMax,
} from './sliderGeometry.js';
import { moveThumb, nearestThumb, reachable, type SliderBounds, snap } from './sliderValues.js';

const { touchSlop } = gestureConventions;

/** No thumb is moving on its own. */
const NONE = -1;

export interface SliderDragOptions {
  /** The values as React last rendered them. */
  readonly values: readonly number[];
  readonly bounds: SliderBounds;
  readonly vertical: boolean;
  readonly from: SliderEdge;
  readonly thumbSize: number;
  /** How far past each side across the slider a press still takes it. */
  readonly hitSlop: number;
  readonly disabled: boolean;
  /** A press or a slide changed the values: report them (`onValueChange`). */
  readonly onChange: (values: number[]) => void;
  /** A slide ended having changed them, or a tap did: `onValueCommit`. */
  readonly onCommit: (values: number[]) => void;
  /** A press or slide took thumb `index`, or the one it slides passed its neighbor. */
  readonly onHold: (index: number) => void;
}

/** What a slider's thumbs and range read to be drawn where the UI thread has them. */
export interface SliderTrack {
  /** Where the parts box runs along the slide, from the slider's top-left corner; 0 long until laid out. */
  readonly span: SharedValue<{ readonly start: number; readonly length: number }>;
  /** The values as the UI thread has them: ahead of React's while a slide reports them. */
  readonly placed: SharedValue<readonly number[]>;
  /** The place of the thumb drawn at `movingAt` instead of its value: held, or settling. */
  readonly moving: SharedValue<number>;
  /** Where the moving thumb is drawn, in the slider's units. */
  readonly movingAt: SharedValue<number>;
  readonly min: number;
  readonly max: number;
  readonly thumbSize: number;
  readonly from: SliderEdge;
}

export interface SliderDrag {
  readonly gesture: ReturnType<typeof useExclusiveGestures>;
  /** The thumb a press or slide holds. */
  readonly active: number | undefined;
  /** The slider's `hitSlop`, which its gestures take too. */
  readonly hitSlop: Insets;
  /** The parts box's `onLayout`. */
  readonly measure: (event: LayoutChangeEvent) => void;
  readonly track: SliderTrack;
}

/**
 * A slider's dragging, on the UI thread: the held thumb follows the finger
 * between its neighbors, and React hears only each change of value, as a
 * step is crossed. Let go, the thumb springs to the value it last reported
 * (`snappy`), keeping the finger's speed. A press takes the thumb nearest it.
 *
 * Native waits for the finger to move a touch slop along the slider before
 * it slides, so a scroll view around it keeps a scroll that starts on it, and
 * a press it lets go of without sliding is a tap: the thumb springs to its
 * value. On the web the page never scrolls from a slider, so a press takes
 * the thumb there at once and slides it from there, as Radix's does.
 *
 * Whatever moved the thumb last, a value React renders that differs from
 * the UI thread's applies once no finger holds it.
 */
export function useSliderDrag({
  values,
  bounds: { min, max, step, minSteps },
  vertical,
  from,
  thumbSize,
  hitSlop,
  disabled,
  onChange,
  onCommit,
  onHold,
}: SliderDragOptions): SliderDrag {
  const snappy = useTheme().theme.semantic.motion.snappy;
  const reduced = useMotionPreference() === 'reduced';
  const span = useSharedValue({ start: 0, length: 0 });
  const placed = useSharedValue<readonly number[]>(values);
  const moving = useSharedValue(NONE);
  const movingAt = useSharedValue(0);
  // A finger holds a thumb: React's values wait for its release.
  const dragging = useSharedValue(false);
  // The values when the slide began, so one that ends where it began commits nothing.
  const before = useSharedValue<readonly number[]>(values);
  // When the slide began or last moved (ms, on the UI thread): a held finger lets go at rest.
  const lastMoveAt = useSharedValue(0);

  const [active, setActive] = useState<number>();
  // JavaScript's view of the UI thread: the thumb a finger holds, and the values it last placed.
  const held = useRef<number>(undefined);
  const pushed = useRef(values);
  // The worklets call into React through these, made once; they read React's callbacks here.
  const latest = useRef({ onChange, onCommit, onHold });
  useLayoutEffect(() => {
    latest.current = { onChange, onCommit, onHold };
  });
  const [calls] = useState(() => ({
    /** A press or slide holds thumb `index`, having changed the values unless null. */
    slid: (next: number[] | null, index: number) => {
      if (next) latest.current.onChange(next);
      if (held.current === index) return;
      held.current = index;
      setActive(index);
      latest.current.onHold(index);
    },
    released: (now: number[], changed: boolean) => {
      held.current = undefined;
      pushed.current = now;
      setActive(undefined);
      if (changed) latest.current.onCommit(now);
    },
    tapped: (next: number[]) => {
      pushed.current = next;
      latest.current.onChange(next);
      latest.current.onCommit(next);
    },
  }));

  // React's values, once no finger holds a thumb; `active` reruns it as a slide ends,
  // so values an owner turned down come back.
  useLayoutEffect(() => {
    if (held.current !== undefined || sameItems(values, pushed.current)) return;
    pushed.current = values;
    placed.set(values);
  }, [values, active]);

  const slop = useMemo<Insets>(
    () => (vertical ? { left: hitSlop, right: hitSlop } : { top: hitSlop, bottom: hitSlop }),
    [vertical, hitSlop],
  );
  const configs = useMemo(() => {
    const bounds = { min, max, step, minSteps };
    // The slider's units per pixel along a slider `length` long.
    const perPixel = (length: number) => {
      'worklet';
      return (max - min) / Math.max(length - thumbSize, 1);
    };

    /** The value under a point on the slider (its own coordinates), or undefined before layout. */
    const valueAt = (x: number, y: number) => {
      'worklet';
      const { start, length } = span.get();
      if (length === 0) return undefined;
      return min + fractionAt((vertical ? y : x) - start, length, thumbSize, from) * (max - min);
    };
    /**
     * Moves thumb `index` to `at` and draws it there as far as it reaches;
     * returns where that thumb is now, and the values if they changed.
     */
    const slide = (at: number, index: number) => {
      'worklet';
      const now = placed.get();
      // Most moves stay within a step: no new values to work out.
      const moved = snap(at, bounds) === now[index] ? undefined : moveThumb(now, at, index, bounds);
      const changed = moved && !sameItems(moved.values, now) ? moved.values : null;
      if (changed) placed.set(changed);
      const place = moved?.index ?? index;
      moving.set(place);
      movingAt.set(reachable(placed.get(), at, place, bounds));
      return { place, changed };
    };
    /** Springs the moving thumb to its value at `velocity` (units per second), then lets it go. */
    const settle = (velocity: number) => {
      'worklet';
      const target = placed.get()[moving.get()]!;
      movingAt.set(
        springTo(
          target,
          snappy,
          {
            // Already there (held at a neighbor or a bound): it stays.
            velocity: movingAt.get() === target ? 0 : velocity,
            reduceMotion: reduced,
            precision: SUBPIXEL * perPixel(span.get().length),
          },
          (finished?: boolean) => {
            'worklet';
            if (finished) moving.set(NONE);
          },
        ),
      );
    };
    const start = (event: { x: number; y: number }) => {
      'worklet';
      const at = valueAt(event.x, event.y);
      if (at === undefined) return;
      cancelAnimation(movingAt);
      const base = placed.get();
      dragging.set(true);
      before.set(base);
      lastMoveAt.set(Date.now());
      const { place, changed } = slide(at, nearestThumb(base, at));
      scheduleOnRN(calls.slid, changed, place);
    };
    const update = (event: { x: number; y: number }) => {
      'worklet';
      if (!dragging.get()) return;
      const at = valueAt(event.x, event.y);
      if (at === undefined) return;
      lastMoveAt.set(Date.now());
      const was = moving.get();
      const { place, changed } = slide(at, was);
      if (changed || place !== was) scheduleOnRN(calls.slid, changed, place);
    };
    /** Lets go at `velocity` (px/s along the slider's axis). */
    const end = (velocity: number) => {
      'worklet';
      if (!dragging.get()) return;
      dragging.set(false);
      const speed = releaseVelocity(velocity, Date.now() - lastMoveAt.get());
      settle(towardMax(from) * speed * perPixel(span.get().length));
      const now = placed.get();
      scheduleOnRN(calls.released, [...now], !sameItems(now, before.get()));
    };
    /** Native: a press let go without sliding springs the nearest thumb to its value there. */
    const tap = (event: { x: number; y: number }) => {
      'worklet';
      const at = valueAt(event.x, event.y);
      if (at === undefined) return;
      const base = placed.get();
      const nearest = nearestThumb(base, at);
      const moved = moveThumb(base, at, nearest, bounds);
      if (!moved || sameItems(moved.values, base)) return;
      // From where it shows: still settling from a slide, or at its value.
      const shown = moving.get() === nearest ? movingAt.get() : base[nearest]!;
      cancelAnimation(movingAt);
      placed.set(moved.values);
      moving.set(moved.index);
      movingAt.set(shown);
      settle(0);
      scheduleOnRN(calls.tapped, moved.values);
    };
    const across = [-touchSlop, touchSlop] as [number, number];
    return {
      pan: {
        enabled: !disabled,
        hitSlop: slop,
        maxPointers: 1,
        ...(WEB
          ? { minDistance: 0, onBegin: start }
          : vertical
          ? { activeOffsetY: across, failOffsetX: across, onActivate: start }
          : { activeOffsetX: across, failOffsetY: across, onActivate: start }),
        onUpdate: update,
        onDeactivate: (event: { canceled: boolean; velocityX: number; velocityY: number }) => {
          'worklet';
          end(event.canceled ? 0 : vertical ? event.velocityY : event.velocityX);
        },
        // A web press that never moved ends here, without deactivating.
        onFinalize: () => {
          'worklet';
          end(0);
        },
      },
      tap: { enabled: !WEB && !disabled, hitSlop: slop, maxDistance: touchSlop, onActivate: tap },
    };
  }, [vertical, slop, disabled, min, max, step, minSteps, from, thumbSize, snappy, reduced]);

  const gesture = useExclusiveGestures(usePanGesture(configs.pan), useTapGesture(configs.tap));
  const track = useMemo(
    () => ({ span, placed, moving, movingAt, min, max, thumbSize, from }),
    [min, max, thumbSize, from],
  );
  return {
    gesture,
    active,
    hitSlop: slop,
    measure: (event) => {
      const { x, y, width, height } = event.nativeEvent.layout;
      span.set(vertical ? { start: y, length: height } : { start: x, length: width });
    },
    track,
  };
}

/** Where thumb `place` is drawn: at `heldAt` if it is the moving one (`held`), else at its value. */
function shownAt(values: readonly number[], held: number, heldAt: number, place: number): number {
  'worklet';
  return held === place ? heldAt : values[place]!;
}

/**
 * Where the range runs on a slider laid out `length` long, in pixels from
 * `min`'s edge: from the first thumb's center (the edge, for a single thumb)
 * to the last's.
 */
function rangeEdges(
  values: readonly number[],
  held: number,
  heldAt: number,
  length: number,
  min: number,
  max: number,
  thumbSize: number,
): { start: number; end: number } {
  'worklet';
  const last = values.length - 1;
  const center = (place: number) =>
    centerAt(fractionIn(shownAt(values, held, heldAt, place), min, max), length, thumbSize);
  return { start: last > 0 ? center(0) : 0, end: center(last) };
}

type AnimatedStyle = ReturnType<typeof useAnimatedStyle>;

// Each derived value and style reads its shared values in its own body: Reanimated reruns one
// only for those. Dependency arrays let a web build without the worklets Babel plugin run them;
// native warns on them. A transform reads a derived number, so a frame that leaves that number
// where it was sends the view nothing.

/**
 * The thumb at `place`, where the UI thread draws it. Until the slider is
 * laid out (on a server, too) it sits by percent, as `placeAt` places it;
 * then at the edge `min` sits at, moved along by a transform, so following
 * the finger lays nothing out.
 */
export function useThumbMotion(
  { span, placed, moving, movingAt, min, max, thumbSize, from }: SliderTrack,
  place: number,
): readonly [placement: AnimatedStyle, motion: AnimatedStyle] {
  // Before layout nothing slides, so the placement follows the values alone.
  const placement = useAnimatedStyle(
    () => {
      const fraction = span.get().length > 0 ? 0 : fractionIn(placed.get()[place]!, min, max);
      return placeAt(fraction, thumbSize, -thumbSize / 2, from);
    },
    WEB ? [span, placed, place, min, max, thumbSize, from] : undefined,
  );
  const offset = useDerivedValue(
    () => {
      const { length } = span.get();
      if (length === 0) return 0;
      const value = shownAt(placed.get(), moving.get(), movingAt.get(), place);
      return centerAt(fractionIn(value, min, max), length, thumbSize) - thumbSize / 2;
    },
    WEB ? [span, placed, moving, movingAt, place, min, max, thumbSize] : undefined,
  );
  const motion = useAnimatedStyle(
    () => along(from, offset.get()),
    WEB ? [offset, from] : undefined,
  );
  return [placement, motion];
}

/**
 * The range, where the UI thread draws the thumbs. Until laid out, `bar`
 * sits by percent; then `clip` (filling the track, clipping) starts at the
 * range's start and `bar` (as long as the track) ends at its end, both moved
 * by transforms.
 */
export function useRangeMotion({
  span,
  placed,
  moving,
  movingAt,
  min,
  max,
  thumbSize,
  from,
}: SliderTrack): {
  readonly clip: AnimatedStyle;
  readonly bar: readonly [placement: AnimatedStyle, motion: AnimatedStyle];
} {
  const placement = useAnimatedStyle(
    () => {
      const values = placed.get();
      if (span.get().length > 0) return FILL;
      const last = values.length - 1;
      return {
        ...FILL,
        // A single thumb's range starts at the track's edge, not at a thumb center.
        ...(last === 0 ? {} : placeAt(fractionIn(values[0]!, min, max), thumbSize, 0, from)),
        ...placeAt(1 - fractionIn(values[last]!, min, max), thumbSize, 0, FAR[from]),
      };
    },
    WEB ? [span, placed, min, max, thumbSize, from] : undefined,
  );
  const deps = WEB ? [span, placed, moving, movingAt, min, max, thumbSize] : undefined;
  const start = useDerivedValue(() => {
    const { length } = span.get();
    if (length === 0) return 0;
    return rangeEdges(placed.get(), moving.get(), movingAt.get(), length, min, max, thumbSize)
      .start;
  }, deps);
  // How far back from the track's far end the bar ends, at the range's end.
  const shift = useDerivedValue(() => {
    const { length } = span.get();
    if (length === 0) return 0;
    const edges = rangeEdges(
      placed.get(),
      moving.get(),
      movingAt.get(),
      length,
      min,
      max,
      thumbSize,
    );
    return edges.end - edges.start - length;
  }, deps);
  const clip = useAnimatedStyle(() => along(from, start.get()), WEB ? [start, from] : undefined);
  const motion = useAnimatedStyle(() => along(from, shift.get()), WEB ? [shift, from] : undefined);
  return { clip, bar: [placement, motion] };
}

/** The range's bar along the whole track, margins cleared of any percent placement. */
const FILL = {
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  marginLeft: 0,
  marginRight: 0,
  marginTop: 0,
  marginBottom: 0,
};
