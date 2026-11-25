/**
 * A Slider's thumbs as the UI thread has them, and the only code that moves
 * them: a finger holding one, a release or a tap springing one to its step,
 * and React's values arriving. It keeps one rule for all of them: `movingAt`
 * means something only while `moving` names a thumb, held or springing to
 * `placed[moving]`.
 */
import type { Spring } from '@reactive/silk-core';
import { useMemo } from 'react';
import { cancelAnimation, type SharedValue, useSharedValue } from 'react-native-reanimated';
import { springTo } from '../motion/springTo.js';
import { SUBPIXEL } from '../motion/subpixel.js';
import { sameItems } from './sameItems.js';
import { type SliderScale, towardMax, unitsPerPixel, valueAt } from './sliderGeometry.js';
import {
  clampToNeighbors,
  moveThumb,
  nearestThumb,
  type SliderBounds,
  snap,
} from './sliderValues.js';

/** No thumb is moving on its own: each is drawn at its value. */
const NONE = -1;

/** A slider's thumbs as the UI thread has them, which its drawing reads. */
export interface SliderTrack {
  /** Where the parts box runs along the slide, from the slider's top-left corner; 0 long until laid out. */
  readonly span: SharedValue<{ readonly start: number; readonly length: number }>;
  /** The values as the UI thread has them: ahead of React's while a slide reports them. */
  readonly placed: SharedValue<readonly number[]>;
  /** The place of the thumb drawn at `movingAt` instead of its value (held, or settling), or none. */
  readonly moving: SharedValue<number>;
  /** Where the moving thumb is drawn, in the slider's units. */
  readonly movingAt: SharedValue<number>;
  readonly scale: SliderScale;
}

/** The shared values of a slider's thumbs, starting at `values`; `scale` is memoized by the caller. */
export function useSliderTrack(values: readonly number[], scale: SliderScale): SliderTrack {
  const span = useSharedValue({ start: 0, length: 0 });
  const placed = useSharedValue<readonly number[]>(values);
  const moving = useSharedValue(NONE);
  const movingAt = useSharedValue(0);
  return useMemo(
    () => ({ span, placed, moving, movingAt, scale }),
    [span, placed, moving, movingAt, scale],
  );
}

/**
 * Thumb `place`'s value. A thumb React renders before the UI thread has its
 * value (the owner just added it) sits at `min` until it does.
 */
export function valueOf(values: readonly number[], place: number, min: number): number {
  'worklet';
  return values[place] ?? min;
}

/** Where thumb `place` is drawn: at `movingAt` if `moving` names it, else at its value. */
export function shownAt(
  values: readonly number[],
  moving: number,
  movingAt: number,
  place: number,
  min: number,
): number {
  'worklet';
  return moving === place ? movingAt : valueOf(values, place, min);
}

/** A held thumb's move: where it is now, and the values if they changed. */
export interface ThumbHold {
  readonly place: number;
  readonly changed: number[] | null;
}

/** How a thumb springs to its step: the theme's spring, and whether motion is reduced. */
export interface ThumbSpring {
  readonly spring: Spring;
  readonly reduced: boolean;
}

/** The worklets that move a slider's thumbs; see the module's doc. */
export interface SliderThumbs {
  /** The value at `point` along the slider (its own coordinates), or undefined before layout. */
  readonly valueAt: (point: number) => number | undefined;
  /** A finger takes the thumb nearest `at`, stopping it if it was settling, and holds it there. */
  readonly grab: (at: number) => ThumbHold;
  /** The held thumb follows the finger to `at`; null if no value or place changed. */
  readonly hold: (at: number) => ThumbHold | null;
  /** The finger lets go at `pxPerSecond` (screen axis): the thumb springs to its step. Returns the values. */
  readonly release: (pxPerSecond: number) => readonly number[];
  /** The thumb nearest `at` springs to its step there; returns the values, or null if none changed. */
  readonly jumpTo: (at: number) => number[] | null;
  /**
   * Takes React's values, unless the thumbs moved since `expected` (what
   * JavaScript last heard): the gesture that moved them reports its own. A
   * thumb still settling springs on to its new value, at its speed if that
   * heads there.
   */
  readonly adopt: (next: readonly number[], expected: readonly number[]) => void;
}

export function sliderThumbs(
  { span, placed, moving, movingAt, scale }: SliderTrack,
  bounds: SliderBounds,
  { spring, reduced }: ThumbSpring,
): SliderThumbs {
  /**
   * Springs the moving thumb to its value, then lets it go. It keeps
   * `velocity` (units per second; by default the speed of the spring it
   * replaces) only when that heads to the value, and stops there rather than
   * passing it, so it stays between where it was and its value, never off
   * the track.
   */
  const settle = (velocity?: number) => {
    'worklet';
    movingAt.set(
      springTo(
        placed.get()[moving.get()]!,
        spring,
        {
          ...(velocity === undefined ? null : { velocity }),
          speedAway: 'drop',
          overshootClamping: true,
          reduceMotion: reduced,
          precision: SUBPIXEL * unitsPerPixel(span.get().length, scale),
        },
        (finished?: boolean) => {
          'worklet';
          if (finished) moving.set(NONE);
        },
      ),
    );
  };
  /** Moves thumb `index` to `at` and draws it there as far as it reaches. */
  const slide = (at: number, index: number): ThumbHold => {
    'worklet';
    const now = placed.get();
    // Most moves stay within a step: no new values to work out.
    const moved = snap(at, bounds) === now[index] ? undefined : moveThumb(now, at, index, bounds);
    const changed = moved && !sameItems(moved.values, now) ? moved.values : null;
    if (changed) placed.set(changed);
    const place = moved?.index ?? index;
    moving.set(place);
    movingAt.set(clampToNeighbors(changed ?? now, at, place, bounds));
    return { place, changed };
  };
  return {
    valueAt: (point) => {
      'worklet';
      const { start, length } = span.get();
      return length === 0 ? undefined : valueAt(point - start, length, scale);
    },
    grab: (at) => {
      'worklet';
      cancelAnimation(movingAt);
      return slide(at, nearestThumb(placed.get(), at));
    },
    hold: (at) => {
      'worklet';
      const was = moving.get();
      const held = slide(at, was);
      return held.changed || held.place !== was ? held : null;
    },
    release: (pxPerSecond) => {
      'worklet';
      settle(towardMax(scale.from) * pxPerSecond * unitsPerPixel(span.get().length, scale));
      return placed.get();
    },
    jumpTo: (at) => {
      'worklet';
      const base = placed.get();
      const nearest = nearestThumb(base, at);
      const moved = moveThumb(base, at, nearest, bounds);
      if (!moved || sameItems(moved.values, base)) return null;
      // From where it shows: still settling from a slide, or at its value.
      const shown = moving.get() === nearest ? movingAt.get() : base[nearest]!;
      cancelAnimation(movingAt);
      placed.set(moved.values);
      moving.set(moved.index);
      movingAt.set(shown);
      settle(0);
      return moved.values;
    },
    adopt: (next, expected) => {
      'worklet';
      const was = placed.get();
      if (!sameItems(was, expected)) return;
      placed.set(next);
      const place = moving.get();
      if (place === NONE) return;
      // Still heading to its value: the spring is left as it is.
      if (next[place] === was[place]) return;
      if (place < next.length) settle();
      else {
        cancelAnimation(movingAt);
        moving.set(NONE);
      }
    },
  };
}
