import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { I18nManager } from 'react-native';
import { usePanGesture } from 'react-native-gesture-handler';
import { cancelAnimation, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnUI } from 'react-native-worklets';
import { crossPanning, panAlong, useReleaseTimer } from '../gesture/drag.js';
import { springTo } from '../motion/springTo.js';
import { SUBPIXEL } from '../motion/subpixel.js';
import { useTheme } from '../theme/ThemeProvider.js';
import { WEB } from '../web/host.js';
import { switchDragPosition, switchLandsOn } from './switchPhysics.js';
import { useOwnerReports } from './useOwnerReports.js';

export interface SwitchDragOptions {
  /** The state React last rendered. */
  readonly checked: boolean;
  /** How far the thumb moves from off to on, in points. */
  readonly travel: number;
  readonly disabled: boolean;
  readonly reduced: boolean;
  /** How far past its box a press still takes the switch, which its drag takes too. */
  readonly hitSlop: number;
  /** A release landed on the other side: the switch turns to `checked`. */
  readonly onLand: (checked: boolean) => void;
}

export interface SwitchDrag {
  readonly pan: ReturnType<typeof usePanGesture>;
  /** On the web, the browser's own panning the switch leaves to it (`GestureDetector`'s). */
  readonly touchAction: 'pan-x' | 'pan-y';
  /** Moves the thumb to where the UI thread has it. */
  readonly thumbMotion: ReturnType<typeof useAnimatedStyle>;
  /**
   * Turns the switch to the side the thumb isn't on or heading to, as a press
   * does: from the UI thread, reported like a release, so a press and a drag
   * agree on the side while an owner's answer is on its way.
   */
  readonly flip: () => void;
}

/** No state the owner named while a finger held the thumb. */
const NONE = -1;

/**
 * A switch's thumb, on the UI thread. At rest it sits at the end `checked`
 * names, springing there on the theme's `snappy` spring when that changes. A
 * sideways drag carries it along the track under the finger; on release it
 * lands on the nearer end, or the way a fling goes, springs there carrying
 * the finger's speed if it heads that way, and, if that end is the other
 * side, reports it once through `onLand` (`useOwnerReports`). An owner that
 * keeps `checked` sees the thumb spring back. A finger holding the thumb wins
 * over a new `checked` until it lets go. The thumb never passes the track's
 * ends: its springs stop there rather than overshoot.
 *
 * A press with no drag is the switch's own (`Pressable`'s `onPress`, which
 * calls `flip`): once a drag starts, Gesture Handler cancels the press
 * natively, and `panAlong` swallows the click that ends it on the web.
 */
