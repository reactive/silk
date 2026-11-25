import { afterEach, beforeEach, expect, rs, test } from '@rstest/core';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { type JSX, useRef, useState } from 'react';
import { I18nManager, View } from 'react-native';
import { SilkProvider } from '../theme/SilkProvider.js';

/**
 * jsdom loads neither library's native module, so they're stood in for as
 * in Pager.test.tsx: the pan's config is kept to be called by hand, a shared
 * value is a plain object, the thumb's animated style is worked out as the
 * switch renders, and a spring lands at once, recording where it went and
 * how fast it began.
 */
const mocked = rs.hoisted(() => ({
  pan: undefined as undefined | Record<string, unknown>,
  springs: [] as number[],
  speeds: [] as number[],
  /** Whether each spring jumps for reduced motion. */
  reduced: [] as boolean[],
  /** While set, calls to the JavaScript thread wait here, as they would behind a busy thread. */
  toRN: undefined as undefined | (() => void)[],
  /** How fast a spring still runs when the next one replaces it, in positions a second. */
  running: undefined as undefined | number,
  /** Works out the thumb's animated style, as the UI thread has it now. */
  thumb: undefined as undefined | (() => { transform: [{ translateX: number }] }),
}));

/** A `springTo` animation, as far as these tests start it. */
interface SpringStandIn {
  toValue: number;
  velocity: number;
  reduceMotion: boolean;
  callback?: (finished: boolean) => void;
  onStart: (animation: object, value: number, now: number, previous?: object) => void;
}

const isSpring = (value: unknown): value is SpringStandIn =>
  typeof (value as { onStart?: unknown } | null)?.onStart === 'function';

/**
 * Starts `animation` from `from`, handing it the spring it replaces as
 * Reanimated does, records it, and lands it at once.
 */
function start(animation: SpringStandIn, from: number): number {
  const previous = mocked.running === undefined ? undefined : { velocity: mocked.running };
  animation.onStart(animation, from, 0, previous);
  mocked.springs.push(animation.toValue);
  mocked.speeds.push(animation.velocity);
  mocked.reduced.push(animation.reduceMotion);
  animation.callback?.(true);
  return animation.toValue;
}

rs.mock('react-native-gesture-handler', () => ({
  GestureDetector: ({ children }: { children: unknown }) => children,
  usePanGesture: (config: Record<string, unknown>) => {
    mocked.pan = config;
    return config;
  },
}));

rs.mock('react-native-reanimated', () => ({
  default: { View },
  cancelAnimation: () => {},
  // A spring starts when it is set on a shared value, from where that value is.
  defineAnimation: (_start: number, factory: () => object) => factory(),
  useAnimatedStyle: (style: NonNullable<typeof mocked.thumb>) => {
    mocked.thumb = style;
    return style();
  },
  useSharedValue: <T,>(value: T) =>
    useRef({
      value,
      get() {
        return this.value;
      },
      set(next: T) {
        this.value = isSpring(next) ? (start(next, this.value as number) as T) : next;
      },
    }).current,
}));

rs.mock('react-native-worklets', () => ({
  scheduleOnRN: (run: (...args: unknown[]) => void, ...args: unknown[]) =>
    mocked.toRN ? mocked.toRN.push(() => run(...args)) : run(...args),
  scheduleOnUI: (run: (...args: unknown[]) => void, ...args: unknown[]) => run(...args),
}));

const { Switch } = await import('./Switch.js');

/** The track's width once laid out, and the thumb's travel along it (less its insets). */
const WIDTH = 100;
let travel = 0;

/**
 * A controlled switch whose owner records each change in `changes` and takes
 * it, unless `refuse`; `set` lets the test change it from outside.
 */
function Owner({
  refuse = false,
  disabled = false,
  changes,
  set,
}: {
  readonly refuse?: boolean;
  readonly disabled?: boolean;
  readonly changes: boolean[];
  readonly set?: { current?: (checked: boolean) => void };
}): JSX.Element {
  const [checked, setChecked] = useState(false);
  if (set) set.current = setChecked;
  return (
    <SilkProvider>
      <Switch
        testID="switch"
        accessibilityLabel="Arrows"
        checked={checked}
        disabled={disabled}
        onCheckedChange={(next) => {
          changes.push(next);
          if (!refuse) setChecked(next);
        }}
      />
    </SilkProvider>
  );
}

/** Lays the track out `WIDTH` wide, as a browser would report it, and reads the travel. */
function layOut() {
  const root = screen.getByTestId('switch') as HTMLElement & {
    __reactLayoutHandler: (event: object) => void;
  };
  act(() =>
    root.__reactLayoutHandler({
      nativeEvent: { layout: { x: 0, y: 0, width: WIDTH, height: 24 } },
    }),
  );
  const thumb = root.firstElementChild as HTMLElement;
  travel = WIDTH - parseFloat(thumb.style.width) - 4;
}

