import { afterEach, beforeEach, expect, rs, test } from '@rstest/core';
import { act, render, screen } from '@testing-library/react';
import { type JSX, useRef, useState } from 'react';
import { I18nManager, Text, View } from 'react-native';
import { SilkProvider } from '../../theme/SilkProvider.js';

/**
 * jsdom loads neither library's native module, so they're stood in for as
 * in Slider.drag.test.tsx: the pan's config is kept to be called by hand, a
 * shared value is a plain object, an animated style is worked out as the
 * pager renders, and a spring lands at once, recording where it went and how
 * fast it began.
 */
const mocked = rs.hoisted(() => ({
  pan: undefined as undefined | Record<string, unknown>,
  touchAction: undefined as unknown,
  springs: [] as number[],
  speeds: [] as number[],
  /** While set, calls to the JavaScript thread wait here, as they would behind a busy thread. */
  toRN: undefined as undefined | (() => void)[],
}));

rs.mock('react-native-gesture-handler', () => ({
  GestureDetector: ({ children, touchAction }: { children: unknown; touchAction: unknown }) => {
    mocked.touchAction = touchAction;
    return children;
  },
  usePanGesture: (config: Record<string, unknown>) => {
    mocked.pan = config;
    return config;
  },
}));

rs.mock('react-native-reanimated', () => ({
  default: { View },
  cancelAnimation: () => {},
  defineAnimation: (
    _start: number,
    factory: () => {
      toValue: number;
      velocity: number;
      callback?: (finished: boolean) => void;
      onStart: (animation: object, value: number, now: number, previous?: object) => void;
    }
  ) => {
    const animation = factory();
    animation.onStart(animation, 0, 0, undefined);
    mocked.springs.push(animation.toValue);
    mocked.speeds.push(animation.velocity);
    animation.callback?.(true);
    return animation.toValue;
  },
  useAnimatedStyle: (style: () => object) => style(),
  useSharedValue: <T,>(value: T) =>
    useRef({
      value,
      get() {
        return this.value;
      },
      set(next: T) {
        this.value = next;
      },
    }).current,
}));

rs.mock('react-native-worklets', () => ({
  scheduleOnRN: (run: (...args: unknown[]) => void, ...args: unknown[]) =>
    mocked.toRN ? mocked.toRN.push(() => run(...args)) : run(...args),
  scheduleOnUI: (run: (...args: unknown[]) => void, ...args: unknown[]) => run(...args),
}));

const { Pager, usePagerIsActive } = await import('./Pager.js');

/** What each page's `usePagerIsActive` said last. */
const active: Record<string, boolean> = {};

function Page({ name }: { readonly name: string }): JSX.Element {
  active[name] = usePagerIsActive();
  return <Text>{name}</Text>;
}

/**
 * Three pages, `b` disabled while `bDisabled`, after a page `z` while
 * `withZ`. The owner takes each proposal unless `refuse`, and records them in
 * `proposals`.
 */
function Owner({
  initial = 'a',
  refuse = false,
  bDisabled = false,
  withZ = false,
  proposals,
  set,
}: {
  readonly initial?: string;
  readonly refuse?: boolean;
  readonly bDisabled?: boolean;
  readonly withZ?: boolean;
  readonly proposals: string[];
  readonly set?: { current?: (value: string) => void };
}): JSX.Element {
  const [value, setValue] = useState(initial);
  if (set) set.current = setValue;
  return (
    <SilkProvider>
      <Pager.Root
        testID="pager"
        value={value}
        onValueChange={(next) => {
          proposals.push(next);
          if (!refuse) setValue(next);
        }}
      >
        {withZ && (
          <Pager.Page value="z">
            <Page name="z" />
          </Pager.Page>
        )}
        <Pager.Page value="a">
          <Page name="a" />
        </Pager.Page>
        <Pager.Page value="b" disabled={bDisabled}>
          <Page name="b" />
        </Pager.Page>
        <Pager.Page value="c">
          <Page name="c" />
        </Pager.Page>
      </Pager.Root>
    </SilkProvider>
  );
}

