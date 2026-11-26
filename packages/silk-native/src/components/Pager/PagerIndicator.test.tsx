import { expect, rs, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import { type ReactNode, useRef } from 'react';
import { View } from 'react-native';
import type { Theme } from '@reactive/silk-core';
import { SilkProvider } from '../../theme/SilkProvider.js';
import { useTheme } from '../../theme/ThemeProvider.js';

// As in Pager.test.tsx: no native modules in jsdom, so an animated style is
// worked out as it renders, a shared value is a plain object and a spring
// lands at once.
rs.mock('react-native-gesture-handler', () => ({
  GestureDetector: ({ children }: { children: unknown }) => children,
  usePanGesture: (config: unknown) => config,
}));

rs.mock('react-native-reanimated', () => ({
  default: { View },
  cancelAnimation: () => {},
  // A spring lands at once.
  defineAnimation: (_start: number, factory: () => object) => factory(),
  useAnimatedStyle: (style: () => object) => style(),
  useSharedValue: <T,>(initial: T) =>
    useRef({
      current: initial,
      get value(): T {
        return this.current;
      },
      set value(next: T) {
        const spring = next as { toValue?: T } | null;
        this.current = typeof spring === 'object' && spring?.toValue !== undefined ? spring.toValue : next;
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

let theme: Theme | undefined;
function ThemeProbe() {
  theme = useTheme().theme;
  return null;
}

function pager(value: string, children: ReactNode) {
  return (
    <SilkProvider>
      <ThemeProbe />
      <Pager.Root testID="pager" value={value} onValueChange={() => {}}>
        {children}
      </Pager.Root>
    </SilkProvider>
  );
}

/** The indicator's dots, in order: each one's width, its own color, and its shown ink's opacity. */
function dots() {
  const row = screen.getByTestId('dots');
  return [...row.children].map((dot) => {
    const own = getComputedStyle(dot);
    return {
      width: own.width,
      color: own.backgroundColor,
      ink: getComputedStyle(dot.firstElementChild!).opacity,
    };
  });
}

const rgb = (color: string) => {
  const probe = document.createElement('div');
  probe.style.backgroundColor = color;
  return probe.style.backgroundColor;
};

test('a dot for each page, the shown page a pill in the strongest ink, wherever the indicator is written', () => {
  render(
    pager('b', [
      <Pager.Indicator key="dots" testID="dots" />,
      <Pager.Page key="a" value="a" />,
      <Pager.Page key="b" value="b" />,
      <Pager.Page key="c" value="c" />,
    ]),
  );
  const { space } = theme!.semantic;
  expect(dots().map((dot) => [dot.width, dot.ink])).toEqual([
    [`${space[2]}px`, '0'],
    [`${space[6]}px`, '1'],
    [`${space[2]}px`, '0'],
  ]);
});

test("a disabled page's dot is fainter, until the owner shows it", () => {
  const pages = [
    <Pager.Page key="a" value="a" />,
    <Pager.Page key="b" value="b" disabled />,
    <Pager.Indicator key="dots" testID="dots" />,
  ];
  const { rerender } = render(pager('a', pages));
  const { color } = theme!.semantic;
  expect(dots().map((dot) => dot.color)).toEqual([
    rgb(color.textSecondary),
    rgb(color.borderSubtle),
  ]);
  rerender(pager('b', pages));
  // The pages spring there after the render, which the stand-in styles hear only in the next.
  rerender(pager('b', pages));
  expect(dots()[1]).toMatchObject({ width: `${theme!.semantic.space[6]}px`, ink: '1' });
});

test('it only shows: hidden from screen readers, and a press passes through it', () => {
  render(pager('a', [<Pager.Page key="a" value="a" />, <Pager.Indicator key="dots" testID="dots" />]));
  const row = screen.getByTestId('dots');
  expect(row.getAttribute('aria-hidden')).toBe('true');
  expect(getComputedStyle(row).pointerEvents).toBe('none');
  // It stays put over the pages, outside the row that moves.
  expect(row.parentElement).toBe(screen.getByTestId('pager'));
});

test('two indicators, one in a Fragment, or one outside a Root throw', () => {
  rs.spyOn(console, 'error').mockImplementation(() => {});
  const page = <Pager.Page key="a" value="a" />;
  expect(() =>
    render(pager('a', [page, <Pager.Indicator key="1" />, <Pager.Indicator key="2" />])),
  ).toThrow(/one Pager.Indicator/);
  expect(() =>
    render(
      pager('a', [
        page,
        <>
          <Pager.Indicator />
        </>,
      ]),
    ),
  ).toThrow(/each child must be a Pager.Page or Pager.Indicator/);
  expect(() => render(<Pager.Indicator />)).toThrow(/child of Pager.Root/);
});
