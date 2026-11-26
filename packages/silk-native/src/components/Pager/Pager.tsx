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
  useMemo,
} from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useMotionPreference } from '../../styles/useReducedMotion.js';
import { WEB } from '../../web/host.js';
import { PagerIndicator } from './PagerIndicator.js';
import { PagerState } from './pagerState.js';
import { usePagerDrag } from './usePagerDrag.js';

export interface PagerRootProps extends Omit<ViewProps, 'children'> {
  /** The page shown, by its `Pager.Page` `value`. */
  readonly value: string;
  /**
   * A swipe let go toward another page: the owner shows it by passing its
   * `value` back, in the same update or a transition. An answer that comes
   * later than that (after an `await`) arrives after the pages settled back.
   */
  readonly onValueChange: (value: string) => void;
  /**
   * The pages, in order: `Pager.Page` elements, each a direct child, and at
   * most one `Pager.Indicator` among them.
   */
  readonly children: ReactNode;
  readonly ref?: Ref<ComponentRef<typeof View>>;
}

export interface PagerPageProps extends ViewProps {
  /** The page's name, which `Pager.Root`'s `value` shows; unique in its pager. */
  readonly value: string;
  /** A swipe passes it by, to the next page beyond: it shows only when the owner names it. */
  readonly disabled?: boolean;
  readonly ref?: Ref<ComponentRef<typeof View>>;
}

/** The place `Pager.Root` gives a page: whether it shows, and its share of the row. */
const PageFrame = createContext<{
  readonly shown: boolean;
  readonly width: `${number}%`;
} | null>(null);

/** Whether the page around the caller is shown, and every page around that one (`usePagerIsActive`). */
const ActivePage = createContext(true);

/**
 * `Pager.Root`: pages side by side, one shown at a time, which a sideways
 * swipe moves between (one page per swipe, passing disabled pages by). It is
 * controlled: it shows the page `value` names, springing there when that
 * changes, and a swipe only proposes the page it lands on through
 * `onValueChange`; an owner that keeps `value` sees the pages settle back.
 * The motion runs on the UI thread (`usePagerDrag`). Each page is as wide as
 * the pager, which sizes like any `View` (give it `flex: 1` or a height), and
 * as tall as the pager when it has a height; otherwise the pager is as tall
 * as its tallest page.
 *
 * Inside a page, a vertical scroll still scrolls; a horizontal one competes
 * with the swipe. On the web the pager keeps the browser's vertical panning,
 * and its text can't be selected, since a mouse drag pages (Gesture Handler's
 * `user-select: none`). Right to left follows `I18nManager.isRTL`, which
 * react-native-web leaves unset.
 */
function PagerRoot({
  value,
  onValueChange,
  children,
  style,
  onLayout,
  ...rest
}: PagerRootProps): JSX.Element {
  const { pages, indicator } = partsOf(children);
  const renderedPages = pages.map((page) => ({
    key: page.props.value,
    enabled: !page.props.disabled,
  }));
  const keys = renderedPages.map((page) => page.key);
  if (new Set(keys).size < keys.length) {
    throw new Error('Pager.Root: two Pager.Page children have the same value.');
  }
  const index = keys.indexOf(value);
  if (index < 0) throw new Error(`Pager.Root: no Pager.Page has the value "${value}".`);
  const enabledPages = renderedPages.map((page) => page.enabled);
  const drag = usePagerDrag({
    index,
    keys,
    enabledPages,
    onLand: onValueChange,
    reduced: useMotionPreference() === 'reduced',
  });
  const frames = useFrames(index, pages.length);

  return (
    <GestureDetector gesture={drag.pan}>
      <View
        {...rest}
        onLayout={(event) => {
          drag.onLayout(event);
          onLayout?.(event);
        }}
        style={[styles.root, style]}
      >
        <Animated.View style={[styles.row, { width: `${pages.length * 100}%` }, drag.rowMotion]}>
          {pages.map((page, at) => (
            <PageFrame key={page.props.value} value={frames[at]!}>
              {page}
            </PageFrame>
          ))}
        </Animated.View>
        {/* Outside the row, so it stays put over the pages. */}
        {indicator ? (
          <PagerState
            value={{ position: drag.position, pageKeys: drag.pageKeys, renderedPages }}
          >
            {indicator}
          </PagerState>
        ) : null}
      </View>
    </GestureDetector>
  );
}

/** Each page's place, kept while `index` and the count stay, so the pages needn't render again. */
function useFrames(index: number, count: number) {
  return useMemo(() => {
    const width = `${100 / count}%` as const;
    return Array.from({ length: count }, (_, at) => ({ shown: at === index, width }));
  }, [index, count]);
}

/**
 * `Pager.Root`'s children: its pages, in order, and any indicator, which
 * takes no page's place. Not `Children.toArray`, which keys a page by its
 * place: its frame is keyed by its value, so a page that moves keeps its state.
 */
function partsOf(children: ReactNode): {
  pages: ReactElement<PagerPageProps>[];
  indicator: ReactElement | undefined;
} {
  const pages: ReactElement<PagerPageProps>[] = [];
  let indicator: ReactElement | undefined;
  Children.forEach(children, (child) => {
    if (child === null || child === undefined || typeof child === 'boolean') return;
    if (isValidElement<PagerPageProps>(child) && child.type === PagerPage) pages.push(child);
    else if (isValidElement(child) && child.type === PagerIndicator) {
      if (indicator) throw new Error('Pager.Root: it takes one Pager.Indicator, not two.');
      indicator = child;
    } else {
      throw new Error(
        'Pager.Root: each child must be a Pager.Page or Pager.Indicator, ' +
          'not one inside a Fragment or another component.',
      );
    }
  });
  return { pages, indicator };
}

/**
 * `Pager.Page`: one page of the `Pager.Root` it is a child of. Pages other
 * than the shown one are hidden from screen readers, and on the web are
 * `inert`, so focus skips them.
 */
function PagerPage({
  value: _value,
  disabled: _disabled,
  style,
  children,
  ...rest
}: PagerPageProps): JSX.Element {
  const frame = use(PageFrame);
  const outerShown = use(ActivePage);
  if (!frame) throw new Error('Pager.Page: render it as a child of Pager.Root.');
  const hidden = !frame.shown;
  return (
    <View
      {...rest}
      aria-hidden={hidden}
      // React Native's View types lack `inert`; react-native-web passes it to the element.
      {...(WEB ? { inert: hidden } : null)}
      style={[{ width: frame.width }, style]}
    >
      {/* A Page among this one's children belongs to no pager until it is in a Root. */}
      <PageFrame value={null}>
        <ActivePage value={outerShown && frame.shown}>{children}</ActivePage>
      </PageFrame>
    </View>
  );
}

/**
 * Whether the page around the caller is the one its pager shows, inside
 * every pager around it (true outside a pager), so a hidden page can stop
 * listening for keys or updates.
 */
export function usePagerIsActive(): boolean {
  return use(ActivePage);
}

export interface PagerNamespace {
  readonly Root: typeof PagerRoot;
  readonly Page: typeof PagerPage;
  readonly Indicator: typeof PagerIndicator;
}

export const Pager: PagerNamespace = {
  Root: PagerRoot,
  Page: PagerPage,
  Indicator: PagerIndicator,
};

const styles = StyleSheet.create({
  root: { overflow: 'hidden' },
  // As tall as the root when it has a height, so a page's scroll view scrolls inside it: a View
  // doesn't shrink by default.
  row: { flexDirection: 'row', flexGrow: 1, flexShrink: 1 },
});
