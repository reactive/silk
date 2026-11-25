/**
 * The web's motion engine: a list measures its items before each commit
 * and glides each from where it was (`reorder.ts`), animating the DOM
 * elements react-native-web renders (`webAnimations.ts`). Not React's
 * `<ViewTransition>`: an interrupted view transition skips to its end rather
 * than turning around at the speed it had, and the page can't be used while
 * one runs.
 */
import type { Spring } from '@reactive/silk-core';
import { Component, createContext, type JSX, use, useCallback, useRef } from 'react';
import { View } from 'react-native';
import { useReducedMotion } from '../../styles/useReducedMotion.js';
import { useTheme } from '../../theme/ThemeProvider.js';
import { measure, type Positions, reorder } from './reorder.js';
import type { MotionKey, MotionListProps, MotionViewProps } from './types.js';
import type { MotionElement } from './webAnimations.js';

export function MotionList(props: MotionListProps): JSX.Element {
  const spring = useTheme().theme.semantic.motion.brisk;
  return <Measured {...props} spring={spring} still={useReducedMotion()} />;
}

interface MeasuredProps extends MotionListProps {
  readonly spring: Spring;
  readonly still: boolean;
}

class Measured extends Component<MeasuredProps> {
  private readonly items = new Map<MotionKey, MotionElement>();

  /** Joins `el` under `id`; returns the cleanup. */
  private readonly join = (id: MotionKey, el: MotionElement) => {
    this.items.set(id, el);
    return () => {
      if (this.items.get(id) === el) this.items.delete(id);
    };
  };

  override getSnapshotBeforeUpdate(): Positions | null {
    return this.props.still ? null : measure(this.items);
  }

  override componentDidUpdate(
    prev: MeasuredProps,
    _state: unknown,
    before: Positions | null,
  ): void {
    if (!before) return;
    const fades = !Object.is(prev.layoutDependency, this.props.layoutDependency);
    reorder(before, this.items, this.props.spring, { fades });
  }

  override render(): JSX.Element {
    return <Join value={this.join}>{this.props.children}</Join>;
  }
}

const Join = createContext<((id: MotionKey, el: MotionElement) => () => void) | null>(null);

export function MotionView({ id, ...rest }: MotionViewProps): JSX.Element {
  const join = use(Join);
  // No cleanup returned, so React calls this with null when the view goes
  // (react-native-web's View ignores a returned cleanup anyway).
  const joined = useRef<() => void>(undefined);
  // react-native-web hands a ref its DOM element, which React Native's types don't say.
  const ref = useCallback(
    (el: MotionElement | null) => {
      joined.current?.();
      joined.current = el && join ? join(id, el) : undefined;
    },
    [join, id],
  );
  return <View {...rest} ref={ref as never} />;
}
