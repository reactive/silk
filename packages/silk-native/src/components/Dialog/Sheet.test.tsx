import { createTheme } from '@reactive/silk-core';
import { afterEach, beforeEach, expect, rs, test } from '@rstest/core';
import { act, render, screen } from '@testing-library/react';
import { type ComponentProps, use, useLayoutEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { MeasuredDimensions } from 'react-native-reanimated';
import { setPrefersReducedMotion } from '../../../../../test/rstest-setup';
import { FloatingHostContext } from '../../overlay/layer.js';
import { SilkProvider } from '../../theme/SilkProvider.js';

/**
 * jsdom loads neither library's native module, so they're stood in for: the
 * pan's callbacks are kept to be called by hand, a shared value is a plain
 * object, and a spring lands at once, reporting where it went.
 */
const mocked = rs.hoisted(() => ({
  pan: undefined as undefined | Record<string, (event?: object) => void>,
  springs: [] as number[],
  /** The release speed each spring started with. */
  speeds: [] as number[],
  /** Whether a spring lands at once; off, it is still running. */
  finish: true,
  /** The nodes handed to a sheet's scroll ref. */
  scrolls: [] as unknown[],
  /** The sheet's scroll view's box on the page, as `measure` reports it. */
  box: null as Pick<MeasuredDimensions, 'pageX' | 'pageY' | 'width' | 'height'> | null,
  /** Where a spring is when it doesn't finish (default: its target), as if caught on the way. */
  caughtAt: undefined as number | undefined,
  /** How far the sheet's content is scrolled. */
  scrollY: 0,
}));

// The factories run at the sheet's import below, after this file's own imports.
rs.mock('react-native-gesture-handler', () => ({
  GestureDetector: ({ children }: { children: unknown }) => children,
  GestureHandlerRootView: View,
  ScrollView,
  usePanGesture: (config: NonNullable<typeof mocked.pan>) => {
    mocked.pan = config;
    return config;
  },
}));

rs.mock('react-native-reanimated', () => ({
  default: { View: LaidOutView, createAnimatedComponent: (component: unknown) => component },
  cancelAnimation: () => {},
  // springTo's animation, started at once: it reports where it went and how fast it began.
  defineAnimation: (
    _start: number,
    factory: () => {
      toValue: number;
      velocity: number;
      callback?: (finished: boolean) => void;
      onStart: (animation: object, value: number, now: number, previous?: object) => void;
    },
  ) => {
    const animation = factory();
    animation.onStart(animation, 0, 0, undefined);
    mocked.springs.push(animation.toValue);
    mocked.speeds.push(animation.velocity);
    if (mocked.finish) animation.callback?.(true);
    return mocked.finish ? animation.toValue : (mocked.caughtAt ?? animation.toValue);
  },
  interpolate: () => 1,
  measure: () => mocked.box,
  scrollTo: () => {},
  useAnimatedRef: () => (node: unknown) => {
    if (node) mocked.scrolls.push(node);
  },
  useAnimatedStyle: (style: () => object) => style(),
  useScrollOffset: (_ref: unknown, offset: { value: number }) => {
    offset.value = mocked.scrollY;
  },
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
  scheduleOnRN: (run: (...args: unknown[]) => void, ...args: unknown[]) => run(...args),
}));

/** jsdom lays nothing out, so an animated view reports a sheet's height once. */
function LaidOutView({ onLayout, ...props }: ComponentProps<typeof View>) {
  useLayoutEffect(() => {
    onLayout?.({ nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 600 } } } as never);
  }, []);
  return <View {...props} />;
}

const { Dialog } = await import('./Dialog.js');

const theme = createTheme({ colorScheme: 'dark' });

