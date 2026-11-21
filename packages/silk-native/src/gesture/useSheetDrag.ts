import {
  type ComponentRef,
  type Context,
  createContext,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { type LayoutChangeEvent, type ScrollView, useWindowDimensions } from 'react-native';
import { usePanGesture } from 'react-native-gesture-handler';
import {
  type AnimatedRef,
  cancelAnimation,
  interpolate,
  measure,
  ReduceMotion,
  scrollTo,
  type SharedValue,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { dragStep, pressIn, releaseCloses, releaseSpeed, SHEET_SPRING } from './physics.js';

/** How far a press moves (Android's touch slop) before it is taken as dragging. */
const SLOP = 8;

type Pan = ReturnType<typeof usePanGesture>;

/** What a sheet's `ScrollView` shares with the sheet's drag. */
export interface SheetScrollLink {
  readonly pan: Pan;
  readonly scrollRef: AnimatedRef<ComponentRef<typeof ScrollView>>;
  readonly scrollY: SharedValue<number>;
}

/** The sheet's scroll link, for its `Dialog.ScrollView`; none outside a bottom sheet. */
export const SheetScrollContext: Context<SheetScrollLink | null> =
  createContext<SheetScrollLink | null>(null);

export interface SheetDrag {
  /** Whether the sheet shows: from opening until it has slid out after closing. */
  readonly presented: boolean;
  readonly pan: Pan;
  /** The panel's offset below its rest. */
  readonly panelMotion: ReturnType<typeof useAnimatedStyle>;
  /** The veil's color, fading as the panel leaves. */
  readonly veilMotion: ReturnType<typeof useAnimatedStyle>;
  /** Records the panel's height, how far it slides out. */
  readonly onPanelLayout: (event: LayoutChangeEvent) => void;
  /** Asks the owner to close (`onOpenChange(false)`); kept open, the sheet settles back. */
  readonly requestClose: () => void;
  readonly scrollLink: SheetScrollLink;
}

/**
 * A bottom sheet's motion: it slides up as it opens and down as it closes,
 * however it closes, on Silk's sheet spring. A drag follows the finger on the
 * UI thread; let go, the sheet keeps the finger's speed (none if it was held
 * still) and settles back or slides off and asks to close. If its owner keeps
 * it open, it settles back. With `reduced` motion, a release jumps to its end.
 */
export function useSheetDrag({
  open,
  onOpenChange,
  reduced,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly reduced: boolean;
}): SheetDrag {
  const screen = useWindowDimensions();

  const [presented, setPresented] = useState(open);
  if (open && !presented) setPresented(true);

  const offset = useSharedValue(screen.height);
  const height = useSharedValue(screen.height);
  const sliding = useSharedValue(false);
  const reduceMotion = useSharedValue(reduced);
  // Closed by its owner, or by a release until the owner answers: a release
  // then slides it out, however short.
  const shut = useSharedValue(!open);
  const inScroll = useSharedValue(false);
  const scrollY = useSharedValue(0);
  // When the drag started or last moved (ms, on the UI thread): a held finger lets go at rest.
  const lastMoveAt = useSharedValue(0);
  // Where the drag caught the sheet, so one that ends no lower keeps it open.
  const dragFrom = useSharedValue(0);
  const scrollRef = useAnimatedRef<ComponentRef<typeof ScrollView>>();

  // The gesture is made once; these keep its calls into React current.
  const latest = useRef({ open, onOpenChange });
  const [closeAsks, setCloseAsks] = useState(0);
  useLayoutEffect(() => {
    latest.current = { open, onOpenChange };
    reduceMotion.value = reduced;
    shut.value = !open;
  });
  const [requestClose] = useState(() => () => {
    latest.current.onOpenChange(false);
    setCloseAsks((asks) => asks + 1);
  });
  const [unmountIfClosed] = useState(() => () => {
    if (!latest.current.open) setPresented(false);
  });

  const springTo = (to: number, velocity: number, done?: () => void) => {
    'worklet';
    offset.value = withSpring(
      to,
      {
        ...SHEET_SPRING,
        velocity,
        reduceMotion: reduceMotion.value ? ReduceMotion.Always : ReduceMotion.Never,
      },
      (finished?: boolean) => {
        'worklet';
        if (finished && done) done();
      },
    );
  };
  // Never up first: an upward release speed would lift it before it drops.
  const slideOut = (velocity: number) => {
    'worklet';
    sliding.value = true;
    springTo(height.value, Math.max(0, velocity), () => {
      'worklet';
      sliding.value = false;
      scheduleOnRN(unmountIfClosed);
    });
  };

  // Opening slides it up from below the screen; closing, unless a release
  // already sent it sliding, slides it down.
  useLayoutEffect(() => {
    if (open) {
      sliding.value = false;
      springTo(0, 0);
    } else if (!sliding.value) slideOut(0);
  }, [open]);
  // Asked to close but kept open: back to rest, from wherever it got to.
  useLayoutEffect(() => {
    if (closeAsks > 0 && latest.current.open) {
      sliding.value = false;
      springTo(0, 0);
    }
  }, [closeAsks]);

  const pan = usePanGesture({
    // Either way: a sheet caught sliding can be pushed back up.
    activeOffsetY: [-SLOP, SLOP],
    failOffsetX: [-SLOP, SLOP],
    maxPointers: 1,
    onBegin: (event) => {
      'worklet';
      inScroll.value = pressIn(measure(scrollRef), event.absoluteX, event.absoluteY);
    },
    onActivate: () => {
      'worklet';
      cancelAnimation(offset);
      sliding.value = false;
      lastMoveAt.value = Date.now();
      dragFrom.value = offset.value;
    },
    onUpdate: (event) => {
      'worklet';
      const step = dragStep(offset.value, event.changeY, inScroll.value, scrollY.value);
      offset.value = step.offset;
      lastMoveAt.value = Date.now();
      if (step.pinScroll) scrollTo(scrollRef, 0, 0, false);
    },
    onDeactivate: (event) => {
      'worklet';
      const velocity = event.canceled
        ? 0
        : releaseSpeed(event.velocityY, Date.now() - lastMoveAt.value);
      if (shut.value) {
        // Caught while sliding out after closing: it goes on out.
        slideOut(velocity);
        return;
      }
      if (offset.value <= 0) return;
      if (!event.canceled && releaseCloses(offset.value, velocity, height.value, dragFrom.value)) {
        // Shut now, not once React answers, so a catch before then still goes on out.
        shut.value = true;
        slideOut(velocity);
        scheduleOnRN(requestClose);
      } else springTo(0, velocity);
    },
  });

  const panelMotion = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }));
  const veilMotion = useAnimatedStyle(() => ({
    opacity: interpolate(offset.value, [0, height.value], [1, 0], 'clamp'),
  }));

  return {
    presented,
    pan,
    panelMotion,
    veilMotion,
    onPanelLayout: (event) => {
      height.value = event.nativeEvent.layout.height;
    },
    requestClose,
    scrollLink: { pan, scrollRef, scrollY },
  };
}
