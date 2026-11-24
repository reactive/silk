import { useLayoutEffect, useRef, useState } from 'react';
import { I18nManager, type LayoutChangeEvent } from 'react-native';
import { usePanGesture } from 'react-native-gesture-handler';
import {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { panAlong, useReleaseTimer } from '../../gesture/drag.js';
import { springTo } from '../../motion/springTo.js';
import { useTheme } from '../../theme/ThemeProvider.js';
import { WEB } from '../../web/host.js';
import { dragPosition, landing } from './pagerPhysics.js';

export interface PagerDrag {
  readonly pan: ReturnType<typeof usePanGesture>;
  /** Moves the row of pages so the page at the pager's position shows. */
  readonly rowMotion: ReturnType<typeof useAnimatedStyle>;
  /** Records the pager's width: one page's, and how far a page moves. */
  readonly onLayout: (event: LayoutChangeEvent) => void;
}

/**
 * A pager's motion. At rest it shows page `index`, springing there on the
 * theme's `brisk` spring when `index` changes. A sideways drag follows the
 * finger on the UI thread, and a finger holding the pages wins over a new
 * `index` until it lets go. On release the UI thread picks the page
 * (`landing`: the nearest, or the next one on a fling), springs there at the
 * finger's speed and reports it once through `onSettle`; if the owner keeps
 * `index` where it was, the pages settle back. With `reduced` motion, a
 * release jumps to its page.
 */
export function usePagerDrag({
  index,
  enabled,
  onSettle,
  reduced,
}: {
  readonly index: number;
  /** Which pages a drag may land on, one entry per page. */
  readonly enabled: readonly boolean[];
  readonly onSettle: (index: number) => void;
  readonly reduced: boolean;
}): PagerDrag {
  const brisk = useTheme().theme.semantic.motion.brisk;
  // In pages: 1 shows the second page whole.
  const position = useSharedValue(index);
  // The page the pages are at or springing to.
  const heading = useSharedValue(index);
  const width = useSharedValue(0);
  const dragging = useSharedValue(false);
  // Where a drag caught the pages: the page it may move one away from, and their position.
  const from = useSharedValue(index);
  const start = useSharedValue(index);
  // The gesture's worklets are made once: they read React's props from these.
  const owned = useSharedValue(index);
  const lands = useSharedValue(enabled);
  const spring = useSharedValue(brisk);
  const reduceMotion = useSharedValue(reduced);
  // Later pages lie to the left in a right-to-left layout, where a row runs that way.
  const forward = I18nManager.isRTL ? -1 : 1;
  const timer = useReleaseTimer();

  const latest = useRef(onSettle);
  const [reports, setReports] = useState(0);
  useLayoutEffect(() => {
    latest.current = onSettle;
    owned.value = index;
    lands.value = enabled;
    spring.value = brisk;
    reduceMotion.value = reduced;
  });
  const [report] = useState(() => (page: number) => {
    latest.current(page);
    setReports((count) => count + 1);
  });

  const settle = (page: number, velocity: number) => {
    'worklet';
    heading.value = page;
    position.value = springTo(page, spring.value, { velocity, reduceMotion: reduceMotion.value });
  };

  // At rest the pages show `index`: a new one springs there, and so does a
  // report the owner turned down. One already heading there keeps its speed.
  // Held, the release decides.
  useLayoutEffect(() => {
    if (dragging.value || heading.value === index) return;
    settle(index, 0);
  }, [index, reports]);

  const pan = usePanGesture(
    panAlong(false, {
      onActivate: () => {
        'worklet';
        cancelAnimation(position);
        dragging.value = true;
        from.value = heading.value;
        start.value = position.value;
        timer.moved();
      },
      onUpdate: (event) => {
        'worklet';
        timer.moved();
        if (width.value <= 0) return;
        const raw = start.value - (forward * event.translationX) / width.value;
        position.value = dragPosition(raw, from.value, lands.value);
      },
      onDeactivate: (event) => {
        'worklet';
        dragging.value = false;
        const pageWidth = width.value;
        const speed =
          pageWidth > 0 ? (-forward * timer.speed(event.canceled, event.velocityX)) / pageWidth : 0;
        const page = event.canceled
          ? from.value
          : landing(position.value, speed, pageWidth, from.value, lands.value);
        if (page === from.value) {
          // Back where it began, or to where the owner moved it meanwhile.
          settle(owned.value, speed);
          return;
        }
        settle(page, speed);
        scheduleOnRN(report, page);
      },
    }),
  );

  // Dependency arrays let a web build without the worklets Babel plugin run this style;
  // its only inputs are the shared values listed. Native warns on them.
  const rowMotion = useAnimatedStyle(
    () => ({ transform: [{ translateX: -forward * position.value * width.value }] }),
    WEB ? [position, width] : undefined,
  );

  return {
    pan,
    rowMotion,
    onLayout: (event) => {
      width.value = event.nativeEvent.layout.width;
    },
  };
}