/** A bottom sheet whose owner closes it when asked, unless `keepOpen`; `scroll` adds content. */
function Harness({
  keepOpen = false,
  scroll = false,
}: {
  readonly keepOpen?: boolean;
  readonly scroll?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const [asks, setAsks] = useState(0);
  return (
    <SilkProvider theme={theme}>
      <Dialog.Root
        open={open}
        onOpenChange={(next) => {
          setAsks((count) => count + 1);
          if (!keepOpen) setOpen(next);
        }}
      >
        <Dialog.Content placement="bottom" testID="sheet">
          <Dialog.Title>Settings</Dialog.Title>
          {scroll ? <Dialog.ScrollView /> : null}
        </Dialog.Content>
      </Dialog.Root>
      <span data-testid="asks">{asks}</span>
    </SilkProvider>
  );
}

/** Drags the sheet down by `distance` (pressed at `at`, if given) and lets go at `velocity`. */
function fling(
  distance: number,
  velocity: number,
  at?: { readonly absoluteX: number; readonly absoluteY: number },
) {
  act(() => {
    if (at) mocked.pan!.onBegin!(at);
    mocked.pan!.onActivate!();
    mocked.pan!.onUpdate!({ changeY: distance });
    mocked.pan!.onDeactivate!({ canceled: false, velocityY: velocity });
  });
}

const asks = () => screen.getByTestId('asks').textContent;

/** The clock the sheet reads to tell a held finger from a moving one (ms). */
let now = 0;

beforeEach(() => {
  // react-native-web's Modal shows its content once an entrance animation ends, which jsdom never runs.
  setPrefersReducedMotion(true);
  mocked.springs.length = 0;
  mocked.speeds.length = 0;
  mocked.scrolls.length = 0;
  mocked.finish = true;
  mocked.box = null;
  mocked.caughtAt = undefined;
  mocked.scrollY = 0;
  now = 1000;
  rs.spyOn(Date, 'now').mockImplementation(() => now);
});

afterEach(() => {
  rs.restoreAllMocks();
});

test('a bottom sheet opens by springing up to rest', () => {
  render(<Harness />);
  expect(screen.getByTestId('sheet')).toBeTruthy();
  expect(mocked.springs).toEqual([0]);
});

test('flung down, a sheet asks to close and is gone once it has slid out', () => {
  render(<Harness />);
  fling(200, 1500);
  expect(asks()).toBe('1');
  expect(mocked.speeds).toContain(1500);
  expect(screen.queryByTestId('sheet')).toBeNull();
});

test('thrown past half its height but let go moving up, a sheet slides out without lifting first', () => {
  render(<Harness />);
  fling(400, -300);
  expect(asks()).toBe('1');
  expect(mocked.speeds.filter((speed) => speed < 0)).toEqual([]);
  expect(screen.queryByTestId('sheet')).toBeNull();
});

test('dragged, held still, then let go, a sheet settles back however fast the drag was', () => {
  render(<Harness />);
  act(() => {
    mocked.pan!.onActivate!();
    mocked.pan!.onUpdate!({ changeY: 100 });
  });
  now += 2000;
  act(() => mocked.pan!.onDeactivate!({ canceled: false, velocityY: 1500 }));
  expect(asks()).toBe('0');
  expect(mocked.springs.at(-1)).toBe(0);
  expect(mocked.speeds).not.toContain(1500);
});

test('caught as it slides out and flicked before it moves, a sheet keeps the flick', () => {
  render(<Harness />);
  mocked.finish = false;
  fling(200, 1500);
  mocked.speeds.length = 0;
  now += 5000;
  act(() => mocked.pan!.onActivate!());
  now += 10;
  act(() => mocked.pan!.onDeactivate!({ canceled: false, velocityY: 1500 }));
  expect(mocked.speeds).toEqual([1500]);
});

test('a flick in the scrolled content leaves the sheet open; one beside its box closes it', () => {
  mocked.box = { pageX: 100, pageY: 200, width: 200, height: 300 };
  mocked.scrollY = 50;
  render(<Harness scroll />);
  fling(100, 1500, { absoluteX: 150, absoluteY: 300 });
  expect(asks()).toBe('0');
  fling(100, 1500, { absoluteX: 40, absoluteY: 300 });
  expect(asks()).toBe('1');
});

test('flung shut and caught before its owner answers, a sheet goes on out', () => {
  render(<Harness />);
  mocked.finish = false;
  // One act: the owner's answer (and the render it brings) lands only after the catch.
  act(() => {
    mocked.pan!.onActivate!();
    mocked.pan!.onUpdate!({ changeY: 200 });
    mocked.pan!.onDeactivate!({ canceled: false, velocityY: 1500 });
    mocked.pan!.onActivate!();
    // Pushed back up to a third of its height and let go.
    mocked.pan!.onUpdate!({ changeY: -400 });
    mocked.pan!.onDeactivate!({ canceled: false, velocityY: 0 });
  });
  expect(mocked.springs.slice(1)).not.toContain(0);
});

test.each([
  { keepOpen: false, settles: 'goes on out', to: 600 },
  { keepOpen: true, settles: 'settles back', to: 0 },
])(
  'caught and held as its owner answers a fling, a sheet stays put, then $settles',
  ({ keepOpen, to }) => {
    render(<Harness keepOpen={keepOpen} />);
    mocked.finish = false;
    let held = 0;
    // One act: the owner's answer (and the render it brings) lands while the finger holds.
    act(() => {
      mocked.pan!.onActivate!();
      mocked.pan!.onUpdate!({ changeY: 400 });
      mocked.pan!.onDeactivate!({ canceled: false, velocityY: 1500 });
      mocked.pan!.onActivate!();
      held = mocked.springs.length;
    });
    expect(mocked.springs.length).toBe(held);
    mocked.finish = true;
    act(() => mocked.pan!.onDeactivate!({ canceled: false, velocityY: 0 }));
    expect(mocked.springs.at(-1)).toBe(to);
  },
);

test('a sheet drags either way, so one caught sliding can be pushed back up', () => {
  render(<Harness />);
  expect(mocked.pan!.activeOffsetY).toEqual([-8, 8]);
});

test('caught as it opens and pushed up, a sheet stays open, though still past half its height', () => {
  mocked.finish = false;
  mocked.caughtAt = 400;
  render(<Harness />);
  fling(-50, -200);
  expect(asks()).toBe('0');
  expect(mocked.springs.at(-1)).toBe(0);
});

test('a short, slow drag settles back without asking to close', () => {
  render(<Harness />);
  fling(40, 100);
  expect(asks()).toBe('0');
  expect(mocked.springs.at(-1)).toBe(0);
  expect(screen.getByTestId('sheet')).toBeTruthy();
});

test('flung down but kept open by its owner, a sheet settles back', () => {
  render(<Harness keepOpen />);
  fling(200, 1500);
  expect(asks()).toBe('1');
  expect(mocked.springs.at(-1)).toBe(0);
  expect(screen.getByTestId('sheet')).toBeTruthy();
});

test('caught as it slides out after closing, a sheet goes on out when let go short', () => {
  render(<Harness />);
  mocked.finish = false;
  fling(200, 1500);
  expect(asks()).toBe('1');
  expect(screen.getByTestId('sheet')).toBeTruthy();
  mocked.finish = true;
  // Pushed back up to a third of its height and flung up.
  fling(-400, -2000);
  expect(asks()).toBe('1');
  expect(mocked.speeds.filter((speed) => speed < 0)).toEqual([]);
  expect(screen.queryByTestId('sheet')).toBeNull();
});

test("a centered dialog opened from a sheet scrolls on its own, not as the sheet's content", () => {
  render(
    <SilkProvider theme={theme}>
      <Dialog.Root open onOpenChange={() => {}}>
        <Dialog.Content placement="bottom">
          <Dialog.Title>Settings</Dialog.Title>
          <Dialog.Root open onOpenChange={() => {}}>
            <Dialog.Content testID="inner">
              <Dialog.Title>Sources</Dialog.Title>
              <Dialog.ScrollView />
            </Dialog.Content>
          </Dialog.Root>
        </Dialog.Content>
      </Dialog.Root>
    </SilkProvider>,
  );
  expect(screen.getByTestId('inner')).toBeTruthy();
  expect(mocked.scrolls).toEqual([]);
});

test("a sheet's overlayStyle lays out the panel, as the base dialog's does", () => {
  render(
    <SilkProvider theme={theme}>
      <Dialog.Root open onOpenChange={() => {}}>
        <Dialog.Content placement="bottom" overlayStyle={{ paddingTop: 37 }} testID="panel" />
      </Dialog.Root>
    </SilkProvider>,
  );
  const veil = screen.getByTestId('panel').parentElement!;
  expect(getComputedStyle(veil).paddingTop).toBe('37px');
  expect(getComputedStyle(veil).backgroundColor).toBe('rgba(0, 0, 0, 0)');
});

test('on the web, a sheet gives pop-ups inside it the dialog host they open into', () => {
  const hosts: unknown[] = [];
  function Layer() {
    hosts.push(use(FloatingHostContext));
    return null;
  }
  render(
    <SilkProvider theme={theme}>
      <Dialog.Root open onOpenChange={() => {}}>
        <Dialog.Content placement="bottom">
          <Dialog.Title>Settings</Dialog.Title>
          <Layer />
        </Dialog.Content>
      </Dialog.Root>
    </SilkProvider>,
  );
  expect(hosts.at(-1)).toBeTruthy();
});

test('on the web, an Escape that something in the sheet took (prevented) leaves the sheet open', () => {
  render(<Harness />);
  const key = (type: 'keydown' | 'keyup', taken = false) => {
    const event = new KeyboardEvent(type, { key: 'Escape', bubbles: true, cancelable: true });
    if (taken) event.preventDefault();
    act(() => {
      (document.activeElement ?? document.body).dispatchEvent(event);
    });
  };
  key('keydown', true);
  key('keyup');
  expect(asks()).toBe('0');
  expect(screen.getByTestId('sheet')).toBeTruthy();
  key('keydown');
  key('keyup');
  expect(asks()).toBe('1');
});
