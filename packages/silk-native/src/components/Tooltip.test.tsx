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

/** Focuses `element` as the keyboard does: the browser matches :focus-visible (jsdom never does). */
function tabTo(element: HTMLElement) {
  element.matches = (selector: string) =>
    selector === ':focus-visible' || Element.prototype.matches.call(element, selector);
  act(() => element.focus());
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

test('a touch lifting off a tapped-open tooltip leaves it open', () => {
  rs.useFakeTimers();
  try {
    render(<Harness />);
    click(screen.getByRole('switch', { name: 'Hints' }));
    fireEvent.pointerEnter(tip()!, { pointerType: 'touch' });
    fireEvent.pointerLeave(tip()!, { pointerType: 'touch' });
    act(() => rs.advanceTimersByTime(500));
    expect(tip()).not.toBeNull();
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
  // A press focuses what it lands on, which isn't keyboard focus.
  act(() => go.focus());
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
      <Pressable accessibilityRole="button" accessibilityLabel="Next" />
    </SilkProvider>,
  );
  const go = screen.getByRole('button', { name: 'Go' });
  tabTo(go);
  expect(tip()?.textContent).toBe('Starts the game');
  expect(document.activeElement).toBe(go);
  fireEvent.keyDown(go, { key: 'Escape' });
  expect(tip()).toBeNull();
  act(() => go.blur());
  tabTo(go);
  expect(tip()).not.toBeNull();
  tabTo(screen.getByRole('button', { name: 'Next' }));
  expect(tip()).toBeNull();
});

test('focus that is not from the keyboard does not open it; focus moving inside keeps it open', () => {
  const changes: boolean[] = [];
  render(
    <SilkProvider>
      <Tooltip.Root onOpenChange={(open) => changes.push(open)}>
        <Tooltip.Trigger>
          <Pressable accessibilityRole="button" accessibilityLabel="One" />
          <Pressable accessibilityRole="button" accessibilityLabel="Two" />
        </Tooltip.Trigger>
        <Tooltip.Content>{2}</Tooltip.Content>
      </Tooltip.Root>
      <Pressable accessibilityRole="button" accessibilityLabel="Next" />
    </SilkProvider>,
  );
  const one = screen.getByRole('button', { name: 'One' });
  act(() => one.focus());
  expect(tip()).toBeNull();
  act(() => one.blur());
  tabTo(one);
  expect(tip()?.textContent).toBe('2');
  tabTo(screen.getByRole('button', { name: 'Two' }));
  expect(tip()).not.toBeNull();
  expect(changes).toEqual([true]);
  tabTo(screen.getByRole('button', { name: 'Next' }));
  expect(changes).toEqual([true, false]);
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

test('a press on a part inside that takes no focus keeps it open, however long it is held', () => {
  rs.useFakeTimers();
  try {
    render(
      <SilkProvider>
        <Tooltip.Root>
          <Tooltip.Trigger testID="trigger">
            <Pressable accessibilityRole="button" accessibilityLabel="Go" />
          </Tooltip.Trigger>
          <Tooltip.Content>Starts the game</Tooltip.Content>
        </Tooltip.Root>
        <Pressable accessibilityRole="button" accessibilityLabel="Outside" />
      </SilkProvider>,
    );
    const go = screen.getByRole('button', { name: 'Go' });
    tabTo(go);
    expect(tip()).not.toBeNull();
    // The press's mousedown takes focus off the control, to nothing or to a
    // focusable box outside; its click comes later.
    fireEvent.pointerDown(screen.getByTestId('trigger'), { button: 0 });
    act(() => go.blur());
    tabTo(screen.getByRole('button', { name: 'Outside' }));
    act(() => rs.advanceTimersByTime(500));
    fireEvent.click(screen.getByTestId('trigger'));
    expect(tip()).not.toBeNull();
    // Focus going to nothing with no press closes it.
    tabTo(go);
    act(() => go.blur());
    expect(tip()).toBeNull();
  } finally {
    rs.useRealTimers();
  }
});

test('a controlled owner that keeps it open is asked again on the next close', () => {
  const asks: boolean[] = [];
  render(
    <SilkProvider>
      <Tooltip.Root open onOpenChange={(open) => asks.push(open)}>
        <Tooltip.Trigger>
          <Pressable accessibilityRole="button" accessibilityLabel="Go" />
        </Tooltip.Trigger>
        <Tooltip.Content>Starts the game</Tooltip.Content>
      </Tooltip.Root>
    </SilkProvider>,
  );
  fireEvent.keyDown(document.body, { key: 'Escape' });
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      fireEvent.keyDown(document.body, { key: 'Escape' });
      expect(asks).toEqual([false, false]);
      resolve();
    });
  });
});

