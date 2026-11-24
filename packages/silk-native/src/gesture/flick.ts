import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { usePanGesture } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { gestureConventions } from './conventions.js';
import { crossPanning, panAlong, useReleaseTimer } from './drag.js';

export type FlickDirection = 'up' | 'down' | 'left' | 'right';

export interface FlickGestureConfig {
  /** The way the finger throws. */
  readonly direction: FlickDirection;
  /** The finger let go moving that way at least as fast as a fling (`gestureConventions.flingVelocity`). */
  readonly onFlick: () => void;
  readonly enabled?: boolean;
}

/** What a `GestureDetector` takes for a flick: spread it onto one. */
export interface FlickGesture {
  readonly gesture: ReturnType<typeof usePanGesture>;
  /** On the web, the browser's own panning the view leaves alone: across the flick's axis. */
  readonly touchAction: 'pan-x' | 'pan-y';
}

/**
 * A gesture for `GestureDetector` that calls `onFlick` when a finger throws
 * the view `direction`: it starts once the finger moves a touch slop along
 * that axis (one across it fails, so a scroll across keeps it), and counts
 * only a release at least Material's fling speed that way (a finger held
 * still before letting go has none). Nothing moves while it drags; taps and
 * holds on the view's children still work. The release is judged on the UI
 * thread and `onFlick` runs once, on the JavaScript thread. (Gesture
 * Handler's own `useFlingGesture` is a different gesture: it fires on a fast
 * move, before the finger lets go, and judges no speed at release.)
 *
 * On the web the view keeps the browser's scroll across the axis only: a
 * vertical flick area doesn't scroll the page when swiped up or down.
 *
 * ```tsx
 * const flick = useFlickGesture({ direction: 'up', onFlick: openSettings });
 * <GestureDetector {...flick}><Bar /></GestureDetector>
 * ```
 */
export function useFlickGesture({
  direction,
  onFlick,
  enabled = true,
}: FlickGestureConfig): FlickGesture {
  const vertical = direction === 'up' || direction === 'down';
  // Gesture Handler's speeds grow rightward and downward.
  const sign = direction === 'up' || direction === 'left' ? -1 : 1;
  const timer = useReleaseTimer();
  const latest = useRef(onFlick);
  useLayoutEffect(() => {
    latest.current = onFlick;
  });
  const [flicked] = useState(() => () => latest.current());
  const config = useMemo(
    () =>
      panAlong(vertical, {
        enabled,
        onActivate: () => {
          'worklet';
          timer.moved();
        },
        onUpdate: () => {
          'worklet';
          timer.moved();
        },
        onDeactivate: (event) => {
          'worklet';
          const speed = timer.speed(event.canceled, vertical ? event.velocityY : event.velocityX);
          if (sign * speed >= gestureConventions.flingVelocity) scheduleOnRN(flicked);
        },
      }),
    [vertical, enabled, sign, timer, flicked],
  );
  const gesture = usePanGesture(config);
  return { gesture, touchAction: crossPanning(vertical) };
}
