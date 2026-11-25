import { afterEach, beforeEach, expect, rs, test } from '@rstest/core';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { type JSX, type ReactNode, startTransition, useRef, useState } from 'react';
import { I18nManager, Text, View } from 'react-native';
import { SilkProvider } from '../../theme/SilkProvider.js';

/**
 * jsdom loads neither library's native module, so they're stood in for as
 * in Slider.drag.test.tsx: the pan's config is kept to be called by hand, a
 * shared value is a plain object, an animated style is worked out as the
 * pager renders, and a spring lands at once, recording where it went, how
 * fast it began and whether it jumps for reduced motion.
 */
const mocked = rs.hoisted(() => ({
  pan: undefined as undefined | Record<string, unknown>,
  springs: [] as number[],
  speeds: [] as number[],
  reduced: [] as boolean[],
  /** The row's animated style as last worked out. */
  row: undefined as unknown,
  /** While set, a spring is still on its way, here, when the test looks. */
  midway: undefined as number | undefined,
  /** While set, calls to the JavaScript thread wait here, as they would behind a busy thread. */
  toRN: undefined as undefined | (() => void)[],
}));

rs.mock('react-native-gesture-handler', () => ({
  GestureDetector: ({ children }: { children: unknown }) => children,
  usePanGesture: (config: Record<string, unknown>) => {
    mocked.pan = config;
    return config;
  },
}));

/** A `springTo` animation, as far as these tests start it. */
interface SpringStandIn {
  toValue: number;
  velocity: number;
  callback?: (finished: boolean) => void;
  reduceMotion: boolean;
  onStart: (animation: object, value: number, now: number, previous?: object) => void;
}

const isSpring = (value: unknown): value is SpringStandIn =>
  typeof (value as { onStart?: unknown } | null)?.onStart === 'function';

/** Starts `animation` from `from`, records it, and lands it at once, or at `midway`. */
function start(animation: SpringStandIn, from: number): number {
  animation.onStart(animation, from, 0, undefined);
  mocked.springs.push(animation.toValue);
  mocked.speeds.push(animation.velocity);
  mocked.reduced.push(animation.reduceMotion);
  if (mocked.midway !== undefined) return mocked.midway;
  animation.callback?.(true);
  return animation.toValue;
}

