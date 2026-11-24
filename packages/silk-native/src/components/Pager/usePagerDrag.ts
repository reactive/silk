import { startTransition, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { I18nManager, type LayoutChangeEvent } from 'react-native';
import { usePanGesture } from 'react-native-gesture-handler';
import { cancelAnimation, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import { crossPanning, panAlong, useReleaseTimer } from '../../gesture/drag.js';
import { SUBPIXEL, springTo } from '../../motion/springTo.js';
import { useTheme } from '../../theme/ThemeProvider.js';
import { WEB } from '../../web/host.js';
import { sameItems } from '../sameItems.js';
import { dragPosition, landing, releaseInPages, speedToward } from './pagerPhysics.js';

export interface PagerDrag {
  readonly pan: ReturnType<typeof usePanGesture>;
  /** On the web, the browser's own panning the pager leaves to it (`GestureDetector`'s). */
  readonly touchAction: 'pan-x' | 'pan-y';
  /** Moves the row of pages so the page at the pager's position shows. */
  readonly rowMotion: ReturnType<typeof useAnimatedStyle>;
  /** Records the pager's width: how many points of finger travel move one page. */
  readonly onLayout: (event: LayoutChangeEvent) => void;
}

/** Before layout there are no points to measure: a spring stops within a thousandth of a page. */
const UNLAID_PRECISION = 0.001;

/**
 * A pager's motion. At rest it shows page `index`, springing there on the
 * theme's `brisk` spring when `index` changes; a page is known by its key, so
 * one added or removed before it moves nothing. A sideways drag follows the
 * finger on the UI thread, and a finger holding the pages wins over a new
 * `index` until it lets go. On release the UI thread picks the page
 * (`landing`: the nearest, or the next one on a fling), springs there at the
 * finger's speed and reports its key once through `onLand`; if the owner
 * keeps `index` where it was, the pages settle back. With `reduced` motion, a
 * release jumps to its page.
 *
 * Whether a finger holds the pages is known only on the UI thread, so React's
 * `index` is sent there (`show`) and applied or kept there. Each release the
 * UI thread reports is numbered, and React's page is sent with the number of
 * the last report it heard: until React has heard them all, its page is older
 * than the pages' own and is kept out.
 */
export function usePagerDrag({
  index,
  keys,
  enabled,
  onLand,
  reduced,
}: {
  readonly index: number;
  /** Each page's key, in order. */
  readonly keys: readonly string[];
  /** Which pages a drag may land on, one entry per page. */
  readonly enabled: readonly boolean[];
  /** A release landed on the page with this key, which React renders and which is enabled. */
  readonly onLand: (key: string) => void;
  readonly reduced: boolean;
}): PagerDrag {
  const brisk = useTheme().theme.semantic.motion.brisk;
  // In pages: 1 shows the second page whole.
  const position = useSharedValue(index);
  // The page the pages are at or springing to; a drag moves at most one page from it.
  const heading = useSharedValue(index);
  const width = useSharedValue(0);
  const dragging = useSharedValue(false);
  // The position a drag caught the pages at, and the finger's travel by then (its touch slop).
  const start = useSharedValue(index);
  const slop = useSharedValue(0);
  // The page the owner named while a finger held the pages, or -1.
  const answer = useSharedValue(-1);
  // How many releases the UI thread has reported.
  const reported = useSharedValue(0);
  // The worklets are made once: they read the pages and React's props from these.
  const pageKeys = useSharedValue(keys);
  const pageEnabled = useSharedValue(enabled);
  const spring = useSharedValue(brisk);
  const reduceMotion = useSharedValue(reduced);
  // Later pages lie to the left in a right-to-left layout, where a row runs that way.
  const forward = I18nManager.isRTL ? -1 : 1;
  const timer = useReleaseTimer();

  // React's props as last committed, which a report reads when it arrives.
  const latest = useRef({ onLand, keys, enabled });
  useLayoutEffect(() => {
    latest.current = { onLand, keys, enabled };
  });
  // The reports React has heard, sent with its page. Each report also renders, so React's
  // page is sent again after it: an owner that turned the page down renders the same `index`,
  // which must still spring the pages back. That render is a transition, so an owner that
  // answers in one (a router) is rendered with it, and it is asked before the owner's call,
  // so an owner that throws still gets it.
  const heard = useRef(0);
  const [, rerender] = useState(0);
  const [report] = useState(() => (key: string, count: number) => {
    heard.current = count;
    startTransition(() => rerender(count));
    // The page may have gone or been disabled since the UI thread landed on it.
    const { onLand: land, keys: now, enabled: open } = latest.current;
    if (open[now.indexOf(key)]) land(key);
  });

  // Made once, so neither Gesture Handler nor Reanimated sets the gesture up again each render.
  const { show, pan } = useMemo(() => {
    /** Springs to `page`, at `velocity` pages a second, or carrying the speed it had. */
    const settle = (page: number, velocity?: number) => {
      'worklet';
      heading.value = page;
      const options = {
        reduceMotion: reduceMotion.value,
        // A quarter point, in pages.
        precision: width.value > 0 ? SUBPIXEL / width.value : UNLAID_PRECISION,
      };
      position.value = springTo(
        page,
        spring.value,
        velocity === undefined ? options : { ...options, velocity },
      );
    };
    /**
     * The pages are now `nextKeys`: they move with the page they were at, or
     * to `next` if it was removed, so the row stays still under them.
     */
    const relist = (next: number, nextKeys: readonly string[]) => {
      'worklet';
      const kept = nextKeys.indexOf(pageKeys.value[heading.value]!);
      pageKeys.value = nextKeys;
      if (!dragging.value) cancelAnimation(position);
      const shift = (kept < 0 ? next : kept) - heading.value;
      heading.value += shift;
      start.value += shift;
      position.value += shift;
    };
    return {
      /**
       * React's page `next` of the pages `nextKeys`, rendered after it heard
       * `heardReports` of them. A new list keeps the page shown in its place;
       * held, the owner's page waits for the release.
       */
      show: (
        next: number,
        nextKeys: readonly string[],
        nextEnabled: readonly boolean[],
        heardReports: number,
      ) => {
        'worklet';
        pageEnabled.value = nextEnabled;
        if (!sameItems(pageKeys.value, nextKeys)) relist(next, nextKeys);
        // React hasn't heard where a release went: its page is older than the pages'.
        if (heardReports < reported.value) return;
        if (dragging.value) answer.value = next;
        // Also when `heading` is there already: a relist can stop the pages short of it. A
        // spring still on its way starts again from where it is, at its speed: the same curve.
        else if (heading.value !== next || position.value !== next) settle(next);
      },
      pan: panAlong(false, {
        onActivate: (event) => {
          'worklet';
          cancelAnimation(position);
          dragging.value = true;
          answer.value = -1;
          start.value = position.value;
          slop.value = event.translationX;
          timer.moved();
        },
        onUpdate: (event) => {
          'worklet';
          timer.moved();
          if (width.value <= 0) return;
          const raw = start.value - (forward * (event.translationX - slop.value)) / width.value;
          position.value = dragPosition(raw, start.value, heading.value, pageEnabled.value);
        },
        onDeactivate: (event) => {
          'worklet';
          dragging.value = false;
          const from = heading.value;
          const { speed, fling } = releaseInPages(
            -forward * timer.speed(event.canceled, event.velocityX),
            width.value,
          );
          const page = event.canceled
            ? from
            : landing(position.value, fling, from, pageEnabled.value);
          // Back where it began, or to the page the owner named meanwhile.
          const to = page === from && answer.value >= 0 ? answer.value : page;
          settle(to, speedToward(to, position.value, speed));
          if (page === from) return;
          const count = reported.value + 1;
          reported.value = count;
          scheduleOnRN(report, pageKeys.value[page]!, count);
        },
      }),
    };
  }, [forward, timer, report]);

  useLayoutEffect(() => {
    spring.value = brisk;
    reduceMotion.value = reduced;
  }, [brisk, reduced, spring, reduceMotion]);

  // Sends React's page on, when it or the pages changed, and after each report, so a page
  // the owner turned down springs back.
  const sent = useRef({ index, keys, enabled, heard: 0 });
  useLayoutEffect(() => {
    const last = sent.current;
    if (
      last.index === index &&
      last.heard === heard.current &&
      sameItems(last.keys, keys) &&
      sameItems(last.enabled, enabled)
    ) {
      return;
    }
    sent.current = { index, keys, enabled, heard: heard.current };
    scheduleOnUI(show, index, keys, enabled, heard.current);
  });

  // In percent of the row, which is as wide as all the pages, so the page shows before layout.
  // Dependency arrays let a web build without the worklets Babel plugin run this style;
  // its only inputs are the shared values listed. Native warns on them.
  const rowMotion = useAnimatedStyle(
    () => ({
      transform: [{ translateX: `${(-forward * position.value * 100) / pageKeys.value.length}%` }],
    }),
    WEB ? [position, pageKeys] : undefined,
  );

  return {
    pan: usePanGesture(pan),
    touchAction: crossPanning(false),
    rowMotion,
    onLayout: (event) => {
      width.value = event.nativeEvent.layout.width;
    },
  };
}
