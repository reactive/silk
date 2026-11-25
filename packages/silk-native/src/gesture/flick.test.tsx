import { beforeEach, expect, rs, test } from '@rstest/core';
import { render } from '@testing-library/react';
import { type JSX, useRef } from 'react';
import type { FlickDirection } from './flick.js';

/** The pan's config, kept to be called by hand; worklets run where they're scheduled. */
const mocked = rs.hoisted(() => ({
  pan: undefined as undefined | Record<string, unknown>,
}));

rs.mock('react-native-gesture-handler', () => ({
  usePanGesture: (config: Record<string, unknown>) => {
    mocked.pan = config;
    return config;
  },
}));
rs.mock('react-native-reanimated', () => ({
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

const { useFlickGesture } = await import('./flick.js');

let clock = 0;
let flicks = 0;

function Flicked({
  direction,
  enabled,
}: {
  readonly direction: FlickDirection;
  readonly enabled?: boolean;
}): JSX.Element | null {
  useFlickGesture({
    direction,
    onFlick: () => flicks++,
    // Left out when unset, so the hook's own default is what's tested.
    ...(enabled === undefined ? null : { enabled }),
  });
  return null;
}

type Handler = (event?: object) => void;
const call = (name: string, event?: object) => (mocked.pan![name] as Handler)(event);

/** A drag let go at `velocity` along its axis, after the finger was still for `heldMs`. */
function release(velocity: { velocityX?: number; velocityY?: number }, heldMs = 0) {
  call('onActivate');
  call('onUpdate');
  clock += heldMs;
  call('onDeactivate', {
    canceled: false,
    velocityX: 0,
    velocityY: 0,
    ...velocity,
  });
}

beforeEach(() => {
  clock = 1000;
  flicks = 0;
  rs.spyOn(Date, 'now').mockImplementation(() => clock);
});

test('an upward throw at fling speed calls back once; slower, downward or held ones do not', () => {
  render(<Flicked direction="up" />);
  release({ velocityY: -600 });
  expect(flicks).toBe(1);
  release({ velocityY: -300 });
  release({ velocityY: 900 });
  // Fast, but the finger had stopped before it let go.
  release({ velocityY: -900 }, 100);
  expect(flicks).toBe(1);
  // A pan along the vertical axis, keeping the browser's horizontal panning.
  expect(mocked.pan).toMatchObject({
    activeOffsetY: [-8, 8],
    failOffsetX: [-8, 8],
    touchAction: 'pan-x',
  });
});

test('a sideways fling reads the horizontal speed', () => {
  render(<Flicked direction="left" />);
  release({ velocityX: -700, velocityY: -900 });
  expect(flicks).toBe(1);
  release({ velocityX: 700 });
  release({ velocityY: -900 });
  expect(flicks).toBe(1);
  // A pan along the horizontal axis, keeping the browser's vertical panning.
  expect(mocked.pan).toMatchObject({
    activeOffsetX: [-8, 8],
    failOffsetY: [-8, 8],
    touchAction: 'pan-y',
  });
});

test('a disabled flick turns its pan off', () => {
  render(<Flicked direction="up" enabled={false} />);
  // Gesture Handler then gives the view back its own touch-action (touchAction.test.tsx).
  expect(mocked.pan).toMatchObject({ enabled: false });
});

test('on the web, the click a mouse drag ends with presses nothing beneath it', () => {
  render(<Flicked direction="up" />);
  let clicks = 0;
  const count = () => clicks++;
  document.body.addEventListener('click', count);
  try {
    release({ velocityY: -600 });
    document.body.click();
    expect(clicks).toBe(0);
    // Only that one click.
    document.body.click();
    expect(clicks).toBe(1);
  } finally {
    document.body.removeEventListener('click', count);
  }
});