type Handler = (event?: object) => void;
const pan = (name: string, event?: object) => act(() => (mocked.pan![name] as Handler)(event));

/** A drag of `dx` points, let go at `velocityX` after `heldMs` still. */
function drag(dx: number, velocityX = 0, heldMs = 0, canceled = false) {
  pan('onActivate', { translationX: 0 });
  pan('onUpdate', { translationX: dx });
  clock += heldMs;
  pan('onDeactivate', { canceled, velocityX });
}

const shift = () => mocked.thumb!().transform[0].translateX;
const checkedState = () => screen.getByRole('switch').getAttribute('aria-checked');

let clock = 0;

beforeEach(() => {
  mocked.springs.length = 0;
  mocked.speeds.length = 0;
  mocked.reduced.length = 0;
  clock = 1000;
  rs.spyOn(Date, 'now').mockImplementation(() => clock);
});

afterEach(async () => {
  mocked.toRN = undefined;
  mocked.running = undefined;
  rs.restoreAllMocks();
  // A drag's release swallows the next click until the browser's next task (`swallowDragClick`).
  await new Promise((resolve) => setTimeout(resolve, 0));
});

test('the thumb follows the finger along the track, and stops at its ends', () => {
  render(<Owner changes={[]} />);
  layOut();
  pan('onActivate', { translationX: 8 });
  pan('onUpdate', { translationX: 8 + travel / 4 });
  expect(shift()).toBeCloseTo(travel / 4);
  pan('onUpdate', { translationX: 8 + travel * 3 });
  expect(shift()).toBeCloseTo(travel);
  pan('onUpdate', { translationX: -travel });
  expect(shift()).toBe(0);
});

test('a drag let go past halfway turns it on, once', () => {
  const changes: boolean[] = [];
  render(<Owner changes={changes} />);
  layOut();
  drag(travel * 0.7, 0, 100);
  expect(changes).toEqual([true]);
  expect(checkedState()).toBe('true');
  // The owner's answer finds the thumb already heading there: no second spring.
  expect(mocked.springs).toEqual([1]);
});

test('a short fling turns it on at the finger’s speed', () => {
  const changes: boolean[] = [];
  render(<Owner changes={changes} />);
  layOut();
  drag(travel * 0.2, 800);
  expect(changes).toEqual([true]);
  expect(mocked.springs.at(-1)).toBe(1);
  expect(mocked.speeds.at(-1)).toBeCloseTo(800 / travel);
});

test('a short, slow drag settles back and changes nothing', () => {
  const changes: boolean[] = [];
  render(<Owner changes={changes} />);
  layOut();
  drag(travel * 0.3, 200);
  expect(changes).toEqual([]);
  expect(mocked.springs.at(-1)).toBe(0);
});

test('a fling released after the finger stopped is a slow release', () => {
  const changes: boolean[] = [];
  render(<Owner changes={changes} />);
  layOut();
  drag(travel * 0.2, 800, 100);
  expect(changes).toEqual([]);
  expect(mocked.springs.at(-1)).toBe(0);
});

test('a canceled drag settles back where it began', () => {
  const changes: boolean[] = [];
  render(<Owner changes={changes} />);
  layOut();
  drag(travel * 0.9, 800, 0, true);
  expect(changes).toEqual([]);
  expect(mocked.springs.at(-1)).toBe(0);
});

test('a change the owner turns down springs back', () => {
  const changes: boolean[] = [];
  render(<Owner refuse changes={changes} />);
  layOut();
  drag(travel * 0.8, 0, 100);
  expect(changes).toEqual([true]);
  expect(mocked.springs).toEqual([1, 0]);
  expect(checkedState()).toBe('false');
});

test('turned down mid-fling, the thumb comes back from rest rather than past the far end', () => {
  const changes: boolean[] = [];
  render(<Owner refuse changes={changes} />);
  layOut();
  // The fling's spring still runs toward on when the refusal arrives.
  mocked.running = 60;
  drag(travel * 0.2, 800);
  expect(mocked.springs).toEqual([1, 0]);
  expect(mocked.speeds.at(-1)).toBe(0);
});

test('the owner’s change keeps a running spring’s speed when it heads there', () => {
  const set: { current?: (checked: boolean) => void } = {};
  render(<Owner changes={[]} set={set} />);
  layOut();
  mocked.running = 5;
  act(() => set.current!(true));
  expect(mocked.springs.at(-1)).toBe(1);
  expect(mocked.speeds.at(-1)).toBe(5);
});

