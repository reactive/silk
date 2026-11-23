import { useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { Insets, LayoutChangeEvent } from 'react-native';
import { useExclusiveGestures, usePanGesture, useTapGesture } from 'react-native-gesture-handler';
import { cancelAnimation, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import { gestureConventions, releaseVelocity } from '../gesture/conventions.js';
import { SUBPIXEL, springTo } from '../motion/springTo.js';
import { useMotionPreference } from '../styles/useReducedMotion.js';
import { useTheme } from '../theme/ThemeProvider.js';
import { WEB } from '../web/host.js';
import { sameItems } from './sameItems.js';
import { fractionAt, type SliderEdge, towardMax, travel } from './sliderGeometry.js';
import { NONE, type SliderTrack } from './sliderMotion.js';
import {
  clampToNeighbors,
  moveThumb,
  nearestThumb,
  type SliderBounds,
  snap,
} from './sliderValues.js';

const { touchSlop } = gestureConventions;

export interface SliderDragOptions {
  /** The values as React last rendered them. */
  readonly values: readonly number[];
  readonly bounds: SliderBounds;
  readonly vertical: boolean;
  readonly from: SliderEdge;
  readonly thumbSize: number;
  /** How far past each side across the slider a press still takes it. */
  readonly crossSlop: number;
  readonly disabled: boolean;
  /** A press or a slide changed the values: report them (`onValueChange`). */
  readonly onChange: (values: number[]) => void;
  /** A slide ended having changed them, or a tap did: `onValueCommit`. */
  readonly onCommit: (values: number[]) => void;
  /** A press or slide took thumb `index`, or the one it slides passed its neighbor. */
  readonly onHold: (index: number) => void;
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
  crossSlop,
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

  // The held thumb, rendered (`data-active`); `held` is the same thumb, read at once by the calls below.
  const [active, setActive] = useState<number>();
  // Counts taps, which, unlike a slide's release, change no other state.
  const [taps, countTap] = useReducer((n: number) => n + 1, 0);
  // JavaScript's view of the UI thread: the thumb a finger holds, and the values it last placed.
  const held = useRef<number>(undefined);
  const pushed = useRef(values);
  // The worklets call into React through these, made once; they read React's callbacks here.
  const latest = useRef({ onChange, onCommit, onHold });
  useLayoutEffect(() => {
    latest.current = { onChange, onCommit, onHold };
  });
  const [calls] = useState(() => ({
    /** A finger holds thumb `index`, having moved the values to `next` unless null. */
    holding: (next: number[] | null, index: number) => {
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
      countTap();
      latest.current.onChange(next);
      latest.current.onCommit(next);
    },
  }));

  const slop = useMemo<Insets>(
    () =>
      vertical
        ? { left: crossSlop, right: crossSlop }
        : { top: crossSlop, bottom: crossSlop },
    [vertical, crossSlop],
  );
  const configs = useMemo(() => {
    const bounds = { min, max, step, minSteps };
    // The slider's units per pixel along a slider `length` long.
    const perPixel = (length: number) => {
      'worklet';
      return (max - min) / Math.max(travel(length, thumbSize), 1);
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
      movingAt.set(clampToNeighbors(placed.get(), at, place, bounds));
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
      scheduleOnRN(calls.holding, changed, place);
    };
    const update = (event: { x: number; y: number }) => {
      'worklet';
      if (!dragging.get()) return;
      const at = valueAt(event.x, event.y);
      if (at === undefined) return;
      lastMoveAt.set(Date.now());
      const was = moving.get();
      const { place, changed } = slide(at, was);
      if (changed || place !== was) scheduleOnRN(calls.holding, changed, place);
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
    /**
     * Takes values from React. A thumb still settling springs on from where
     * it shows to its new value, so a value an owner turned down never shows.
     */
    const adopt = (next: readonly number[]) => {
      'worklet';
      if (dragging.get()) return;
      const was = placed.get();
      placed.set(next);
      const place = moving.get();
      // Still heading to its value: the spring keeps its speed.
      if (place === NONE || next[place] === was[place]) return;
      if (place < next.length) settle(0);
      else {
        cancelAnimation(movingAt);
        moving.set(NONE);
      }
    };
    const across = [-touchSlop, touchSlop] as [number, number];
    return {
      adopt,
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

  // React's values, once no finger holds a thumb; `active` reruns it as a slide ends and
  // `taps` after a tap, so values an owner turned down come back.
  useLayoutEffect(() => {
    if (held.current !== undefined || sameItems(values, pushed.current)) return;
    pushed.current = values;
    scheduleOnUI(configs.adopt, values);
  }, [values, active, taps, configs]);

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
