import { expect, rs, test } from '@rstest/core';
import { act, render, screen } from '@testing-library/react';
import { type ReactNode, useRef } from 'react';
import { View } from 'react-native';
import { createTheme } from '@reactive/silk-core';
import { SilkProvider } from '../../theme/SilkProvider.js';

// As in Pager.test.tsx: no native modules in jsdom, so the pan's config is
// kept to be called by hand, an animated style is worked out as it renders,
// a shared value is a plain object and a spring lands at once.
const mocked = rs.hoisted(() => ({ pan: undefined as undefined | Record<string, unknown> }));

rs.mock('react-native-gesture-handler', () => ({
  GestureDetector: ({ children }: { children: unknown }) => children,
  usePanGesture: (config: Record<string, unknown>) => (mocked.pan = config),
}));

rs.mock('react-native-reanimated', () => ({
  default: { View },
  cancelAnimation: () => {},
  defineAnimation: (_start: number, factory: () => object) => factory(),
  // The shown ink once a page is shown at all, so a test can tell the dot's color.
  interpolateColor: (share: number, _range: number[], [own, shown]: string[]) =>
    share > 0 ? shown : own,
  useAnimatedStyle: (style: () => object) => style(),
  useSharedValue: <T,>(initial: T) =>
    useRef({
      current: initial,
      get value(): T {
        return this.current;
      },
      set value(next: T) {
        const spring = next as { toValue?: T } | null;
        const springs = typeof spring === 'object' && spring?.toValue !== undefined;
        this.current = springs ? spring.toValue! : next;
      },
      get() {
        return this.value;
      },
      set(next: T) {
        this.value = next;
      },
    }).current,
}));

rs.mock('react-native-worklets', () => ({
  scheduleOnRN: (run: (...args: unknown[]) => void, ...args: unknown[]) => run(...args),
  scheduleOnUI: (run: (...args: unknown[]) => void, ...args: unknown[]) => run(...args),
}));

const { Pager } = await import('./Pager.js');

const theme = createTheme();
const { color, space } = theme.semantic;

function pager(value: string, children: ReactNode) {
  return (
    <SilkProvider theme={theme}>
      <Pager.Root testID="pager" value={value} onValueChange={() => {}}>
        {children}
      </Pager.Root>
    </SilkProvider>
  );
}

const pages = (values: readonly string[], disabled?: string) =>
  values.map((value) => <Pager.Page key={value} value={value} disabled={value === disabled} />);

const indicator = <Pager.Indicator key="dots" testID="dots" />;

/** The indicator's dots, in order: each one's width and color. */
function dots() {
  return [...screen.getByTestId('dots').children].map((dot) => {
    const style = getComputedStyle(dot);
    return { width: style.width, color: style.backgroundColor };
  });
}

/** `color` as the browser writes it back. */
const rgb = (color: string) => {
  const probe = document.createElement('div');
  probe.style.backgroundColor = color;
  return probe.style.backgroundColor;
};

const px = (step: 2 | 6) => `${space[step]}px`;

/**
 * Renders `element` twice: the pages move on the UI thread after a render,
 * and the stand-in styles are worked out only as the indicator renders.
 */
function settle(rerender: (element: ReactNode) => void, element: ReactNode) {
  rerender(element);
  rerender(element);
}

test('a dot for each page, the shown one a pill in the strongest ink, written anywhere', () => {
  render(pager('b', [indicator, ...pages(['a', 'b', 'c'])]));
  expect(dots()).toEqual([
    { width: px(2), color: rgb(color.textSecondary) },
    { width: px(6), color: rgb(color.textPrimary) },
    { width: px(2), color: rgb(color.textSecondary) },
  ]);
});

test("a disabled page's dot is fainter, but a pill when the owner shows that page", () => {
  const { unmount } = render(pager('a', [...pages(['a', 'b'], 'b'), indicator]));
  expect(dots()[1]!.color).toBe(rgb(color.borderSubtle));
  unmount();
  render(pager('b', [...pages(['a', 'b'], 'b'), indicator]));
  expect(dots()[1]).toEqual({ width: px(6), color: rgb(color.textPrimary) });
});

test('a page added before the shown one leaves the pill on that page', () => {
  const { rerender } = render(pager('b', [...pages(['a', 'b', 'c']), indicator]));
  settle(rerender, pager('b', [...pages(['z', 'a', 'b', 'c']), indicator]));
  expect(dots().map((dot) => dot.width)).toEqual([px(2), px(2), px(6), px(2)]);
});

test('halfway through a swipe, the two pages share the pill', () => {
  const { rerender } = render(pager('a', [...pages(['a', 'b', 'c']), indicator]));
  const root = screen.getByTestId('pager') as HTMLElement & {
    __reactLayoutHandler: (event: object) => void;
  };
  act(() =>
    root.__reactLayoutHandler({ nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 300 } } }),
  );
  const pan = (name: string, event: object) =>
    act(() => (mocked.pan![name] as (event: object) => void)(event));
  pan('onActivate', { translationX: 0 });
  pan('onUpdate', { translationX: -200 });
  rerender(pager('a', [...pages(['a', 'b', 'c']), indicator]));
  const [a, b, c] = dots().map((dot) => parseFloat(dot.width));
  expect(a).toBeCloseTo(b!);
  expect(a).toBeGreaterThan(parseFloat(px(2)));
  expect(c).toBe(parseFloat(px(2)));
});

test('it only shows: hidden from screen readers, a press passes through, and it stays put', () => {
  render(pager('a', [...pages(['a']), indicator]));
  const row = screen.getByTestId('dots');
  expect(row.getAttribute('aria-hidden')).toBe('true');
  expect(getComputedStyle(row).pointerEvents).toBe('none');
  // Outside the row of pages that moves.
  expect(row.parentElement).toBe(screen.getByTestId('pager'));
});

test('two indicators, one in a Fragment, or one outside a Root throw', () => {
  rs.spyOn(console, 'error').mockImplementation(() => {});
  const page = pages(['a']);
  expect(() =>
    render(pager('a', [...page, <Pager.Indicator key="1" />, <Pager.Indicator key="2" />])),
  ).toThrow(/one Pager.Indicator/);
  expect(() =>
    render(
      pager('a', [
        ...page,
        <>
          <Pager.Indicator />
        </>,
      ]),
    ),
  ).toThrow(/each child must be a Pager.Page or Pager.Indicator/);
  expect(() => render(<Pager.Indicator />)).toThrow(/child of Pager.Root/);
});
