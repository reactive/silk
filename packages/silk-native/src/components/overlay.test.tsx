import { createTheme } from '@reactive/silk-core';
import { expect, test } from '@rstest/core';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { type ComponentRef, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { setPrefersReducedMotion } from '../../../../test/rstest-setup';
import { placeFloating } from '../overlay/place.js';
import { type SilkDefaults, SilkProvider } from '../theme/SilkProvider.js';
import { Dialog } from './Dialog.js';
import { Listbox } from './Listbox.js';
import { Popover } from './Popover.js';
import { Pressable } from './Pressable.js';
import { Text } from './Text.js';

const theme = createTheme({ colorScheme: 'dark' });

/** Presses `key` on whatever has focus; returns whether something took it (prevented its default). */
function press(key: string, type: 'keydown' | 'keyup' = 'keydown') {
  const event = new KeyboardEvent(type, { key, bubbles: true, cancelable: true });
  act(() => {
    (document.activeElement ?? document.body).dispatchEvent(event);
  });
  return event.defaultPrevented;
}

/** Lets Radix register its outside-press listener, which it defers a tick. */
const tick = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

const focused = () => document.activeElement?.getAttribute('aria-label') ?? document.activeElement;

// --- Dialog ---

/**
 * react-native-web activates a Modal (its role, focus trap and Escape) once
 * its entrance animation ends, which jsdom never runs; reduced motion has none.
 * The shared setup turns it back off after each test.
 */
const dialogTest = (name: string, body: () => void) =>
  test(name, () => {
    setPrefersReducedMotion(true);
    body();
  });

function DialogHarness({
  placement,
  defaults,
}: {
  readonly placement?: 'center' | 'bottom';
  readonly defaults?: SilkDefaults;
}) {
  const [open, setOpen] = useState(false);
  return (
    <SilkProvider theme={theme} defaults={defaults}>
      <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={() => setOpen(true)} />
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Content placement={placement} testID="panel">
          <Dialog.Title>Settings</Dialog.Title>
          <Pressable accessibilityRole="button" accessibilityLabel="Inside" />
        </Dialog.Content>
      </Dialog.Root>
    </SilkProvider>
  );
}

dialogTest('Dialog is an aria-modal dialog named by its title', () => {
  render(<DialogHarness />);
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(screen.getByLabelText('Settings'));
  const dialog = document.querySelector('[aria-modal="true"]')!;
  expect(dialog.getAttribute('role')).toBe('dialog');
  const title = document.getElementById(dialog.getAttribute('aria-labelledby')!);
  expect(title?.textContent).toBe('Settings');
});

dialogTest('Dialog closes on Escape and hands focus back to its opener', () => {
  render(<DialogHarness />);
  const opener = screen.getByLabelText('Settings');
  act(() => opener.focus());
  fireEvent.click(opener);
  // react-native-web's trap focuses the first focusable element: the panel's, not the veil.
  expect(focused()).toBe('Inside');
  press('Escape', 'keyup');
  expect(document.querySelector('[aria-modal="true"]')).toBeNull();
  expect(document.activeElement).toBe(opener);
});

dialogTest('Dialog placement comes from the prop, else SilkDefaults, else center', () => {
  /** Whether the panel sits as a sheet: flush with the bottom edge, no border there. */
  const sheet = (props: { placement?: 'center' | 'bottom'; defaults?: SilkDefaults }) => {
    const { unmount } = render(<DialogHarness {...props} />);
    fireEvent.click(screen.getByLabelText('Settings'));
    const flush = getComputedStyle(screen.getByTestId('panel')).borderBottomWidth === '0px';
    unmount();
    return flush;
  };
  expect(sheet({})).toBe(false);
  expect(sheet({ placement: 'bottom' })).toBe(true);
  expect(sheet({ defaults: { Dialog: { placement: 'bottom' } } })).toBe(true);
  expect(sheet({ placement: 'center', defaults: { Dialog: { placement: 'bottom' } } })).toBe(false);
});

// --- Popover + Listbox ---

const STEPS = ['1100', '1300', '1500', '1700'] as const;

function PickerHarness({
  focusOnOpen = false,
  onPick,
  scroller = false,
}: {
  readonly focusOnOpen?: boolean;
  readonly onPick?: (value: string) => void;
  readonly scroller?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('1300');
  const anchor = useRef<ComponentRef<typeof View>>(null);
  return (
    <SilkProvider theme={theme}>
      <Pressable
        ref={anchor}
        accessibilityRole="button"
        accessibilityLabel="Strength"
        onPress={() => setOpen((was) => !was)}
      />
      {scroller ? <ScrollView testID="elsewhere" /> : null}
      <Popover.Root open={open} onOpenChange={setOpen} anchor={anchor}>
        <Popover.Content testID="popover">
          <Listbox.Root
            accessibilityLabel="Opponent strength"
            value={value}
            autoFocus={focusOnOpen}
            onValueChange={(next) => {
              setValue(next);
              onPick?.(next);
            }}
          >
            {STEPS.map((step) => (
              <Listbox.Item key={step} value={step} accessibilityLabel={step}>
                {step}
              </Listbox.Item>
            ))}
          </Listbox.Root>
        </Popover.Content>
      </Popover.Root>
      <Text testID="value">{value}</Text>
    </SilkProvider>
  );
}

const options = () => [...document.querySelectorAll<HTMLElement>('[role="option"]')];
const popover = () => screen.queryByTestId('popover');

test('Popover opens without taking focus or making the page modal', () => {
  render(<PickerHarness />);
  fireEvent.click(screen.getByLabelText('Strength'));
  expect(popover()).not.toBeNull();
  expect(document.activeElement).toBe(document.body);
  expect(document.querySelector('[aria-modal]')).toBeNull();
});

test('Popover closes on a press outside, not on its anchor', async () => {
  render(<PickerHarness />);
  const anchor = screen.getByLabelText('Strength');
  fireEvent.click(anchor);
  await tick();
  fireEvent.pointerDown(anchor);
  expect(popover()).not.toBeNull();
  fireEvent.pointerDown(document.body);
  expect(popover()).toBeNull();
});

test('Popover leaves an Escape another control took, and closes on its own', () => {
  render(<PickerHarness />);
  fireEvent.click(screen.getByLabelText('Strength'));
  const taken = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
  taken.preventDefault();
  act(() => {
    document.body.dispatchEvent(taken);
  });
  expect(popover()).not.toBeNull();
  expect(press('Escape')).toBe(true);
  expect(popover()).toBeNull();
});

test('Popover closes when the page scrolls, not when a list elsewhere does', () => {
  render(<PickerHarness scroller />);
  fireEvent.click(screen.getByLabelText('Strength'));
  fireEvent.scroll(screen.getByTestId('elsewhere'));
  expect(popover()).not.toBeNull();
  fireEvent.scroll(document);
  expect(popover()).toBeNull();
});

test('Listbox opened from the keyboard focuses the chosen item; arrows, Home and End move', () => {
  render(<PickerHarness focusOnOpen />);
  fireEvent.click(screen.getByLabelText('Strength'));
  expect(focused()).toBe('1300');
  expect(press('ArrowDown')).toBe(true);
  expect(focused()).toBe('1500');
  press('End');
  expect(focused()).toBe('1700');
  press('ArrowDown');
  expect(focused()).toBe('1700');
  press('Home');
  expect(focused()).toBe('1100');
  press('ArrowUp');
  expect(focused()).toBe('1100');
});

test('Listbox is a listbox of options with one Tab stop, the chosen one marked', () => {
  render(<PickerHarness />);
  fireEvent.click(screen.getByLabelText('Strength'));
  expect(document.querySelector('[role="listbox"]')?.getAttribute('aria-label')).toBe(
    'Opponent strength',
  );
  expect(options().map((option) => option.getAttribute('aria-selected'))).toEqual([
    'false',
    'true',
    'false',
    'false',
  ]);
  expect(options().map((option) => option.tabIndex)).toEqual([-1, 0, -1, -1]);
});

test('Space picks the focused item, closes the popover, and hands focus back', () => {
  let picks = 0;
  render(<PickerHarness focusOnOpen onPick={() => (picks += 1)} />);
  const anchor = screen.getByLabelText('Strength');
  act(() => anchor.focus());
  fireEvent.click(anchor);
  press('ArrowDown');
  expect(press(' ')).toBe(true);
  expect(popover()).toBeNull();
  expect(screen.getByTestId('value').textContent).toBe('1500');
  expect(picks).toBe(1);
  expect(document.activeElement).toBe(anchor);
});

test('picking the chosen item closes without a change', () => {
  let picks = 0;
  render(<PickerHarness onPick={() => (picks += 1)} />);
  fireEvent.click(screen.getByLabelText('Strength'));
  fireEvent.click(options()[1]!);
  expect(popover()).toBeNull();
  expect(picks).toBe(0);
});

test('Tab closes the popover and focus goes back to the anchor', () => {
  render(<PickerHarness focusOnOpen />);
  const anchor = screen.getByLabelText('Strength');
  fireEvent.click(anchor);
  expect(press('Tab')).toBe(true);
  expect(popover()).toBeNull();
  expect(document.activeElement).toBe(anchor);
});

/** A pointer of `pointerType` moving over `el`. */
function pointAt(el: HTMLElement, pointerType: string) {
  // jsdom has no PointerEvent; React reads pointerType off the native event.
  const event = new MouseEvent('pointermove', { bubbles: true });
  Object.defineProperty(event, 'pointerType', { value: pointerType });
  act(() => {
    el.dispatchEvent(event);
  });
}

test('pointing highlights an item, and moves focus only while the list holds it', () => {
  render(<PickerHarness />);
  fireEvent.click(screen.getByLabelText('Strength'));
  pointAt(options()[2]!, 'mouse');
  expect(options()[2]!.getAttribute('data-highlighted')).toBe('true');
  expect(document.activeElement).toBe(document.body);
  act(() => options()[0]!.focus());
  pointAt(options()[3]!, 'mouse');
  expect(focused()).toBe('1700');
});

test('a finger sliding over an item leaves the highlight where it is', () => {
  render(<PickerHarness />);
  fireEvent.click(screen.getByLabelText('Strength'));
  pointAt(options()[2]!, 'touch');
  expect(options().some((option) => option.hasAttribute('data-highlighted'))).toBe(false);
});

// --- Placement ---

const WINDOW = { width: 400, height: 800 };
const OPTIONS = { side: 'bottom', align: 'start', sideOffset: 6, collisionPadding: 8 } as const;

test('placeFloating goes on its preferred side, lined up as asked, when it fits', () => {
  const anchor = { x: 50, y: 100, width: 80, height: 20 };
  expect(placeFloating(anchor, { width: 200, height: 300 }, WINDOW, OPTIONS)).toEqual({
    left: 50,
    top: 126,
    maxHeight: 800 - 120 - 6 - 8,
    side: 'bottom',
  });
  expect(
    placeFloating(anchor, { width: 200, height: 300 }, WINDOW, { ...OPTIONS, align: 'end' }).left,
  ).toBe(8);
  expect(
    placeFloating(anchor, { width: 40, height: 300 }, WINDOW, { ...OPTIONS, align: 'center' }).left,
  ).toBe(70);
});

test('placeFloating flips to the other side when only it fits, else takes the roomier, shrunk', () => {
  const low = { x: 50, y: 700, width: 80, height: 20 };
  expect(placeFloating(low, { width: 200, height: 300 }, WINDOW, OPTIONS)).toEqual({
    left: 50,
    top: 700 - 6 - 300,
    maxHeight: 700 - 6 - 8,
    side: 'top',
  });
  const middle = { x: 50, y: 300, width: 80, height: 20 };
  const tall = placeFloating(middle, { width: 200, height: 900 }, WINDOW, OPTIONS);
  expect(tall.side).toBe('bottom');
  expect(tall.maxHeight).toBe(800 - 320 - 6 - 8);
});

test('placeFloating keeps it inside the window', () => {
  const right = { x: 380, y: 100, width: 20, height: 20 };
  expect(placeFloating(right, { width: 200, height: 100 }, WINDOW, OPTIONS).left).toBe(192);
});