/** Lays the pager out 400 wide, as a browser would report it. */
function layOut() {
  const root = screen.getByTestId('pager') as HTMLElement & {
    __reactLayoutHandler: (event: object) => void;
  };
  act(() =>
    root.__reactLayoutHandler({
      nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 300 } },
    })
  );
}

type Handler = (event?: object) => void;
const pan = (name: string, event?: object) => act(() => (mocked.pan![name] as Handler)(event));

/** A drag of `dx` points (negative toward later pages), let go at `velocityX` after `heldMs` still. */
function swipe(dx: number, velocityX = 0, heldMs = 0) {
  pan('onActivate');
  pan('onUpdate', { translationX: dx });
  clock += heldMs;
  pan('onDeactivate', { canceled: false, velocityX });
}

const hidden = (name: string) =>
  screen.getByText(name).parentElement!.getAttribute('aria-hidden') === 'true';

let clock = 0;

beforeEach(() => {
  mocked.springs.length = 0;
  mocked.speeds.length = 0;
  clock = 1000;
  rs.spyOn(Date, 'now').mockImplementation(() => clock);
});

afterEach(() => {
  mocked.toRN = undefined;
  rs.restoreAllMocks();
});

/** How far the row of pages is moved, as its style says. */
const rowShift = () => screen.getByText('a').parentElement!.parentElement!.style.transform;

test('shows the page its value names; the others are hidden from screen readers, focus and listeners', () => {
  render(<Owner initial="b" proposals={[]} />);
  expect(hidden('a')).toBe(true);
  expect(hidden('b')).toBe(false);
  expect(active).toEqual({ a: false, b: true, c: false });
  expect(screen.getByText('a').parentElement!.hasAttribute('inert')).toBe(true);
  expect(screen.getByText('b').parentElement!.hasAttribute('inert')).toBe(false);
  // A vertical swipe on a page stays the browser's scroll.
  expect(mocked.touchAction).toBe('pan-y');
});

test('a swipe past halfway settles on the next page and proposes it once', () => {
  const proposals: string[] = [];
  render(<Owner proposals={proposals} />);
  layOut();
  swipe(-240, 0, 100);
  expect(proposals).toEqual(['b']);
  expect(mocked.springs.at(-1)).toBe(1);
  expect(hidden('b')).toBe(false);
  // The owner's answer finds the pages already heading there: no second spring.
  expect(mocked.springs.filter((to) => to === 1)).toHaveLength(1);
});

test('a short fling goes on to the next page at the finger’s speed', () => {
  const proposals: string[] = [];
  render(<Owner proposals={proposals} />);
  layOut();
  swipe(-40, -800);
  expect(proposals).toEqual(['b']);
  expect(mocked.springs.at(-1)).toBe(1);
  // 800 pt/s across a 400-wide page: 2 pages a second, toward later pages.
  expect(mocked.speeds.at(-1)).toBe(2);
});

test('a short, slow swipe settles back and proposes nothing', () => {
  const proposals: string[] = [];
  render(<Owner proposals={proposals} />);
  layOut();
  swipe(-100, -200);
  expect(proposals).toEqual([]);
  expect(mocked.springs.at(-1)).toBe(0);
});

test('a page the owner turns down settles back', () => {
  const proposals: string[] = [];
  render(<Owner refuse proposals={proposals} />);
  layOut();
  swipe(-300, 0, 100);
  expect(proposals).toEqual(['b']);
  expect(mocked.springs.slice(-2)).toEqual([1, 0]);
  expect(hidden('a')).toBe(false);
});

test('a swipe never lands on a disabled page', () => {
  const proposals: string[] = [];
  render(<Owner bDisabled proposals={proposals} />);
  layOut();
  swipe(-380, -2000);
  expect(proposals).toEqual([]);
  expect(mocked.springs.at(-1)).toBe(0);
});

