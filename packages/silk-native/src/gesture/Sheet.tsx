import { dialogRecipe } from '@reactive/silk-core';
import {
  type ComponentRef,
  createContext,
  type JSX,
  type ReactNode,
  use,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  type LayoutChangeEvent,
  ScrollView as RNScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  GestureDetector,
  GestureHandlerRootView,
  ScrollView as GHScrollView,
  usePanGesture,
} from 'react-native-gesture-handler';
import Animated, {
  type AnimatedRef,
  cancelAnimation,
  interpolate,
  measure,
  ReduceMotion,
  scrollTo,
  type SharedValue,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollOffset,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import {
  type DialogContentProps,
  DialogShell,
  dialogShellStyles,
  Dialog as RootDialog,
  useDialogContext,
} from '../components/Dialog.js';
import { mapDialogStyle } from '../styles/mappers/overlay.js';
import { useMotionPreference } from '../styles/useReducedMotion.js';
import { useComponentDefaults } from '../theme/SilkProvider.js';
import { useTheme } from '../theme/ThemeProvider.js';
import { dragStep, pressIn, releaseCloses, releaseSpeed, SHEET_SPRING } from './physics.js';
import type { SheetScrollViewProps } from './types.js';

/** How far a press moves (Android's touch slop) before it is taken as dragging. */
const SLOP = 8;

type Pan = ReturnType<typeof usePanGesture>;

/** What a sheet's `ScrollView` shares with the sheet's drag. */
interface SheetScrollLink {
  readonly pan: Pan;
  readonly scrollRef: AnimatedRef<ComponentRef<typeof RNScrollView>>;
  readonly scrollY: SharedValue<number>;
}

const SheetScrollContext = createContext<SheetScrollLink | null>(null);

/**
 * `Dialog.Content`: a bottom sheet drags (below); any other placement is the
 * root `Dialog`'s.
 */
export function SheetContent(props: DialogContentProps): JSX.Element {
  const defaults = useComponentDefaults('Dialog');
  const placement = props.placement ?? defaults.placement ?? dialogRecipe.defaults.placement;
  if (placement === 'bottom') return <DraggableSheet {...props} />;
  // A centered dialog opened from a sheet scrolls on its own, not as the sheet's content.
  return (
    <SheetScrollContext value={null}>
      <RootDialog.Content {...props} />
    </SheetScrollContext>
  );
}

/**
 * The bottom sheet: it slides up as it opens and down as it closes, however
 * it closes, on Silk's sheet spring. A drag follows the finger on the UI
 * thread; let go, the sheet keeps the finger's speed (none if it was held
 * still) and settles back or slides off and asks to close
 * (`onOpenChange(false)`). If its owner keeps it open, it settles back. With
 * reduced motion, a release jumps to its end.
 */
function DraggableSheet({
  size,
  // Taken out of `rest` so the panel's view never gets it; SheetContent already chose bottom.
  placement: _placement,
  style,
  overlayStyle,
  children,
  ref,
  onLayout,
  ...rest
}: DialogContentProps): JSX.Element {
  const { open, onOpenChange } = useDialogContext('Content');
  const { theme, density } = useTheme();
  const defaults = useComponentDefaults('Dialog');
  // Slides until reduced motion is known, as the root Dialog fades until then.
  const reduced = useMotionPreference() === 'reduced';
  const { veil, panel } = mapDialogStyle(
    theme,
    { size: size ?? defaults.size ?? dialogRecipe.defaults.size, placement: 'bottom' },
    density,
  );
  const screen = useWindowDimensions();

  // Shown from opening until it has slid out after closing.
  const [presented, setPresented] = useState(open);
  if (open && !presented) setPresented(true);

  const offset = useSharedValue(screen.height);
  const height = useSharedValue(screen.height);
  const sliding = useSharedValue(false);
  const reduceMotion = useSharedValue(reduced);
  // Closed by its owner: a release slides it out, however short.
  const shut = useSharedValue(!open);
  const inScroll = useSharedValue(false);
  const scrollY = useSharedValue(0);
  // When the drag started or last moved (ms, on the UI thread): a held finger lets go at rest.
  const lastMoveAt = useSharedValue(0);
  const scrollRef = useAnimatedRef<ComponentRef<typeof RNScrollView>>();

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
      if (!event.canceled && releaseCloses(offset.value, velocity, height.value)) {
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

  return (
    <DialogShell
      visible={presented}
      animationType="none"
      onClose={requestClose}
      veil={[veil, overlayStyle, styles.clearVeil]}
      catcher={[veil, overlayStyle, veilMotion]}
      Catcher={Animated.View}
      Root={GestureRoot}
    >
      <GestureDetector gesture={pan}>
        <Animated.View
          ref={ref}
          {...rest}
          onLayout={(event: LayoutChangeEvent) => {
            height.value = event.nativeEvent.layout.height;
            onLayout?.(event);
          }}
          style={[panel, dialogShellStyles.overVeil, style, panelMotion]}
        >
          <View
            aria-hidden
            style={[
              styles.handle,
              {
                top: theme.semantic.space[2],
                borderRadius: theme.semantic.radius.full,
                backgroundColor: theme.semantic.color.tones.neutral.border,
              },
            ]}
          />
          <SheetScrollContext value={{ pan, scrollRef, scrollY }}>{children}</SheetScrollContext>
        </Animated.View>
      </GestureDetector>
    </DialogShell>
  );
}

/** A Modal is a window of its own on Android, so gestures need their own root in it. */
function GestureRoot({ children }: { readonly children: ReactNode }) {
  return <GestureHandlerRootView style={styles.fill}>{children}</GestureHandlerRootView>;
}

const AnimatedScrollView = Animated.createAnimatedComponent(GHScrollView);

/**
 * `Dialog.ScrollView`: in a bottom sheet, the sheet's scrolling content,
 * which hands a pull-down at its top to the sheet's drag (one per sheet).
 * Elsewhere, React Native's ScrollView.
 */
export function SheetScrollView(props: SheetScrollViewProps): JSX.Element {
  const sheet = use(SheetScrollContext);
  return sheet ? <SheetScroll sheet={sheet} {...props} /> : <RNScrollView {...props} />;
}

function SheetScroll({
  sheet,
  ref,
  ...props
}: SheetScrollViewProps & { readonly sheet: SheetScrollLink }) {
  useScrollOffset(sheet.scrollRef, sheet.scrollY);
  return (
    <AnimatedScrollView
      ref={(node: ComponentRef<typeof RNScrollView> | null) => {
        sheet.scrollRef(node);
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      simultaneousWith={sheet.pan}
      overScrollMode="never"
      bounces={false}
      {...props}
    />
  );
}

/** A sheet's drag handle: Material's 32 by 4. */
const HANDLE = { width: 32, height: 4 } as const;

const styles = StyleSheet.create({
  fill: { flex: 1 },
  // The veil lays out the panel, with the caller's overlayStyle; its color
  // fades with the sheet's offset, on the press catcher.
  clearVeil: { backgroundColor: 'transparent' },
  // Over the panel's padding, centered at its top.
  handle: {
    ...HANDLE,
    position: 'absolute',
    left: '50%',
    marginLeft: -HANDLE.width / 2,
  },
});
