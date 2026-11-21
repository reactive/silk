import { createTheme } from '@reactive/silk-core';
import { beforeEach, expect, rs, test } from '@rstest/core';
import { act, render, screen } from '@testing-library/react';
import { type ComponentProps, useLayoutEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { setPrefersReducedMotion } from '../../../../test/rstest-setup';
import { SilkProvider } from '../theme/SilkProvider.js';

/**
 * jsdom loads neither library's native module, so they're stood in for: the
 * pan's callbacks are kept to be called by hand, a shared value is a plain
 * object, and a spring lands at once, reporting where it went.
 */
const mocked = rs.hoisted(() => ({
  pan: undefined as undefined | Record<string, (event?: object) => void>,
  springs: [] as number[],
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
  ReduceMotion: { Always: 'always', Never: 'never' },
  cancelAnimation: () => {},
  interpolate: () => 1,
  measure: () => null,
  scrollTo: () => {},
  useAnimatedRef: () => () => {},
  useAnimatedStyle: (style: () => object) => style(),
  useScrollOffset: () => {},
  useSharedValue: <T,>(value: T) => useRef({ value }).current,
  withSpring: (to: number, _config: unknown, done?: (finished: boolean) => void) => {
    mocked.springs.push(to);
    done?.(true);
    return to;
  },
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

const { Dialog } = await import('./index.js');

const theme = createTheme({ colorScheme: 'dark' });

/** A bottom sheet whose owner closes it when asked, unless `keepOpen`. */
function Harness({ keepOpen = false }: { readonly keepOpen?: boolean }) {
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
        </Dialog.Content>
      </Dialog.Root>
      <span data-testid="asks">{asks}</span>
    </SilkProvider>
  );
}

/** Drags the sheet down by `distance` and lets go at `velocity`. */
function fling(distance: number, velocity: number) {
  act(() => {
    mocked.pan!.onActivate!();
    mocked.pan!.onUpdate!({ changeY: distance });
    mocked.pan!.onDeactivate!({ canceled: false, velocityY: velocity });
  });
}

const asks = () => screen.getByTestId('asks').textContent;

beforeEach(() => {
  // react-native-web's Modal shows its content once an entrance animation ends, which jsdom never runs.
  setPrefersReducedMotion(true);
  mocked.springs.length = 0;
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
  expect(screen.queryByTestId('sheet')).toBeNull();
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
