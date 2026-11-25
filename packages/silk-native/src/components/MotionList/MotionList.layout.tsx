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
import type { Spring } from '@reactive/silk-core';
import { Component, createContext, type JSX, use, useMemo, useState } from 'react';
import Animated, {
  type EntryExitAnimationFunction,
  type LayoutAnimationFunction,
} from 'react-native-reanimated';
import { springTo } from '../../motion/springTo.js';
import { useReducedMotion } from '../../styles/useReducedMotion.js';
import { useTheme } from '../../theme/ThemeProvider.js';
import type { MotionListProps, MotionViewProps } from './types.js';

export function MotionList(props: MotionListProps): JSX.Element {
  return <Arrivals {...props} still={useReducedMotion()} />;
}

interface ArrivalsProps extends MotionListProps {
  readonly still: boolean;
}

/**
 * Whether this render carries the list's `layoutDependency` change, so items
 * mounting in it fade in; null outside a list or while motion is reduced.
 */
type Arriving = boolean | null;

interface ArrivalsState {
  readonly dependency: unknown;
  readonly arriving: Arriving;
}

/** Works out, render by render, whether this render carries the change to animate. */
class Arrivals extends Component<ArrivalsProps, ArrivalsState> {
  override state: ArrivalsState = { dependency: this.props.layoutDependency, arriving: null };

  static getDerivedStateFromProps(
    { layoutDependency, still }: ArrivalsProps,
    state: ArrivalsState,
  ): ArrivalsState | null {
    const next: Arriving = still ? null : !Object.is(state.dependency, layoutDependency);
    if (next === state.arriving && Object.is(state.dependency, layoutDependency)) return null;
    return { dependency: layoutDependency, arriving: next };
  }

  override render(): JSX.Element {
    return <ListContext value={this.state.arriving}>{this.props.children}</ListContext>;
  }
}

const ListContext = createContext<Arriving>(null);

/** How close to fully shown an arrival's fade comes before it stops: what's left can't be seen. */
const FADE_PRECISION = 0.01;

export function MotionView({ id: _id, ...rest }: MotionViewProps): JSX.Element {
  const arriving = use(ListContext);
  const spring = useTheme().theme.semantic.motion.brisk;
  const moving = arriving !== null;
  const layout = useMemo(() => (moving ? layoutTransition(spring) : undefined), [moving, spring]);
  // Read once, at mount: only an arrival fades in.
  const [entering] = useState(() => (arriving ? enterAnimation(spring) : undefined));
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

/** Fades in an item that arrived with the change. */
function enterAnimation(spring: Spring): EntryExitAnimationFunction {
  return () => {
    'worklet';
    return {
      initialValues: { opacity: 0 },
      animations: {
        opacity: springTo(1, spring, { reduceMotion: false, precision: FADE_PRECISION }),
      },
    };
  };
}
