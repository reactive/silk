import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { I18nManager, type LayoutChangeEvent } from 'react-native';
import { usePanGesture } from 'react-native-gesture-handler';
import { cancelAnimation, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import { gestureConventions } from '../../gesture/conventions.js';
import { crossPanning, panAlong, useReleaseTimer } from '../../gesture/drag.js';
import { SUBPIXEL, springTo } from '../../motion/springTo.js';
import { useTheme } from '../../theme/ThemeProvider.js';
import { WEB } from '../../web/host.js';
import { sameItems } from '../sameItems.js';
import { dragPosition, landing } from './pagerPhysics.js';

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
 * finger's speed and reports its key once through `onSettle`; if the owner
 * keeps `index` where it was, the pages settle back. With `reduced` motion, a
 * release jumps to its page.
 *
 * Whether a finger holds the pages is known only on the UI thread, so React's
 * `index` is sent there (`show`) and applied or kept there.
 */
export function usePagerDrag({
  index,
  keys,
  lands,
  onSettle,
  reduced,
}: {
  readonly index: number;
  /** Each page's key, in order. */
  readonly keys: readonly string[];
  /** Which pages a drag may land on, one entry per page. */
  readonly lands: readonly boolean[];
  /** A release landed on the page with this key. */
  readonly onSettle: (key: string) => void;
  readonly reduced: boolean;
}): PagerDrag {
  const brisk = useTheme().theme.semantic.motion.brisk;
  // In pages: 1 shows the second page whole.
  const position = useSharedValue(index);
  // The page the pages are at or springing to; a drag moves at most one page from it.
  const heading = useSharedValue(index);
  const width = useSharedValue(0);
  const dragging = useSharedValue(false);
  // The position a drag caught the pages at.
  const start = useSharedValue(index);
  // The page the owner named while a finger held the pages, or -1.
  const answer = useSharedValue(-1);
  // The worklets are made once: they read the pages and React's props from these.
  const pageKeys = useSharedValue(keys);
  const pageLands = useSharedValue(lands);
  const spring = useSharedValue(brisk);
  const reduceMotion = useSharedValue(reduced);
  // Later pages lie to the left in a right-to-left layout, where a row runs that way.
  const forward = I18nManager.isRTL ? -1 : 1;
  const timer = useReleaseTimer();

  const latest = useRef(onSettle);
  const [reports, setReports] = useState(0);
  useLayoutEffect(() => {
    latest.current = onSettle;
  });
  const [report] = useState(() => (key: string) => {
    latest.current(key);
    setReports((count) => count + 1);
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
    return {
      /**
       * React's page `next` of the pages `nextKeys`. A new list keeps the page
       * shown in its place; held, the owner's page waits for the release.
       */
      show: (next: number, nextKeys: readonly string[], nextLands: readonly boolean[]) => {
        'worklet';
        pageLands.value = nextLands;
        if (!sameItems(pageKeys.value, nextKeys)) {
          const shown = pageKeys.value[heading.value]!;
          pageKeys.value = nextKeys;
          if (!dragging.value) {
            cancelAnimation(position);
            heading.value = next;
            position.value = next;
            return;
          }
          const kept = nextKeys.indexOf(shown);
          const shift = (kept < 0 ? next : kept) - heading.value;
          heading.value += shift;
          start.value += shift;
          position.value += shift;
        }
        if (dragging.value) answer.value = next;
        else if (heading.value !== next) settle(next);
      },
      pan: panAlong(false, {
        onActivate: () => {
          'worklet';
          cancelAnimation(position);
          dragging.value = true;
          answer.value = -1;
          start.value = position.value;
          timer.moved();
        },
        onUpdate: (event) => {
          'worklet';
          timer.moved();
          if (width.value <= 0) return;
          const raw = start.value - (forward * event.translationX) / width.value;
          position.value = dragPosition(raw, start.value, heading.value, pageLands.value);
        },
        onDeactivate: (event) => {
          'worklet';
          dragging.value = false;
          const from = heading.value;
          const pageWidth = width.value;
          // Points a second toward later pages.
          const toward = -forward * timer.speed(event.canceled, event.velocityX);
          const speed = pageWidth > 0 ? toward / pageWidth : 0;
          const fling =
            pageWidth > 0 && Math.abs(toward) >= gestureConventions.flingVelocity
              ? Math.sign(toward)
              : 0;
          const page = event.canceled
            ? from
            : landing(position.value, fling, from, pageLands.value);
          if (page === from) {
            // Back where it began, or to the page the owner named meanwhile.
            settle(answer.value < 0 ? from : answer.value, speed);
            return;
          }
          settle(page, speed);
          scheduleOnRN(report, pageKeys.value[page]!);
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
  const sent = useRef({ index, keys, lands, reports });
  useLayoutEffect(() => {
    const last = sent.current;
    if (
      last.index === index &&
      last.reports === reports &&
      sameItems(last.keys, keys) &&
      sameItems(last.lands, lands)
    ) {
      return;
    }
    sent.current = { index, keys, lands, reports };
    scheduleOnUI(show, index, keys, lands);
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
