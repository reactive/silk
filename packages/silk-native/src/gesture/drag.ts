/**
 * What every silk drag along one axis shares: when it starts, and the speed
 * it lets go at. The numbers are `conventions.ts`'s; this is their use.
 */
import { useMemo } from 'react';
import type { PanGestureConfig } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { swallowDragClick, WEB } from '../web/host.js';
import { gestureConventions, releaseVelocity } from './conventions.js';

const SLOP: [number, number] = [-gestureConventions.touchSlop, gestureConventions.touchSlop];

/** What `panAlong` sets itself. */
type OwnKeys =
  | 'activeOffsetX'
  | 'activeOffsetY'
  | 'failOffsetX'
  | 'failOffsetY'
  | 'maxPointers'
  | 'touchAction';

/**
 * `config` as a one-finger pan along one axis: it starts once the finger moves
 * a touch slop along it, and fails on one across, so a scroll view across it
 * keeps a scroll that starts on it. On the web, it leaves the browser its
 * panning across the axis (a disabled pan, all of it), and a mouse drag that
 * began on a pressable doesn't also press it. Its callbacks say 'worklet'
 * themselves.
 *
 * The touch-action rides in the config, not on the `GestureDetector`: Gesture
 * Handler applies a config after the detector attaches it, and drops the
 * detector's value when it does.
 *
 * It merges here, not by a spread at the call: the worklets Babel plugin reads
 * an object written for a gesture hook, and throws on a spread in it.
 */
export function panAlong(
  vertical: boolean,
  config: Omit<PanGestureConfig, OwnKeys>,
): PanGestureConfig {
  const { onDeactivate } = config;
  const guarded: Omit<PanGestureConfig, OwnKeys> = {
    ...config,
    onDeactivate: (event) => {
      'worklet';
      if (WEB) scheduleOnRN(swallowDragClick);
      onDeactivate?.(event);
    },
  };
  const axis = vertical
    ? { activeOffsetY: SLOP, failOffsetX: SLOP, touchAction: 'pan-x' as const }
    : { activeOffsetX: SLOP, failOffsetY: SLOP, touchAction: 'pan-y' as const };
  return { ...guarded, ...axis, maxPointers: 1 };
}

export interface ReleaseTimer {
  /** The drag started or moved (call from its worklets). */
  readonly moved: () => void;
  /** The speed it lets go at: none if canceled, or if the finger had stopped (`releaseVelocity`). */
  readonly speed: (canceled: boolean, velocity: number) => number;
}

/** Times a drag's moves on the UI thread, for the speed it lets go at. */
export function useReleaseTimer(): ReleaseTimer {
  const lastMoveAt = useSharedValue(0);
  return useMemo(
    () => ({
      moved: () => {
        'worklet';
        lastMoveAt.set(Date.now());
      },
      speed: (canceled, velocity) => {
        'worklet';
        return canceled ? 0 : releaseVelocity(velocity, Date.now() - lastMoveAt.get());
      },
    }),
    [lastMoveAt],
  );
}
