import { afterEach, beforeEach, expect, rs, test } from '@rstest/core';
import { act, render, screen } from '@testing-library/react';
import { type JSX, useRef, useState } from 'react';
import { View } from 'react-native';
import { SilkProvider } from '../theme/SilkProvider.js';
import * as host from '../web/host.js' with { rstest: 'importActual' };
import type { SliderProps } from './Slider.js';

/**
 * jsdom loads neither library's native module, so they're stood in for: the
 * gestures' configs are kept to be called by hand, a shared value is a plain
 * object, an animated style is worked out as the slider renders, and a spring
 * lands at once, reporting where it went and how fast it began; it finishes
 * at once too, unless `unfinished` leaves it running. `web`
 * picks the platform the slider takes gestures as.
 */
const mocked = rs.hoisted(() => ({
  web: true,
  pan: undefined as undefined | Record<string, unknown>,
  tap: undefined as undefined | Record<string, unknown>,
  springs: [] as number[],
  speeds: [] as number[],
  unfinished: false,
}));

rs.mock('react-native-gesture-handler', () => ({
  GestureDetector: ({ children }: { children: unknown }) => children,
  usePanGesture: (config: Record<string, unknown>) => {
    mocked.pan = config;
    return config;
  },
  useTapGesture: (config: Record<string, unknown>) => {
    mocked.tap = config;
    return config;
  },
  useExclusiveGestures: (...gestures: unknown[]) => gestures,
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
    },
  ) => {
    const animation = factory();
    animation.onStart(animation, 0, 0, undefined);
    mocked.springs.push(animation.toValue);
    mocked.speeds.push(animation.velocity);
    if (!mocked.unfinished) animation.callback?.(true);
    return animation.toValue;
  },
  useAnimatedStyle: (style: () => object) => style(),
  useDerivedValue: <T,>(derive: () => T) => ({ get: derive }),
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

const runNow = (run: (...args: unknown[]) => void, ...args: unknown[]) => run(...args);

rs.mock('react-native-worklets', () => ({
  scheduleOnRN: runNow,
  scheduleOnUI: runNow,
}));

rs.mock('../web/host.js', () => ({
  ...host,
  get WEB() {
    return mocked.web;
  },
}));

const { Slider } = await import('./Slider.js');

function Controlled({
  initial,
  ...props
}: Omit<SliderProps, 'value' | 'onValueChange'> & { readonly initial: number[] }): JSX.Element {
  const [value, setValue] = useState(initial);
  return (
    <SilkProvider>
      <Slider size="md" {...props} value={value} onValueChange={setValue} />
    </SilkProvider>
  );
}

const now = (thumb: HTMLElement) => Number(thumb.getAttribute('aria-valuenow'));
const values = () => screen.getAllByRole('slider').map(now);

/**
 * Lays the slider out 200 long, as a browser would report it. An md thumb is
 * 20 across, so a thumb's center runs from 10 to 190: 0 to 100 at 1.8 a unit.
 */
function layOut(length = 200) {
  const parts = screen.getAllByRole('slider')[0]!.parentElement!.parentElement! as HTMLElement & {
    __reactLayoutHandler: (event: object) => void;
  };
  act(() =>
    parts.__reactLayoutHandler({ nativeEvent: { layout: { x: 0, y: 0, width: length, height: length } } }),
  );
}

/** Where `value` sits on the laid-out slider. */
const at = (value: number) => ({ x: 10 + value * 1.8, y: 10 + value * 1.8 });

type Handler = (event?: object) => void;
const pan = (name: string) => (event?: object) => act(() => (mocked.pan![name] as Handler)(event));

/** The clock the slider reads to tell a held finger from a moving one (ms). */
let clock = 0;

beforeEach(() => {
  mocked.web = true;
  mocked.springs.length = 0;
  mocked.speeds.length = 0;
  mocked.unfinished = false;
  clock = 1000;
  rs.spyOn(Date, 'now').mockImplementation(() => clock);
});

afterEach(() => {
  rs.restoreAllMocks();
});

test('web: a press takes the nearest thumb there at once and focuses it; a slide reports each step, the release commits once', () => {
  const commits: number[][] = [];
  render(<Controlled initial={[20, 80]} thumbLabels={['Low', 'High']} onValueCommit={(v) => commits.push(v)} />);
  layOut();
  pan('onBegin')(at(30));
  expect(values()).toEqual([30, 80]);
  expect(document.activeElement).toBe(screen.getByRole('slider', { name: 'Low' }));
  pan('onUpdate')(at(35.2));
  pan('onUpdate')(at(35.4));
  expect(values()).toEqual([35, 80]);
  pan('onDeactivate')({ canceled: false, velocityX: 0 });
  pan('onFinalize')();
  expect(commits).toEqual([[35, 80]]);
});

test('a press before the slider is laid out moves nothing, since it has no length to place the press on', () => {
  const commits: number[][] = [];
  render(<Controlled initial={[5]} onValueCommit={(v) => commits.push(v)} />);
  pan('onBegin')(at(50));
  pan('onFinalize')();
  expect(values()).toEqual([5]);
  expect(commits).toEqual([]);
});

test('the held thumb follows the finger between steps, by a transform, and springs to its step on release', () => {
  render(<Controlled initial={[0]} accessibilityLabel="Strength" step={25} />);
  layOut();
  const box = () => screen.getByRole('slider').parentElement!.style;
  pan('onBegin')(at(0));
  pan('onUpdate')(at(40));
  // Laid out, the box sits at min's edge and a transform carries it.
  expect([box().left, box().marginLeft]).toEqual(['0%', '0px']);
  expect(box().transform).toBe('translateX(72px)');
  expect(values()).toEqual([50]);
  // Let go moving at 900 px a second: 500 units a second, toward its step.
  pan('onDeactivate')({ canceled: false, velocityX: 900 });
  expect(mocked.springs).toEqual([50]);
  expect(mocked.speeds).toEqual([500]);
});

test('let go after holding still, the thumb settles from rest, however fast it moved', () => {
  render(<Controlled initial={[0]} accessibilityLabel="Strength" step={25} />);
  layOut();
  pan('onBegin')(at(0));
  pan('onUpdate')(at(40));
  clock += 100;
  pan('onDeactivate')({ canceled: false, velocityX: 900 });
  expect(mocked.speeds).toEqual([0]);
});

test('right to left, a finger moving right lowers the value, and its speed counts toward min', () => {
  render(<Controlled initial={[50]} accessibilityLabel="Rtl" dir="rtl" step={25} />);
  layOut();
  pan('onBegin')(at(50));
  pan('onUpdate')(at(60));
  // 60% of the way from the left is 40% of the way from the right.
  expect(values()).toEqual([50]);
  pan('onUpdate')(at(70));
  expect(values()).toEqual([25]);
  pan('onDeactivate')({ canceled: false, velocityX: 900 });
  expect(mocked.speeds).toEqual([-500]);
});

test('neighbors keep their gap: the held thumb stops short of it', () => {
  const commits: number[][] = [];
  render(
    <Controlled
      initial={[20, 60]}
      minStepsBetweenThumbs={10}
      thumbLabels={['Low', 'High']}
      onValueCommit={(v) => commits.push(v)}
    />,
  );
  layOut();
  pan('onBegin')(at(20));
  pan('onUpdate')(at(30));
  pan('onUpdate')(at(50));
  pan('onUpdate')(at(55));
  expect(values()).toEqual([50, 60]);
  // Drawn at 50, not under the finger at 55.
  expect(screen.getByRole('slider', { name: 'Low' }).parentElement!.style.transform).toBe('translateX(90px)');
  pan('onDeactivate')({ canceled: false, velocityX: 900 });
  // Already at its step: it settles without the finger's speed.
  expect(mocked.speeds).toEqual([0]);
  expect(commits).toEqual([[50, 60]]);
});

test('without a gap, a thumb slid past its neighbor takes its place, and focus follows it', () => {
  render(<Controlled initial={[40, 60]} thumbLabels={['Low', 'High']} />);
  layOut();
  pan('onBegin')(at(40));
  pan('onUpdate')(at(70));
  expect(values()).toEqual([60, 70]);
  expect(document.activeElement).toBe(screen.getAllByRole('slider')[1]);
  pan('onDeactivate')({ canceled: false, velocityX: 0 });
  expect(mocked.springs).toEqual([70]);
});

test('a slide that ends where it began commits nothing', () => {
  const commits: number[][] = [];
  render(<Controlled initial={[50]} onValueCommit={(v) => commits.push(v)} />);
  layOut();
  pan('onBegin')(at(50));
  pan('onUpdate')(at(60));
  pan('onUpdate')(at(50));
  pan('onDeactivate')({ canceled: false, velocityX: 0 });
  expect(commits).toEqual([]);
});

test('a controlled slider whose owner turns the slide down shows its own value once let go', () => {
  const changes: number[][] = [];
  const stuck = () => (
    <SilkProvider>
      <Slider size="md" accessibilityLabel="Stuck" value={[50]} onValueChange={(v) => changes.push(v)} />
    </SilkProvider>
  );
  const { rerender } = render(stuck());
  layOut();
  const box = () => screen.getByRole('slider').parentElement!.style;
  pan('onBegin')(at(50));
  pan('onUpdate')(at(80));
  expect(changes).toEqual([[80]]);
  pan('onDeactivate')({ canceled: false, velocityX: 0 });
  // The stand-in styles are worked out as it renders.
  rerender(stuck());
  expect(box().transform).toBe('translateX(90px)');
});

test('disabled, a slider takes no gestures', () => {
  render(<Controlled initial={[50]} disabled />);
  expect(mocked.pan!.enabled).toBe(false);
  expect(mocked.tap!.enabled).toBe(false);
});

test('native: a slide starts once the finger moves a touch slop along the slider, so a scroll across it still scrolls', () => {
  mocked.web = false;
  const { unmount } = render(<Controlled initial={[50]} />);
  expect(mocked.pan).toMatchObject({ activeOffsetX: [-8, 8], failOffsetY: [-8, 8] });
  expect(mocked.pan!.onBegin).toBeUndefined();
  unmount();
  render(<Controlled initial={[50]} orientation="vertical" />);
  expect(mocked.pan).toMatchObject({ activeOffsetY: [-8, 8], failOffsetX: [-8, 8] });
});

test('native: a tap springs the nearest thumb to its step there and commits once', () => {
  mocked.web = false;
  const commits: number[][] = [];
  render(<Controlled initial={[20, 80]} step={10} onValueCommit={(v) => commits.push(v)} />);
  layOut();
  act(() => (mocked.tap!.onActivate as Handler)(at(68)));
  expect(values()).toEqual([20, 70]);
  expect(mocked.springs).toEqual([70]);
  expect(commits).toEqual([[20, 70]]);
});

test('native: a controlled slider whose owner turns a tap down shows its own value again', () => {
  mocked.web = false;
  const stuck = () => (
    <SilkProvider>
      <Slider size="md" accessibilityLabel="Stuck" value={[50]} onValueChange={() => {}} />
    </SilkProvider>
  );
  const { rerender } = render(stuck());
  layOut();
  const box = () => screen.getByRole('slider').parentElement!.style;
  // The spring toward the tap is still on its way as the owner keeps 50.
  mocked.unfinished = true;
  act(() => (mocked.tap!.onActivate as Handler)(at(20)));
  expect(mocked.springs).toEqual([20, 50]);
  // The stand-in styles are worked out as it renders.
  rerender(stuck());
  expect(box().transform).toBe('translateX(90px)');
});

test('native: a slide starts where the finger is as it moves a touch slop', () => {
  mocked.web = false;
  const commits: number[][] = [];
  render(<Controlled initial={[0]} onValueCommit={(v) => commits.push(v)} />);
  layOut();
  pan('onActivate')(at(30));
  pan('onUpdate')(at(40));
  pan('onDeactivate')({ canceled: false, velocityX: 0 });
  pan('onFinalize')();
  expect(commits).toEqual([[40]]);
});
