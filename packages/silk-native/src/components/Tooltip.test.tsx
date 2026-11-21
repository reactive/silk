import { expect, rs, test } from '@rstest/core';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { SilkProvider } from '../theme/SilkProvider.js';
import { Pressable } from './Pressable.js';
import { Switch } from './Switch.js';
import { Tooltip } from './Tooltip.js';

/** Lets Radix register its outside-press listener, which it defers a tick. */
const tick = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

function Harness({ onOpenChange }: { readonly onOpenChange?: (open: boolean) => void }) {
  return (
    <SilkProvider>
      <Tooltip.Root delayDuration={300} onOpenChange={onOpenChange}>
        <Tooltip.Trigger testID="trigger">
          <Switch accessibilityLabel="Hints" disabled checked={false} />
        </Tooltip.Trigger>
        <Tooltip.Content>Only in Explore</Tooltip.Content>
      </Tooltip.Root>
      <Pressable accessibilityRole="button" accessibilityLabel="Elsewhere" />
    </SilkProvider>
  );
}

/** A press through react-native-web's responder system, which listens for mouse events. */
function click(element: HTMLElement) {
  fireEvent.mouseDown(element, { button: 0, buttons: 1 });
  fireEvent.mouseUp(element, { button: 0 });
  fireEvent.click(element);
}

const tip = () => screen.queryByRole('tooltip');

test('a mouse resting on the trigger opens it after the delay, and leaving closes it', () => {
  rs.useFakeTimers();
  try {
    const changes: boolean[] = [];
    render(<Harness onOpenChange={(open) => changes.push(open)} />);
    const trigger = screen.getByTestId('trigger');
    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });
    act(() => rs.advanceTimersByTime(299));
    expect(tip()).toBeNull();
    act(() => rs.advanceTimersByTime(1));
    expect(tip()?.textContent).toBe('Only in Explore');
    // Moving onto the tooltip within the grace keeps it.
    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' });
    fireEvent.pointerEnter(tip()!, { pointerType: 'mouse' });
    act(() => rs.advanceTimersByTime(500));
    expect(tip()).not.toBeNull();
    fireEvent.pointerLeave(tip()!, { pointerType: 'mouse' });
    act(() => rs.advanceTimersByTime(100));
    expect(tip()).toBeNull();
    expect(changes).toEqual([true, false]);
  } finally {
    rs.useRealTimers();
  }
});

test('a mouse passing over without resting opens nothing; a touch does not hover', () => {
  rs.useFakeTimers();
  try {
    render(<Harness />);
    const trigger = screen.getByTestId('trigger');
    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });
    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' });
    fireEvent.pointerEnter(trigger, { pointerType: 'touch' });
    act(() => rs.advanceTimersByTime(1000));
    expect(tip()).toBeNull();
  } finally {
    rs.useRealTimers();
  }
});

test('a press on a disabled control opens it, and a press outside closes it', async () => {
  render(<Harness />);
  const toggle = screen.getByRole('switch', { name: 'Hints' });
  click(toggle);
  expect(tip()?.textContent).toBe('Only in Explore');
  await tick();
  fireEvent.pointerDown(screen.getByRole('button', { name: 'Elsewhere' }));
  expect(tip()).toBeNull();
});

test('an enabled control keeps its press', () => {
  const presses: number[] = [];
  render(
    <SilkProvider>
      <Tooltip.Root>
        <Tooltip.Trigger>
          <Pressable accessibilityRole="button" accessibilityLabel="Go" onPress={() => presses.push(1)} />
        </Tooltip.Trigger>
        <Tooltip.Content>Starts the game</Tooltip.Content>
      </Tooltip.Root>
    </SilkProvider>,
  );
  const go = screen.getByRole('button', { name: 'Go' });
  click(go);
  expect(presses).toEqual([1]);
  expect(tip()).toBeNull();
});

test('keyboard focus opens it without taking focus, and Escape or leaving closes it', () => {
  render(
    <SilkProvider>
      <Tooltip.Root>
        <Tooltip.Trigger>
          <Pressable accessibilityRole="button" accessibilityLabel="Go" />
        </Tooltip.Trigger>
        <Tooltip.Content>Starts the game</Tooltip.Content>
      </Tooltip.Root>
    </SilkProvider>,
  );
  const go = screen.getByRole('button', { name: 'Go' });
  act(() => go.focus());
  expect(tip()?.textContent).toBe('Starts the game');
  expect(document.activeElement).toBe(go);
  fireEvent.keyDown(go, { key: 'Escape' });
  expect(tip()).toBeNull();
  act(() => go.blur());
  act(() => go.focus());
  expect(tip()).not.toBeNull();
  act(() => go.blur());
  expect(tip()).toBeNull();
});

test('focus from a press does not open it', () => {
  render(<Harness />);
  const trigger = screen.getByTestId('trigger');
  fireEvent.pointerDown(trigger);
  fireEvent.focus(trigger);
  expect(tip()).toBeNull();
});

test('controlled, it shows what it is told and asks to change', () => {
  const asks: boolean[] = [];
  render(
    <SilkProvider>
      <Tooltip.Root open onOpenChange={(open) => asks.push(open)}>
        <Tooltip.Trigger>
          <Pressable accessibilityRole="button" accessibilityLabel="Go" />
        </Tooltip.Trigger>
        <Tooltip.Content>
          <Switch accessibilityLabel="Inside" checked={false} />
        </Tooltip.Content>
      </Tooltip.Root>
    </SilkProvider>,
  );
  expect(screen.getByRole('switch', { name: 'Inside' })).toBeTruthy();
  fireEvent.keyDown(document.body, { key: 'Escape' });
  expect(asks).toEqual([false]);
  expect(tip()).not.toBeNull();
});