rs.mock('react-native-reanimated', () => ({
  default: { View },
  cancelAnimation: () => {},
  // A spring starts when it is set on a shared value, from where that value is.
  defineAnimation: (_start: number, factory: () => SpringStandIn) => factory(),
  useAnimatedStyle: (style: () => object) => (mocked.row = style()),
  useSharedValue: <T,>(initial: T) =>
    useRef({
      current: initial,
      get value(): T {
        return this.current;
      },
      set value(next: T) {
        this.current = isSpring(next) ? (start(next, this.current as number) as T) : next;
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
 * `withZ`. The owner records each proposal in `proposals` and answers it as
 * `answer` says: taking it at once or in a transition, keeping its value, or
 * throwing.
 */
function Owner({
  initial = 'a',
  answer = 'take',
  bDisabled = false,
  withZ = false,
  proposals,
  set,
}: {
  readonly initial?: string;
  /** `late`: in a transition, behind an urgent render of something else. */
  readonly answer?: 'take' | 'transition' | 'late' | 'refuse' | 'throw';
  readonly bDisabled?: boolean;
  readonly withZ?: boolean;
  readonly proposals: string[];
  readonly set?: { current?: (value: string) => void };
}): JSX.Element {
  const [value, setValue] = useState(initial);
  const [, renderUrgently] = useState(0);
  if (set) set.current = setValue;
  return (
    <SilkProvider>
      <Pager.Root
        testID="pager"
        value={value}
        onValueChange={(next) => {
          proposals.push(next);
          if (answer === 'take') setValue(next);
          else if (answer === 'transition') startTransition(() => setValue(next));
          else if (answer === 'late') {
            startTransition(() => setValue(next));
            renderUrgently((renders) => renders + 1);
          } else if (answer === 'throw') throw new Error('owner failed');
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
    }),
  );
}

type Handler = (event?: object) => void;
const pan = (name: string, event?: object) => act(() => (mocked.pan![name] as Handler)(event));

/** Runs `during` with calls to the JavaScript thread held back, as behind a busy thread. */
function heldBack(during: () => void): (() => void)[] {
  mocked.toRN = [];
  during();
  const waiting = mocked.toRN;
  mocked.toRN = undefined;
  return waiting;
}

/** A drag of `dx` points (negative toward later pages), let go at `velocityX` after `heldMs` still. */
function swipe(dx: number, velocityX = 0, heldMs = 0) {
  pan('onActivate', { translationX: 0 });
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
  mocked.reduced.length = 0;
  clock = 1000;
  rs.spyOn(Date, 'now').mockImplementation(() => clock);
});

afterEach(() => {
  mocked.toRN = undefined;
  mocked.midway = undefined;
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
  render(<Owner answer="refuse" proposals={proposals} />);
  layOut();
  swipe(-300, 0, 100);
  expect(proposals).toEqual(['b']);
  expect(mocked.springs.slice(-2)).toEqual([1, 0]);
  expect(hidden('a')).toBe(false);
});

test('a swipe passes a disabled page by, to the next page beyond it', () => {
  const proposals: string[] = [];
  render(<Owner bDisabled proposals={proposals} />);
  layOut();
  swipe(-380, -2000);
  expect(proposals).toEqual(['c']);
  expect(mocked.springs.at(-1)).toBe(2);
  expect(hidden('b')).toBe(true);
});

test('a new value springs there; a finger holding the pages wins until it lets go', () => {
  const set: { current?: (value: string) => void } = {};
  render(<Owner proposals={[]} set={set} />);
  layOut();
  act(() => set.current!('c'));
  expect(mocked.springs.at(-1)).toBe(2);

  pan('onActivate', { translationX: 0 });
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
  const waiting = heldBack(() => {
    swipe(-240, 0, 100);
    // Caught and let go where they are, while the report waits.
    swipe(0, 0, 100);
  });
  expect(mocked.springs.slice(-2)).toEqual([1, 1]);
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
    </SilkProvider>,
  );
  expect(active.a).toBe(true);
  expect(active.inner).toBe(false);
});

test('children other than distinct Pager.Page elements throw, and so does a Page outside a Root', () => {
  rs.spyOn(console, 'error').mockImplementation(() => {});
  const pager = (children: ReactNode) => (
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
        </>,
      ),
    ),
  ).toThrow(/each child must be a Pager.Page/);
  expect(() => render(pager(<View />))).toThrow(/each child must be a Pager.Page/);
  expect(() =>
    render(pager([<Pager.Page key="1" value="a" />, <Pager.Page key="2" value="a" />])),
  ).toThrow(/same value/);
  expect(() => render(<Pager.Page value="a" />)).toThrow(/child of Pager.Root/);
});

test('the pages follow the finger from where the swipe took hold, past its touch slop', () => {
  const proposals: string[] = [];
  render(<Owner proposals={proposals} />);
  layOut();
  // Gesture Handler counts the finger's travel from where it touched down: 205 points
  // there, but 197 since the swipe took hold, short of half the page.
  pan('onActivate', { translationX: -8 });
  pan('onUpdate', { translationX: -205 });
  clock += 100;
  pan('onDeactivate', { canceled: false, velocityX: 0 });
  expect(proposals).toEqual([]);
  expect(mocked.springs.at(-1)).toBe(0);
});

test('a page added and named at once springs there', () => {
  const set: { current?: (value: string) => void } = {};
  const { rerender } = render(<Owner proposals={[]} set={set} />);
  layOut();
  act(() => {
    set.current!('z');
    rerender(<Owner proposals={[]} set={set} withZ />);
  });
  // z is the first page now; the pages were at a, now the second.
  expect(mocked.springs.at(-1)).toBe(0);
  expect(hidden('z')).toBe(false);
});

test('two swipes before React hears of the first go straight on, with no pull back', () => {
  const proposals: string[] = [];
  render(<Owner proposals={proposals} />);
  layOut();
  const waiting = heldBack(() => {
    swipe(-240, 0, 100);
    swipe(-240, 0, 100);
  });
  // React renders b, the first page reported, while the pages are already on c.
  for (const run of waiting) act(run);
  expect(proposals).toEqual(['b', 'c']);
  expect(mocked.springs).toEqual([1, 2]);
});

test('a release onto a page React removed or disabled meanwhile proposes nothing', () => {
  const proposals: string[] = [];
  const { rerender } = render(<Owner proposals={proposals} />);
  layOut();
  const waiting = heldBack(() => {
    swipe(-240, 0, 100);
    rerender(<Owner proposals={proposals} bDisabled />);
  });
  act(() => waiting.forEach((run) => run()));
  expect(proposals).toEqual([]);
  expect(mocked.springs.at(-1)).toBe(0);
  expect(hidden('a')).toBe(false);
});

test('an owner that answers in a transition sees no bounce', async () => {
  const proposals: string[] = [];
  render(<Owner answer="transition" proposals={proposals} />);
  layOut();
  swipe(-240, 0, 100);
  await act(async () => {});
  expect(proposals).toEqual(['b']);
  expect(mocked.springs).toEqual([1]);
});

test('an urgent render before an owner’s transition commits keeps the pages on its page', async () => {
  const proposals: string[] = [];
  render(<Owner answer="late" proposals={proposals} />);
  layOut();
  swipe(-240, 0, 100);
  await act(async () => {});
  expect(proposals).toEqual(['b']);
  expect(mocked.springs).toEqual([1]);
});

test('an owner that throws still sees the pages settle back', () => {
  rs.spyOn(console, 'error').mockImplementation(() => {});
  render(<Owner answer="throw" proposals={[]} />);
  layOut();
  expect(() => swipe(-240, 0, 100)).toThrow(/owner failed/);
  act(() => {});
  expect(mocked.springs.at(-1)).toBe(0);
});

test('a canceled swipe settles back, proposing nothing', () => {
  const proposals: string[] = [];
  render(<Owner proposals={proposals} />);
  layOut();
  pan('onActivate', { translationX: 0 });
  pan('onUpdate', { translationX: -300 });
  pan('onDeactivate', { canceled: true, velocityX: -2000 });
  expect(proposals).toEqual([]);
  expect(mocked.springs.at(-1)).toBe(0);
});

test('settling back past the first page, the pages drop the speed carrying them out', () => {
  render(<Owner proposals={[]} />);
  layOut();
  swipe(60, 2000);
  expect(mocked.springs.at(-1)).toBe(0);
  expect(mocked.speeds.at(-1)).toBe(0);
});

test('a swipe let go on the page the owner named meanwhile proposes nothing', () => {
  const proposals: string[] = [];
  const set: { current?: (value: string) => void } = {};
  render(<Owner proposals={proposals} set={set} />);
  layOut();
  pan('onActivate', { translationX: 0 });
  pan('onUpdate', { translationX: -240 });
  act(() => set.current!('b'));
  clock += 100;
  pan('onDeactivate', { canceled: false, velocityX: 0 });
  expect(mocked.springs.at(-1)).toBe(1);
  expect(proposals).toEqual([]);
});

test('the page the owner named during one swipe is forgotten by the next', () => {
  const set: { current?: (value: string) => void } = {};
  render(<Owner proposals={[]} set={set} />);
  layOut();
  pan('onActivate', { translationX: 0 });
  act(() => set.current!('c'));
  clock += 100;
  pan('onDeactivate', { canceled: false, velocityX: 0 });
  expect(mocked.springs.at(-1)).toBe(2);
  act(() => set.current!('a'));
  // A short swipe from a: back to a, not to c.
  swipe(-40, 0, 100);
  expect(mocked.springs.at(-1)).toBe(0);
});

test('caught mid-flight, the pages stay under the finger', () => {
  const { rerender } = render(<Owner proposals={[]} />);
  layOut();
  // The spring to b is halfway there when the finger catches it.
  mocked.midway = 0.5;
  swipe(-240, 0, 100);
  pan('onActivate', { translationX: 0 });
  pan('onUpdate', { translationX: 0 });
  rerender(<Owner proposals={[]} />);
  // Half a page of three: a sixth of the row.
  expect(rowShift()).toMatch(/translateX\(-16\.66+\d*%\)/);
});

test('before layout, a drag moves nothing', () => {
  const proposals: string[] = [];
  const { rerender } = render(<Owner proposals={proposals} />);
  pan('onActivate', { translationX: 0 });
  pan('onUpdate', { translationX: -240 });
  rerender(<Owner proposals={proposals} />);
  expect(mocked.row).toEqual({ transform: [{ translateX: '0%' }] });
});

test('right to left, a fling toward later pages carries its speed that way', () => {
  const layout = I18nManager as { isRTL?: boolean };
  layout.isRTL = true;
  try {
    render(<Owner proposals={[]} />);
    layOut();
    swipe(40, 800);
    expect(mocked.springs.at(-1)).toBe(1);
    expect(mocked.speeds.at(-1)).toBe(2);
  } finally {
    layout.isRTL = undefined;
  }
});

test('with reduced motion, the pages jump', () => {
  const page = globalThis as { matchMedia?: unknown };
  page.matchMedia = () => ({
    matches: true,
    addEventListener: () => {},
    removeEventListener: () => {},
  });
  try {
    render(<Owner proposals={[]} />);
    layOut();
    swipe(-240, 0, 100);
    expect(mocked.reduced.at(-1)).toBe(true);
  } finally {
    delete page.matchMedia;
  }
});

test('a mouse drag over a pressable does not also press it', () => {
  const presses: string[] = [];
  render(
    <SilkProvider>
      <Pager.Root testID="pager" value="a" onValueChange={() => {}}>
        <Pager.Page value="a">
          <Text onPress={() => presses.push('a')}>a</Text>
        </Pager.Page>
      </Pager.Root>
    </SilkProvider>,
  );
  layOut();
  swipe(-100, 0, 100);
  // The browser clicks what the button went down on when it comes up.
  fireEvent.click(screen.getByText('a'));
  expect(presses).toEqual([]);
});

test('pages relisted mid-spring, before React hears of the release, go on to their page', () => {
  const proposals: string[] = [];
  const { rerender } = render(<Owner proposals={proposals} />);
  layOut();
  const waiting = heldBack(() => {
    // The spring to b is halfway there when a page is added before a.
    mocked.midway = 0.5;
    swipe(-240, 0, 100);
    mocked.midway = undefined;
    rerender(<Owner proposals={proposals} withZ />);
  });
  // b is the third page now.
  expect(mocked.springs.at(-1)).toBe(2);
  act(() => waiting.forEach((run) => run()));
  expect(proposals).toEqual(['b']);
  expect(hidden('b')).toBe(false);
});

test('React rendering the page a spring is heading to leaves the spring alone', () => {
  render(<Owner proposals={[]} />);
  layOut();
  // Still on its way to b when the owner's answer renders.
  mocked.midway = 0.5;
  swipe(-240, -800);
  expect(mocked.springs).toEqual([1]);
  expect(mocked.speeds).toEqual([2]);
});

test('a page keeps its state when pages before it come and go', () => {
  rs.spyOn(console, 'error').mockImplementation(() => {});
  let mounts = 0;
  function Counted(): JSX.Element {
    useState(() => mounts++);
    return <Text>counted</Text>;
  }
  // Pages without keys of their own, so their place names them.
  const pager = (names: readonly string[]) => (
    <SilkProvider>
      <Pager.Root value="b" onValueChange={() => {}}>
        {names.map((name) => (
          <Pager.Page value={name}>{name === 'b' ? <Counted /> : <Page name={name} />}</Pager.Page>
        ))}
      </Pager.Root>
    </SilkProvider>
  );
  const { rerender } = render(pager(['a', 'b']));
  rerender(pager(['z', 'a', 'b']));
  expect(mounts).toBe(1);
});
