/**
 * The native motion engine: Reanimated layout animations, which start in the
 * same frame React Native mounts the new layout. Animating from JavaScript
 * after a commit can't: Reanimated holds its updates back while React
 * commits, so the new layout shows for a frame before the animation starts.
 * Each item springs from where it is on screen to its new place on the UI
 * thread (`springTo`), keeping the speed it had: a layout animation that
 * interrupts a running one hands `springTo` the one it replaces, so a
 * reversal turns around instead of stalling.
 *
 * A removed item goes at once: Reanimated keeps a view with an `exiting`
 * animation on screen for a frame or two even when that animation does
 * nothing, which drew old rows over new ones.
 */
import type { MotionRecord, Spring } from '@reactive/silk-core';
import { Component, createContext, type JSX, use, useMemo, useState } from 'react';
import Animated, {
  type EntryExitAnimationFunction,
  type LayoutAnimationFunction,
  withTiming,
} from 'react-native-reanimated';
import { springTo } from '../../motion/springTo.js';
import { timingEasing } from '../../motion/useMotion.js';
import { useReducedMotion } from '../../styles/useReducedMotion.js';
import { useTheme } from '../../theme/ThemeProvider.js';
import type { MotionListProps, MotionViewProps } from './types.js';

/** The animations a list's items take, made once per list from the theme. */
interface ListAnimations {
  readonly layout: LayoutAnimationFunction;
  readonly entering: EntryExitAnimationFunction;
}

/** What a list tells the items mounting in a render: whether they arrive with its change. */
interface ListRender {
  readonly arriving: boolean;
  readonly animations: ListAnimations;
}

export function MotionList(props: MotionListProps): JSX.Element {
  const { brisk, normal } = useTheme().theme.semantic.motion;
  // Both renders a list can tell its items, made once, so an item re-renders only on a change.
  const renders = useMemo(() => {
    const animations = { layout: layoutTransition(brisk), entering: enterAnimation(normal) };
    return { arriving: { arriving: true, animations }, steady: { arriving: false, animations } };
  }, [brisk, normal]);
  return <Arrivals {...props} renders={renders} still={useReducedMotion()} />;
}

interface ArrivalsProps extends MotionListProps {
  readonly renders: { readonly arriving: ListRender; readonly steady: ListRender };
  readonly still: boolean;
}

interface ArrivalsState {
  readonly dependency: unknown;
  /** Whether this render carries the list's `layoutDependency` change. */
  readonly arriving: boolean;
}

/** Works out, render by render, whether this render carries the change to animate. */
class Arrivals extends Component<ArrivalsProps, ArrivalsState> {
  override state: ArrivalsState = { dependency: this.props.layoutDependency, arriving: false };

  static getDerivedStateFromProps(
    { layoutDependency }: ArrivalsProps,
    { dependency }: ArrivalsState,
  ): ArrivalsState {
    return { dependency: layoutDependency, arriving: !Object.is(dependency, layoutDependency) };
  }

  // Ends the arrival once its render commits (before paint), so an item a
  // descendant mounts later doesn't take it for its own.
  override componentDidUpdate(): void {
    if (this.state.arriving) this.setState({ arriving: false });
  }

  override render(): JSX.Element {
    const { renders, still, children } = this.props;
    const told = still ? null : this.state.arriving ? renders.arriving : renders.steady;
    return <ListContext value={told}>{children}</ListContext>;
  }
}

/** What items mounting in this render take; null outside a list or while motion is reduced. */
const ListContext = createContext<ListRender | null>(null);

export function MotionView({ id: _id, ...rest }: MotionViewProps): JSX.Element {
  const list = use(ListContext);
  // Read once, at mount: only an arrival fades in.
  const [entering] = useState(() => (list?.arriving ? list.animations.entering : undefined));
  const layout = list?.animations.layout;
  // Always an Animated.View, so turning reduced motion on or off keeps each item mounted.
  return (
    <Animated.View
      {...rest}
      {...(layout && { layout })}
      {...(entering && { entering })}
    />
  );
}

/** Springs a view from where it is on screen to its new place, keeping its speed. */
function layoutTransition(spring: Spring): LayoutAnimationFunction {
  return (values) => {
    'worklet';
    return {
      initialValues: {
        originX: values.currentOriginX,
        originY: values.currentOriginY,
        width: values.targetWidth,
        height: values.targetHeight,
      },
      animations: {
        // Reduced motion never gets here: the view has no layout animation then.
        originX: springTo(values.targetOriginX, spring, { reduceMotion: false }),
        originY: springTo(values.targetOriginY, spring, { reduceMotion: false }),
      },
    };
  };
}

/** Fades in an item that arrived with the change, on `fade`, a duration token. */
function enterAnimation(fade: MotionRecord): EntryExitAnimationFunction {
  const timing = { duration: fade.durationMs, easing: timingEasing(fade.easing) };
  return () => {
    'worklet';
    return { initialValues: { opacity: 0 }, animations: { opacity: withTiming(1, timing) } };
  };
}