test('a new value springs there; a finger holding the pages wins until it lets go', () => {
  const set: { current?: (value: string) => void } = {};
  render(<Owner proposals={[]} set={set} />);
  layOut();
  act(() => set.current!('c'));
  expect(mocked.springs.at(-1)).toBe(2);

  pan('onActivate');
  pan('onUpdate', { translationX: 40 });
  const before = mocked.springs.length;
  act(() => set.current!('a'));
  expect(mocked.springs).toHaveLength(before);
  clock += 100;
  pan('onDeactivate', { canceled: false, velocityX: 0 });
  expect(mocked.springs.at(-1)).toBe(0);
});

test('before layout, the row already shows the page the value names', () => {
  render(<Owner initial="b" proposals={[]} />);
  // b is the second of three pages: a third of the row's width along.
  expect(rowShift()).toMatch(/translateX\(-33\.333+\d*%\)/);
});

test('a page added before the shown one moves nothing', () => {
  const { rerender } = render(<Owner initial="b" proposals={[]} />);
  layOut();
  const before = mocked.springs.length;
  rerender(<Owner initial="b" withZ proposals={[]} />);
  expect(mocked.springs).toHaveLength(before);
  expect(hidden('b')).toBe(false);
  // The stand-in works the style out as the pager renders, not as its values change.
  rerender(<Owner initial="b" withZ proposals={[]} />);
  // b is now the third of four pages.
  expect(rowShift()).toBe('translateX(-50%)');
});

test('caught again before the owner hears of the last swipe, the pages stay on its page', () => {
  const proposals: string[] = [];
  render(<Owner proposals={proposals} />);
  layOut();
  mocked.toRN = [];
  swipe(-240, 0, 100);
  // Caught and let go where they are, while the report waits.
  swipe(0, 0, 100);
  expect(mocked.springs.slice(-2)).toEqual([1, 1]);
  const waiting = mocked.toRN;
  mocked.toRN = undefined;
  act(() => waiting.forEach((run) => run()));
  expect(proposals).toEqual(['b']);
  expect(mocked.springs.at(-1)).toBe(1);
});

test('right to left, a swipe toward later pages runs rightward', () => {
  const layout = I18nManager as { isRTL?: boolean };
  layout.isRTL = true;
  try {
    const proposals: string[] = [];
    render(<Owner proposals={proposals} />);
    layOut();
    swipe(240, 0, 100);
    expect(proposals).toEqual(['b']);
    expect(rowShift()).toMatch(/translateX\(33\.333+\d*%\)/);
  } finally {
    layout.isRTL = undefined;
  }
});

test('a page inside a hidden page is inactive', () => {
  render(
    <SilkProvider>
      <Pager.Root value="a" onValueChange={() => {}}>
        <Pager.Page value="a">
          <Page name="a" />
        </Pager.Page>
        <Pager.Page value="b">
          <Pager.Root value="inner" onValueChange={() => {}}>
            <Pager.Page value="inner">
              <Page name="inner" />
            </Pager.Page>
          </Pager.Root>
        </Pager.Page>
      </Pager.Root>
    </SilkProvider>
  );
  expect(active.a).toBe(true);
  expect(active.inner).toBe(false);
});

test('children other than distinct Pager.Page elements throw, and so does a Page outside a Root', () => {
  rs.spyOn(console, 'error').mockImplementation(() => {});
  const pager = (children: JSX.Element) => (
    <SilkProvider>
      <Pager.Root value="a" onValueChange={() => {}}>
        {children}
      </Pager.Root>
    </SilkProvider>
  );
  expect(() =>
    render(
      pager(
        <>
          <Pager.Page value="a" />
        </>
      )
    )
  ).toThrow(/each child must be a Pager.Page/);
  expect(() => render(pager(<View />))).toThrow(/each child must be a Pager.Page/);
  expect(() =>
    render(
      <SilkProvider>
        <Pager.Root value="a" onValueChange={() => {}}>
          <Pager.Page value="a" />
          <Pager.Page value="a" />
        </Pager.Root>
      </SilkProvider>
    )
  ).toThrow(/same value/);
  expect(() => render(<Pager.Page value="a" />)).toThrow(/child of Pager.Root/);
});