test('a press that went down inside and came up outside ends there', () => {
  render(
    <SilkProvider>
      <Tooltip.Root>
        <Tooltip.Trigger testID="trigger">
          <Pressable accessibilityRole="button" accessibilityLabel="Go" />
        </Tooltip.Trigger>
        <Tooltip.Content>Starts the game</Tooltip.Content>
      </Tooltip.Root>
    </SilkProvider>,
  );
  const go = screen.getByRole('button', { name: 'Go' });
  fireEvent.pointerDown(screen.getByTestId('trigger'), { button: 0 });
  // Released off the trigger: the click lands on what holds both.
  fireEvent.click(document.body);
  tabTo(go);
  expect(tip()).not.toBeNull();
  act(() => go.blur());
  expect(tip()).toBeNull();
});

test('two closes in one event ask the owner once', () => {
  const asks: boolean[] = [];
  render(
    <SilkProvider>
      <Tooltip.Root defaultOpen onOpenChange={(open) => asks.push(open)}>
        <Tooltip.Trigger>
          <Pressable accessibilityRole="button" accessibilityLabel="Go" />
        </Tooltip.Trigger>
        <Tooltip.Content>Starts the game</Tooltip.Content>
      </Tooltip.Root>
      <Pressable accessibilityRole="button" accessibilityLabel="Next" />
    </SilkProvider>,
  );
  tabTo(screen.getByRole('button', { name: 'Go' }));
  // Focus leaving the trigger for outside: the trigger's blur and the layer both close it.
  tabTo(screen.getByRole('button', { name: 'Next' }));
  expect(asks).toEqual([false]);
});

test('a press that ends without a click (a context menu) holds it no longer', () => {
  render(
    <SilkProvider>
      <Tooltip.Root>
        <Tooltip.Trigger testID="trigger">
          <Pressable accessibilityRole="button" accessibilityLabel="Go" />
        </Tooltip.Trigger>
        <Tooltip.Content>Starts the game</Tooltip.Content>
      </Tooltip.Root>
    </SilkProvider>,
  );
  const go = screen.getByRole('button', { name: 'Go' });
  tabTo(go);
  fireEvent.pointerDown(screen.getByTestId('trigger'), { button: 0 });
  fireEvent.contextMenu(screen.getByTestId('trigger'));
  act(() => go.blur());
  expect(tip()).toBeNull();
});

test('a trigger unmounted mid-press holds it no longer', () => {
  function Toggle({ shown }: { readonly shown: boolean }) {
    return (
      <SilkProvider>
        <Tooltip.Root defaultOpen>
          {shown ? (
            <Tooltip.Trigger testID="trigger">
              <Pressable accessibilityRole="button" accessibilityLabel="Go" />
            </Tooltip.Trigger>
          ) : null}
          <Tooltip.Content>Starts the game</Tooltip.Content>
        </Tooltip.Root>
      </SilkProvider>
    );
  }
  const { rerender } = render(<Toggle shown />);
  fireEvent.pointerDown(screen.getByTestId('trigger'), { button: 0 });
  rerender(<Toggle shown={false} />);
  fireEvent.keyDown(document.body, { key: 'Escape' });
  expect(tip()).toBeNull();
});

test('a Provider sets the delay of the tooltips inside it', () => {
  rs.useFakeTimers();
  try {
    render(
      <SilkProvider>
        <Tooltip.Provider delayDuration={50}>
          <Tooltip.Root>
            <Tooltip.Trigger testID="trigger">
              <Pressable accessibilityRole="button" accessibilityLabel="Go" />
            </Tooltip.Trigger>
            <Tooltip.Content>Starts the game</Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>
      </SilkProvider>,
    );
    fireEvent.pointerEnter(screen.getByTestId('trigger'), { pointerType: 'mouse' });
    act(() => rs.advanceTimersByTime(50));
    expect(tip()).not.toBeNull();
  } finally {
    rs.useRealTimers();
  }
});