export function useSwitchDrag({
  checked,
  travel,
  disabled,
  reduced,
  hitSlop,
  onLand,
}: SwitchDragOptions): SwitchDrag {
  const snappy = useTheme().theme.semantic.motion.snappy;
  // From 0 (off) to 1 (on).
  const position = useSharedValue(checked ? 1 : 0);
  // The end the thumb is at or springing to.
  const heading = useSharedValue(checked ? 1 : 0);
  const dragging = useSharedValue(false);
  // The position a drag caught the thumb at, and the finger's travel by then (its touch slop).
  const start = useSharedValue(0);
  const slop = useSharedValue(0);
  // The end the owner named while a finger held the thumb, or NONE.
  const answer = useSharedValue(NONE);
  // React's props, which the worklets read here, so they're remade only with the gesture's own.
  const span = useSharedValue(travel);
  const spring = useSharedValue(snappy);
  const reduceMotion = useSharedValue(reduced);
  // The thumb moves to the left to turn on in a right-to-left layout.
  const forward = I18nManager.isRTL ? -1 : 1;
  const timer = useReleaseTimer();
  const { heard, report, stale } = useOwnerReports(onLand);

  const { show, press, pan } = useMemo(() => {
    /**
     * Springs to `end`, keeping `velocity` (positions a second; by default the
     * speed it had) only if that heads to `end`: carried away from it, the
     * thumb would pass the track's other end, which `overshootClamping`
     * doesn't guard.
     */
    const settle = (end: number, velocity?: number) => {
      'worklet';
      heading.set(end);
      position.set(
        springTo(end, spring.get(), {
          ...(velocity === undefined ? null : { velocity }),
          speedAway: 'drop',
          reduceMotion: reduceMotion.get(),
          overshootClamping: true,
          // A quarter point, in positions (a track narrower than its thumb has no travel).
          precision: SUBPIXEL / Math.max(span.get(), 1),
        }),
      );
    };
    /**
     * Lets go at `speed` points a second toward on: lands by `switchLandsOn`,
     * or back where it began if `canceled`, and reports a landing on the end
     * the thumb wasn't at or heading to.
     */
    const release = (canceled: boolean, speed: number) => {
      'worklet';
      dragging.set(false);
      const from = heading.get();
      const end = canceled ? from : switchLandsOn(position.get(), speed) ? 1 : 0;
      // Back where it began, or to the end the owner named meanwhile.
      const named = answer.get();
      const to = end === from && named !== NONE ? named : end;
      settle(to, speed / Math.max(span.get(), 1));
      if (end !== from && end !== named) report(end === 1);
    };
    return {
      /** React's state, rendered after it heard `heardReports` reports; held, it waits for the release. */
      show: (on: boolean, heardReports: number) => {
        'worklet';
        // React hasn't heard where a release went: its state is older than the thumb's.
        if (stale(heardReports)) return;
        const end = on ? 1 : 0;
        if (dragging.get()) answer.set(end);
        else if (heading.get() !== end) settle(end);
      },
      /** A press: the other side from where the thumb is headed, reported once. */
      press: () => {
        'worklet';
        if (dragging.get()) return;
        const end = 1 - heading.get();
        settle(end);
        report(end === 1);
      },
      pan: panAlong(false, {
        enabled: !disabled,
        hitSlop,
        onActivate: (event) => {
          'worklet';
          cancelAnimation(position);
          dragging.set(true);
          answer.set(NONE);
          start.set(position.get());
          slop.set(event.translationX);
          timer.moved();
        },
        onUpdate: (event) => {
          'worklet';
          timer.moved();
          if (span.get() <= 0) return;
          const moved = (forward * (event.translationX - slop.get())) / span.get();
          position.set(switchDragPosition(start.get(), moved));
        },
        onDeactivate: (event) => {
          'worklet';
          release(event.canceled, forward * timer.speed(event.canceled, event.velocityX));
        },
        // Whatever ended the gesture (disabled mid-drag, say), a thumb still held is let go.
        onFinalize: () => {
          'worklet';
          if (dragging.get()) release(true, 0);
        },
      }),
    };
  }, [disabled, hitSlop, forward, timer, report, stale]);

  useLayoutEffect(() => {
    span.set(travel);
    spring.set(snappy);
    reduceMotion.set(reduced);
  }, [travel, snappy, reduced, span, spring, reduceMotion]);

  // Sends React's state on when it changes, and after each report, so a change the owner
  // turned down springs the thumb back.
  const sent = useRef({ checked, heard });
  useLayoutEffect(() => {
    const last = sent.current;
    if (last.checked === checked && last.heard === heard) return;
    sent.current = { checked, heard };
    scheduleOnUI(show, checked, heard);
  });

  // Dependency arrays let a web build without the worklets Babel plugin run this style;
  // its only inputs are the shared values listed. Native warns on them.
  const thumbMotion = useAnimatedStyle(
    () => ({ transform: [{ translateX: forward * position.get() * span.get() }] }),
    WEB ? [position, span] : undefined,
  );

  return {
    pan: usePanGesture(pan),
    touchAction: crossPanning(false),
    thumbMotion,
    flip: useCallback(() => scheduleOnUI(press), [press]),
  };
}
