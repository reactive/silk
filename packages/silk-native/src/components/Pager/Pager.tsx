import {
  Children,
  type ComponentRef,
  createContext,
  isValidElement,
  type JSX,
  type ReactElement,
  type ReactNode,
  type Ref,
  use,
  useLayoutEffect,
  useRef,
} from 'react';
import { type LayoutChangeEvent, StyleSheet, View, type ViewProps } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { assignRef } from '../assignRef.js';
import { useMotionPreference } from '../../styles/useReducedMotion.js';
import { WEB } from '../../web/host.js';
import { usePagerDrag } from './usePagerDrag.js';

export interface PagerRootProps extends Omit<ViewProps, 'children'> {
  /** The page shown, by its `Pager.Page` `value`. */
  readonly value: string;
  /** A swipe settled on another page: the owner shows it by passing its `value` back. */
  readonly onValueChange: (value: string) => void;
  /** The pages, in order: `Pager.Page` elements. */
  readonly children: ReactNode;
  readonly ref?: Ref<ComponentRef<typeof View>>;
}

export interface PagerPageProps extends ViewProps {
  /** The page's name, which `Pager.Root`'s `value` shows. */
  readonly value: string;
  /** A swipe passes it by: it shows only when the owner names it. */
  readonly disabled?: boolean;
}

/** Whether the page around the caller is the one shown (`Pager.useIsActive`). */
const ActivePage = createContext(true);

/**
 * `Pager.Root`: pages side by side, one shown at a time, which a sideways
 * swipe moves between (one page per swipe, never onto a disabled page). It is
 * controlled: it shows the page `value` names, springing there when that
 * changes, and a swipe only proposes the page it settles on through
 * `onValueChange`; an owner that keeps `value` sees the pages settle back.
 * The motion runs on the UI thread (`usePagerDrag`). Pages other than the
 * shown one are hidden from screen readers and can't take focus. Inside a
 * page, a vertical scroll still scrolls; a horizontal one competes with the
 * swipe. Each page is as wide as the pager, which sizes like any `View`
 * (give it `flex: 1` or a height).
 */
function PagerRoot({
  value,
  onValueChange,
  children,
  style,
  onLayout,
  ref,
  ...rest
}: PagerRootProps): JSX.Element {
  const pages = Children.toArray(children).filter(isPage);
  const index = pages.findIndex((page) => page.props.value === value);
  if (index < 0) throw new Error(`Pager.Root: no Pager.Page has the value "${value}".`);
  const drag = usePagerDrag({
    index,
    enabled: pages.map((page) => !page.props.disabled),
    onSettle: (page) => {
      const settled = pages[page];
      if (settled) onValueChange(settled.props.value);
    },
    reduced: useMotionPreference() === 'reduced',
  });
  const share = `${100 / pages.length}%` as const;

  return (
    // On the web, a vertical swipe on a page stays the browser's scroll.
    <GestureDetector gesture={drag.pan} touchAction="pan-y">
      <View
        ref={ref}
        {...rest}
        onLayout={(event: LayoutChangeEvent) => {
          drag.onLayout(event);
          onLayout?.(event);
        }}
        style={[styles.root, style]}
      >
        <Animated.View
          style={[styles.row, { width: `${pages.length * 100}%` }, drag.rowMotion]}
        >
          {pages.map((page, at) => (
            <PageSlot key={page.props.value} {...page.props} shown={at === index} width={share} />
          ))}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const isPage = (child: ReturnType<typeof Children.toArray>[number]): child is ReactElement<PagerPageProps> =>
  isValidElement<PagerPageProps>(child) && typeof child.props.value === 'string';

/**
 * `Pager.Page`: one page of a `Pager.Root`, which lays it out; it renders
 * nothing elsewhere.
 */
function PagerPage(_props: PagerPageProps): null {
  return null;
}

/** A page in its place in the row: shown, or hidden from screen readers and focus. */
function PageSlot({
  value: _value,
  disabled: _disabled,
  shown,
  width,
  style,
  children,
  ref,
  ...rest
}: PagerPageProps & {
  readonly shown: boolean;
  readonly width: `${number}%`;
  readonly ref?: Ref<ComponentRef<typeof View>>;
}): JSX.Element {
  const node = useRef<ComponentRef<typeof View>>(null);
  // React Native for Web passes no `inert`; on the web it is the element's own property.
  useLayoutEffect(() => {
    if (WEB && node.current) (node.current as unknown as HTMLElement).inert = !shown;
  }, [shown]);
  return (
    <View
      ref={(view) => {
        node.current = view;
        assignRef(ref, view);
      }}
      {...rest}
      aria-hidden={!shown}
      importantForAccessibility={shown ? 'auto' : 'no-hide-descendants'}
      accessibilityElementsHidden={!shown}
      style={[{ width }, style]}
    >
      <ActivePage value={shown}>{children}</ActivePage>
    </View>
  );
}

/**
 * Whether the page around the caller is the one its pager shows (true outside
 * a pager), so a hidden page can stop listening for keys or updates.
 */
function usePagerIsActive(): boolean {
  return use(ActivePage);
}

export interface PagerNamespace {
  readonly Root: typeof PagerRoot;
  readonly Page: typeof PagerPage;
  readonly useIsActive: typeof usePagerIsActive;
}

export const Pager: PagerNamespace = {
  Root: PagerRoot,
  Page: PagerPage,
  useIsActive: usePagerIsActive,
};

const styles = StyleSheet.create({
  root: { overflow: 'hidden' },
  row: { flexDirection: 'row', flexGrow: 1 },
});
