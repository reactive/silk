import { useLayoutEffect, useRef, useState } from 'react';
import { usePanGesture } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { gestureConventions } from './conventions.js';
import { panAlong, useReleaseTimer } from './drag.js';

export type FlingDirection = 'up' | 'down' | 'left' | 'right';

export interface FlingGestureConfig {
  /** The way the finger throws. */
  readonly direction: FlingDirection;
  /** The finger let go moving that way at least as fast as a fling (`gestureConventions.flingVelocity`). */
  readonly onFling: () => void;
  readonly enabled?: boolean;
}

/** What a `GestureDetector` takes for a fling: spread it onto one. */
export interface FlingGesture {
  readonly gesture: ReturnType<typeof usePanGesture>;
  /** On the web, the browser's own panning the view leaves alone: across the fling's axis. */
  readonly touchAction: 'pan-x' | 'pan-y';
}

/**
 * A gesture for `GestureDetector` that calls `onFling` when a finger throws
 * the view `direction`: it starts once the finger moves a touch slop along
 * that axis (one across it fails, so a scroll across keeps it), and counts
 * only a release at least Material's fling speed that way (a finger held
 * still before letting go has none). Nothing moves while it drags; taps and
 * holds on the view's children still work. The release is judged on the UI
 * thread and `onFling` runs once, on the JavaScript thread.
 *
 * On the web the view keeps the browser's scroll across the axis only: a
 * vertical fling area doesn't scroll the page when swiped up or down.
 *
 * ```tsx
 * const fling = useFlingGesture({ direction: 'up', onFling: openSettings });
 * <GestureDetector {...fling}><Bar /></GestureDetector>
 * ```
 */
export function useFlingGesture({
  direction,
  onFling,
  enabled = true,
}: FlingGestureConfig): FlingGesture {
  const vertical = direction === 'up' || direction === 'down';
  // Gesture Handler's speeds grow rightward and downward.
  const sign = direction === 'up' || direction === 'left' ? -1 : 1;
  const timer = useReleaseTimer();
  const latest = useRef(onFling);
  useLayoutEffect(() => {
    latest.current = onFling;
  });
  const [fling] = useState(() => () => latest.current());
  const gesture = usePanGesture(
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
        if (sign * speed >= gestureConventions.flingVelocity) scheduleOnRN(fling);
      },
    }),
  );
  return { gesture, touchAction: vertical ? 'pan-x' : 'pan-y' };
}
