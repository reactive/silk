/**
 * What every silk drag along one axis shares: when it starts, and the speed
 * it lets go at. The numbers are `conventions.ts`'s; this is their use.
 */
import { useMemo } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { gestureConventions, releaseVelocity } from './conventions.js';

const SLOP: [number, number] = [-gestureConventions.touchSlop, gestureConventions.touchSlop];

/**
 * A one-finger pan's config along one axis: it starts once the finger moves
 * a touch slop along it, and fails on one across, so a scroll view across it
 * keeps a scroll that starts on it.
 */
export function panAlong(
  vertical: boolean,
):
  | { activeOffsetY: [number, number]; failOffsetX: [number, number]; maxPointers: 1 }
  | { activeOffsetX: [number, number]; failOffsetY: [number, number]; maxPointers: 1 } {
  return vertical
    ? { activeOffsetY: SLOP, failOffsetX: SLOP, maxPointers: 1 }
    : { activeOffsetX: SLOP, failOffsetY: SLOP, maxPointers: 1 };
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
