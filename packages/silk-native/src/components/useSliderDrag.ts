import { useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { Insets, LayoutChangeEvent } from 'react-native';
import { useExclusiveGestures, usePanGesture, useTapGesture } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import { gestureConventions } from '../gesture/conventions.js';
import { panAlong, useReleaseTimer } from '../gesture/drag.js';
import { useMotionPreference } from '../styles/useReducedMotion.js';
import { useTheme } from '../theme/ThemeProvider.js';
import { WEB } from '../web/host.js';
import { sameItems } from './sameItems.js';
import type { SliderEdge, SliderScale } from './sliderGeometry.js';
import { sliderThumbs, type SliderTrack, useSliderTrack } from './sliderThumbs.js';
import type { SliderBounds } from './sliderValues.js';

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
  const scale = useMemo<SliderScale>(
    () => ({ min, max, thumbSize, from }),
    [min, max, thumbSize, from],
  );
  const track = useSliderTrack(values, scale);
  // A finger holds a thumb: React's values wait for its release.
  const dragging = useSharedValue(false);
  // The values when the slide began, so one that ends where it began commits nothing.
  const before = useSharedValue<readonly number[]>(values);
  const timer = useReleaseTimer();

  // The held thumb, rendered (`data-active`); `held` is the same thumb, read at once by the calls below.
  const [active, setActive] = useState<number>();
  // Counts releases, a tap's included. A tap changes no other state, and a slide's hold and
  // release can land in one render, leaving `active` as it was.
  const [releases, countRelease] = useReducer((n: number) => n + 1, 0);
  // JavaScript's view of the UI thread: the thumb a finger holds, and the values it last
  // placed. Every gesture that writes the UI thread's values reports them here (`released`,
  // `tapped`), so `pushed` matches them again once no report is on its way; until then
  // `adopt` refuses React's values, and the report's rerun sends them again.
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
      countRelease();
      if (changed) latest.current.onCommit(now);
    },
    tapped: (next: number[]) => {
      pushed.current = next;
      countRelease();
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
    const { valueAt, grab, hold, release, jumpTo, adopt } = sliderThumbs(
      track,
      { min, max, step, minSteps },
      { spring: snappy, reduced },
    );
    const { placed } = track;
    const { holding, released, tapped } = calls;
    /** The value under the finger, along the slider's axis; undefined before layout. */
    const valueUnder = (event: { x: number; y: number }) => {
      'worklet';
      return valueAt(vertical ? event.y : event.x);
    };
    const start = (event: { x: number; y: number }) => {
      'worklet';
      const at = valueUnder(event);
      if (at === undefined) return;
      dragging.set(true);
      before.set(placed.get());
      timer.moved();
      const { place, changed } = grab(at);
      scheduleOnRN(holding, changed, place);
    };
    const update = (event: { x: number; y: number }) => {
      'worklet';
      if (!dragging.get()) return;
      const at = valueUnder(event);
      if (at === undefined) return;
      timer.moved();
      const held = hold(at);
      if (held) scheduleOnRN(holding, held.changed, held.place);
    };
    /** Lets go at `velocity` (px/s along the slider's axis). */
    const end = (velocity: number) => {
      'worklet';
      if (!dragging.get()) return;
      dragging.set(false);
      const now = release(velocity);
      scheduleOnRN(released, [...now], !sameItems(now, before.get()));
    };
    /** Native: a press let go without sliding springs the nearest thumb to its value there. */
    const tap = (event: { x: number; y: number }) => {
      'worklet';
      const at = valueUnder(event);
      if (at === undefined) return;
      const next = jumpTo(at);
      if (next) scheduleOnRN(tapped, next);
    };
    return {
      /** React's values, unless a finger holds a thumb (see `SliderThumbs.adopt`). */
      adopt: (next: readonly number[], expected: readonly number[]) => {
        'worklet';
        if (!dragging.get()) adopt(next, expected);
      },
      pan: {
        enabled: !disabled,
        hitSlop: slop,
        ...(WEB
          ? { maxPointers: 1, minDistance: 0, onBegin: start }
          : { ...panAlong(vertical), onActivate: start }),
        onUpdate: update,
        onDeactivate: (event: { canceled: boolean; velocityX: number; velocityY: number }) => {
          'worklet';
          end(timer.speed(event.canceled, vertical ? event.velocityY : event.velocityX));
        },
        // A web press that never moved ends here, without deactivating.
        onFinalize: () => {
          'worklet';
          end(0);
        },
      },
      tap: {
        enabled: !WEB && !disabled,
        hitSlop: slop,
        maxDistance: gestureConventions.touchSlop,
        onActivate: tap,
      },
    };
  }, [track, vertical, slop, disabled, min, max, step, minSteps, snappy, reduced]);

  // React's values, once no finger holds a thumb; `releases` reruns it after each release
  // and tap, so values an owner turned down come back. (`configs` only changes with the
  // slider's props, when `values` likely match already.)
  useLayoutEffect(() => {
    if (held.current !== undefined || sameItems(values, pushed.current)) return;
    scheduleOnUI(configs.adopt, values, pushed.current);
    pushed.current = values;
  }, [values, releases, configs]);

  const gesture = useExclusiveGestures(usePanGesture(configs.pan), useTapGesture(configs.tap));
  return {
    gesture,
    active,
    hitSlop: slop,
    measure: (event) => {
      const { x, y, width, height } = event.nativeEvent.layout;
      track.span.set(vertical ? { start: y, length: height } : { start: x, length: width });
    },
    track,
  };
}