test('a held thumb keeps the owner’s change until it lets go, then goes there', () => {
  const changes: boolean[] = [];
  const set: { current?: (checked: boolean) => void } = {};
  render(<Owner changes={changes} set={set} />);
  layOut();
  pan('onActivate', { translationX: 0 });
  pan('onUpdate', { translationX: travel * 0.1 });
  act(() => set.current!(true));
  expect(mocked.springs).toEqual([]);
  pan('onDeactivate', { canceled: false, velocityX: 0 });
  expect(changes).toEqual([]);
  expect(mocked.springs).toEqual([1]);
});

test('a held thumb let go on the end the owner named meanwhile reports nothing', () => {
  const changes: boolean[] = [];
  const set: { current?: (checked: boolean) => void } = {};
  render(<Owner changes={changes} set={set} />);
  layOut();
  pan('onActivate', { translationX: 0 });
  pan('onUpdate', { translationX: travel * 0.9 });
  act(() => set.current!(true));
  clock += 100;
  pan('onDeactivate', { canceled: false, velocityX: 0 });
  expect(changes).toEqual([]);
  expect(mocked.springs).toEqual([1]);
});

test('a thumb flung on past its end settles there without carrying on', () => {
  const changes: boolean[] = [];
  render(<Owner changes={changes} />);
  layOut();
  drag(travel * 0.8, 0, 100);
  drag(travel, 1500);
  expect(changes).toEqual([true]);
  expect(mocked.springs.at(-1)).toBe(1);
  expect(mocked.speeds.at(-1)).toBe(0);
});

test('state React renders before it hears a release is kept out', () => {
  const changes: boolean[] = [];
  render(<Owner changes={changes} />);
  layOut();
  // Flicked on, then off, while the JavaScript thread is busy.
  mocked.toRN = [];
  drag(travel * 0.8, 0, 100);
  drag(-travel * 0.8, 0, 100);
  const waiting = mocked.toRN;
  mocked.toRN = undefined;
  // Each release sends two calls: the web's click guard (`panAlong`), then the report.
  expect(waiting).toHaveLength(4);
  // React hears the first: its `checked` is on, but the thumb's last release went off.
  act(() => waiting.slice(0, 2).forEach((call) => call()));
  expect(mocked.springs).toEqual([1, 0]);
  act(() => waiting.slice(2).forEach((call) => call()));
  expect(changes).toEqual([true, false]);
  expect(mocked.springs).toEqual([1, 0]);
  expect(checkedState()).toBe('false');
});

test('a press before React hears a drag turns the switch back, not on again', async () => {
  const changes: boolean[] = [];
  render(<Owner changes={changes} />);
  layOut();
  // Dragged on while the JavaScript thread is busy: the owner still says off.
  mocked.toRN = [];
  drag(travel * 0.8, 0, 100);
  // The drag's click guard runs and lapses, so the press that follows is a press.
  mocked.toRN.shift()!();
  await new Promise((resolve) => setTimeout(resolve, 0));
  fireEvent.click(screen.getByRole('switch'));
  const waiting = mocked.toRN;
  mocked.toRN = undefined;
  act(() => waiting.forEach((call) => call()));
  expect(changes).toEqual([true, false]);
  expect(mocked.springs).toEqual([1, 0]);
  expect(checkedState()).toBe('false');
});

test('a press still toggles it, springing the thumb across', () => {
  const changes: boolean[] = [];
  render(<Owner changes={changes} />);
  layOut();
  fireEvent.click(screen.getByRole('switch'));
  expect(changes).toEqual([true]);
  expect(mocked.springs).toEqual([1]);
});

test('on the web, the click a mouse drag ends with doesn’t toggle it back', () => {
  const changes: boolean[] = [];
  render(<Owner changes={changes} />);
  layOut();
  drag(travel * 0.8, 0, 100);
  fireEvent.click(screen.getByRole('switch'));
  expect(changes).toEqual([true]);
  expect(checkedState()).toBe('true');
});

test('with reduced motion, the thumb jumps', () => {
  const page = globalThis as { matchMedia?: unknown };
  page.matchMedia = () => ({
    matches: true,
    addEventListener: () => {},
    removeEventListener: () => {},
  });
  try {
    render(<Owner changes={[]} />);
    layOut();
    drag(travel * 0.8, 0, 100);
    expect(mocked.reduced.at(-1)).toBe(true);
  } finally {
    delete page.matchMedia;
  }
});

test('a disabled switch takes no drag', () => {
  render(<Owner disabled changes={[]} />);
  expect(mocked.pan!.enabled).toBe(false);
});

test('right to left, the thumb turns on going left', () => {
  const layout = I18nManager as { isRTL?: boolean };
  layout.isRTL = true;
  try {
    const changes: boolean[] = [];
    render(<Owner changes={changes} />);
    layOut();
    drag(-travel * 0.7, 0, 100);
    expect(changes).toEqual([true]);
    expect(shift()).toBeCloseTo(-travel);
  } finally {
    layout.isRTL = undefined;
  }
});
