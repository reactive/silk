import { createTheme } from '@reactive/silk-core';
import { expect, test } from '@rstest/core';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { type ComponentRef, useRef, useState } from 'react';
import { renderToString } from 'react-dom/server';
import { ScrollView, View } from 'react-native';
import { setPrefersReducedMotion } from '../../../../test/rstest-setup';
import { placeFloating } from '../overlay/place.js';
import { type SilkDefaults, SilkProvider } from '../theme/SilkProvider.js';
import { Dialog } from './Dialog.js';
import { Listbox } from './Listbox.js';
import { Popover } from './Popover.js';
import { Pressable } from './Pressable.js';
import { Text } from './Text.js';
import { Tooltip } from './Tooltip.js';

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

function DialogWithPopover({
  popoverOpen = true,
  onDialogChange = () => {},
  onPopoverChange = () => {},
}: {
  readonly popoverOpen?: boolean;
  readonly onDialogChange?: (open: boolean) => void;
  readonly onPopoverChange?: (open: boolean) => void;
}) {
  const anchor = useRef<ComponentRef<typeof View>>(null);
  return (
    <SilkProvider theme={theme}>
      <Dialog.Root open onOpenChange={onDialogChange}>
        <Dialog.Content>
          <Pressable ref={anchor} accessibilityRole="button" accessibilityLabel="Strength" />
          <Popover.Root open={popoverOpen} onOpenChange={onPopoverChange} anchor={anchor}>
            <Popover.Content testID="popover">
              <Pressable accessibilityRole="button" accessibilityLabel="1500" />
            </Popover.Content>
          </Popover.Root>
        </Dialog.Content>
      </Dialog.Root>
    </SilkProvider>
  );
}

dialogTest('A popover opened inside a Dialog renders in its Modal, over the panel', () => {
  render(<DialogWithPopover />);
  const dialog = document.querySelector('[aria-modal="true"]')!;
  const popover = screen.getByTestId('popover');
  // Inside the Modal, so react-native-web's z-index 9999 doesn't cover it and its focus trap holds it.
  expect(dialog.contains(popover)).toBe(true);
  // Not inside the panel, whose box would clip it.
  expect(screen.getByLabelText('Strength').parentElement?.contains(popover)).toBe(false);
});

dialogTest('A popover open as its Dialog mounts hands focus back to its anchor as it closes', () => {
  // It waits for the dialog's host rather than open at the end of the page and
  // move, which would rebuild it under effects still holding the old one.
  const { rerender } = render(<DialogWithPopover />);
  expect(focused()).toBe('1500');
  rerender(<DialogWithPopover popoverOpen={false} />);
  expect(focused()).toBe('Strength');
});

dialogTest('Escape closes a popover inside a Dialog, not the Dialog', () => {
  const changes: string[] = [];
  const { rerender } = render(
    <DialogWithPopover
      onDialogChange={(open) => changes.push(`dialog ${open}`)}
      onPopoverChange={(open) => changes.push(`popover ${open}`)}
    />,
  );
  press('Escape');
  press('Escape', 'keyup');
  expect(changes).toEqual(['popover false']);
  // With the popover gone, the next Escape closes the Dialog.
  rerender(
    <DialogWithPopover
      popoverOpen={false}
      onDialogChange={(open) => changes.push(`dialog ${open}`)}
    />,
  );
  press('Escape');
  press('Escape', 'keyup');
  expect(changes).toEqual(['popover false', 'dialog false']);
});

dialogTest('A held Escape closes a popover inside a Dialog, not the Dialog', () => {
  const changes: string[] = [];
  const onDialogChange = (open: boolean) => changes.push(`dialog ${open}`);
  const { rerender } = render(
    <DialogWithPopover
      onDialogChange={onDialogChange}
      onPopoverChange={(open) => changes.push(`popover ${open}`)}
    />,
  );
  press('Escape');
  rerender(<DialogWithPopover popoverOpen={false} onDialogChange={onDialogChange} />);
  // The repeats come after the popover has closed, so nothing takes them.
  for (let i = 0; i < 3; i++) {
    act(() => {
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', repeat: true, bubbles: true }),
      );
    });
  }
  press('Escape', 'keyup');
  expect(changes).toEqual(['popover false']);
});

dialogTest('An Escape a closed Dialog saw leaves the next Dialog to close on its own Escape', () => {
  const changes: string[] = [];
  const { unmount } = render(<DialogWithPopover />);
  // A keydown with no keyup, as a test or a lost keyup leaves it.
  press('Escape');
  unmount();
  render(
    <DialogWithPopover
      popoverOpen={false}
      onDialogChange={(open) => changes.push(`dialog ${open}`)}
    />,
  );
  press('Escape');
  press('Escape', 'keyup');
  expect(changes).toEqual(['dialog false']);
});

dialogTest('A tooltip inside a Dialog opens in its Modal, and Escape closes only the tooltip', () => {
  const changes: string[] = [];
  render(
    <SilkProvider theme={theme}>
      <Dialog.Root open onOpenChange={(open) => changes.push(`dialog ${open}`)}>
        <Dialog.Content>
          <Tooltip.Root defaultOpen onOpenChange={(open) => changes.push(`tooltip ${open}`)}>
            <Tooltip.Trigger>
              <Text>Moves on the board</Text>
            </Tooltip.Trigger>
            <Tooltip.Content>Only in Explore</Tooltip.Content>
          </Tooltip.Root>
        </Dialog.Content>
      </Dialog.Root>
    </SilkProvider>,
  );
  const tooltip = screen.getByRole('tooltip');
  expect(document.querySelector('[aria-modal="true"]')?.contains(tooltip)).toBe(true);
  press('Escape');
  press('Escape', 'keyup');
  expect(changes).toEqual(['tooltip false']);
  expect(screen.queryByRole('tooltip')).toBeNull();
});

// --- Popover + Listbox ---

const STEPS = ['1100', '1300', '1500', '1700'] as const;

function PickerHarness({
  focusOnOpen = false,
  onPick,
  scroller = false,
  initial = '1300',
  disabled = [],
  steps = STEPS,
  sideOffset,
  moveFocusIn = false,
  onHighlight,
}: {
  /** Lets the popover move focus in as it opens; the rest leave it, as a hover menu does. */
  readonly moveFocusIn?: boolean;
  readonly onHighlight?: (value: string | undefined) => void;
  readonly focusOnOpen?: boolean;
  readonly onPick?: (value: string) => void;
  readonly scroller?: boolean;
  readonly initial?: string;
  readonly disabled?: readonly string[];
  readonly steps?: readonly string[];
  readonly sideOffset?: number;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initial);
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
        <Popover.Content
          testID="popover"
          sideOffset={sideOffset}
          onOpenAutoFocus={moveFocusIn ? undefined : (event) => event.preventDefault()}
        >
          <Listbox.Root
            accessibilityLabel="Opponent strength"
            value={value}
            autoFocus={focusOnOpen}
            onHighlightChange={onHighlight}
            onValueChange={(next) => {
              setValue(next);
              onPick?.(next);
            }}
          >
            {steps.map((step) => (
              <Listbox.Item
                key={step}
                value={step}
                accessibilityLabel={step}
                disabled={disabled.includes(step)}
              >
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

test('Popover moves focus to the chosen item as it opens, without making the page modal', () => {
  render(<PickerHarness moveFocusIn />);
  const anchor = screen.getByLabelText('Strength');
  act(() => anchor.focus());
  fireEvent.click(anchor);
  expect(focused()).toBe('1300');
  expect(document.querySelector('[aria-modal]')).toBeNull();
});

test('Popover whose onOpenAutoFocus prevents it leaves focus on the anchor', () => {
  render(<PickerHarness />);
  const anchor = screen.getByLabelText('Strength');
  act(() => anchor.focus());
  fireEvent.click(anchor);
  expect(popover()).not.toBeNull();
  expect(document.activeElement).toBe(anchor);
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

test('Popover leaves an Escape already handled before it, and closes on its own', () => {
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

test('Popover closes on scrolling that moves its anchor, not on scrolling that leaves it', () => {
  render(<PickerHarness scroller />);
  const anchor = screen.getByLabelText('Strength');
  fireEvent.click(anchor);
  fireEvent.scroll(screen.getByTestId('elsewhere'));
  fireEvent.scroll(document);
  expect(popover()).not.toBeNull();
  anchor.getBoundingClientRect = () => new DOMRect(0, -40, 80, 20);
  // A scroll inside the popover, or anywhere not around the anchor, can't have moved it.
  fireEvent.scroll(popover()!);
  fireEvent.scroll(screen.getByTestId('elsewhere'));
  expect(popover()).not.toBeNull();
  fireEvent.scroll(document);
  expect(popover()).toBeNull();
});

test('Popover whose anchor is removed closes on a scroll, but not its own', () => {
  // A removed element measures as an empty box at the corner, as in a browser.
  const rect = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
    return this.isConnected ? new DOMRect(0, 10, 60, 20) : new DOMRect();
  };
  try {
    const { rerender } = render(<LateAnchor anchored />);
    rerender(<LateAnchor anchored={false} />);
    fireEvent.scroll(popover()!);
    expect(popover()).not.toBeNull();
    fireEvent.scroll(document);
    expect(popover()).toBeNull();
  } finally {
    HTMLElement.prototype.getBoundingClientRect = rect;
  }
});

test('Popover renders nothing on a server, even open', () => {
  function Open() {
    const anchor = useRef<ComponentRef<typeof View>>(null);
    return (
      <SilkProvider theme={theme}>
        <Text testID="page">Page</Text>
        <Popover.Root open onOpenChange={() => {}} anchor={anchor}>
          <Popover.Content testID="popover" />
        </Popover.Root>
      </SilkProvider>
    );
  }
  const html = renderToString(<Open />);
  expect(html).toContain('data-testid="page"');
  expect(html).not.toContain('data-testid="popover"');
});

/** The items a server-rendered Listbox puts in the Tab order, by label. */
function serverTabStops(value: string | undefined, disabled?: string): string[] {
  const host = document.createElement('div');
  host.innerHTML = renderToString(
    <SilkProvider theme={theme}>
      <Listbox.Root accessibilityLabel="Steps" value={value} onValueChange={() => {}}>
        {STEPS.map((step) => (
          <Listbox.Item key={step} value={step} disabled={step === disabled}>
            {step}
          </Listbox.Item>
        ))}
      </Listbox.Root>
    </SilkProvider>,
  );
  return [...host.querySelectorAll('[role="option"][tabindex="0"]')].map(
    (option) => option.textContent ?? '',
  );
}

test('Listbox server markup has one Tab stop, the chosen item', () => {
  expect(serverTabStops('1500')).toEqual(['1500']);
});

test('Listbox server markup with nothing chosen lets Tab reach every enabled item', () => {
  expect(serverTabStops(undefined, '1100')).toEqual(['1300', '1500', '1700']);
});

// The server can't know which items are disabled until they mount.
test('Listbox server markup with a disabled chosen item has no Tab stop', () => {
  expect(serverTabStops('1500', '1500')).toEqual([]);
});

test('Popover closes when the window resizes', () => {
  render(<PickerHarness />);
  fireEvent.click(screen.getByLabelText('Strength'));
  act(() => {
    window.dispatchEvent(new Event('resize'));
  });
  expect(popover()).toBeNull();
});

test('Popover re-places as its content resizes, on the side it took first', () => {
  const observed: Array<() => void> = [];
  const Observer = globalThis.ResizeObserver;
  globalThis.ResizeObserver = class {
    constructor(callback: () => void) {
      observed.push(callback);
    }
    observe() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  const rect = HTMLElement.prototype.getBoundingClientRect;
  let layerHeight = 900;
  HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
    if (this.getAttribute('aria-label') === 'Strength') return new DOMRect(50, 700, 80, 20);
    if (this.querySelector('[data-testid="popover"]')) return new DOMRect(0, 0, 200, layerHeight);
    return rect.call(this);
  };
  try {
    render(<PickerHarness />);
    fireEvent.click(screen.getByLabelText('Strength'));
    const layer = () => popover()!.parentElement!;
    // Too tall for either side: the roomier top, shrunk to the room there.
    expect(layer().style.top).toBe('8px');
    layerHeight = 100;
    act(() => observed.forEach((callback) => callback()));
    expect(layer().style.top).toBe(`${700 - 4 - 100}px`);
  } finally {
    globalThis.ResizeObserver = Observer;
    HTMLElement.prototype.getBoundingClientRect = rect;
  }
});

const nextFrame = () => act(() => new Promise((resolve) => requestAnimationFrame(resolve)));

function LateAnchor({ anchored }: { readonly anchored: boolean }) {
  const [open, setOpen] = useState(true);
  const anchor = useRef<ComponentRef<typeof View>>(null);
  return (
    <SilkProvider theme={theme}>
      <Popover.Root open={open} onOpenChange={setOpen} anchor={anchor}>
        <Popover.Content testID="popover">
          <Text>Inside</Text>
        </Popover.Content>
      </Popover.Root>
      {anchored ? (
        <Pressable ref={anchor} accessibilityRole="button" accessibilityLabel="Strength" />
      ) : null}
    </SilkProvider>
  );
}

test('Popover opened on mount is placed even when its anchor comes after it', async () => {
  render(<LateAnchor anchored />);
  const layer = () => popover()!.parentElement!;
  // Unplaced until the anchor attaches, then placed on the next frame.
  expect(layer().style.opacity).toBe('0');
  await nextFrame();
  expect(layer().style.opacity).toBe('');
  expect(layer().style.top).not.toBe('');
});

test('Popover with nothing to focus inside takes focus itself as it opens', () => {
  render(<LateAnchor anchored />);
  expect(document.activeElement).toBe(popover()!.parentElement);
});

test('Popover whose anchor mounts frames later is placed, and closes as it scrolls away', async () => {
  const { rerender } = render(<LateAnchor anchored={false} />);
  const layer = () => popover()!.parentElement!;
  await nextFrame();
  await nextFrame();
  expect(layer().style.opacity).toBe('0');
  rerender(<LateAnchor anchored />);
  await nextFrame();
  // Placed: the unplaced style (unseen, at the window's corner) is gone.
  expect(layer().style.opacity).toBe('');
  screen.getByLabelText('Strength').getBoundingClientRect = () => new DOMRect(0, -40, 60, 20);
  fireEvent.scroll(document);
  expect(popover()).toBeNull();
});

test('Listbox items take the provider density unless told otherwise', () => {
  const rowHeight = (provider?: 'compact', own?: 'comfortable') => {
    const { unmount } = render(
      <SilkProvider theme={theme} density={provider}>
        <Listbox.Root accessibilityLabel="Steps" value={undefined} density={own} onValueChange={() => {}}>
          <Listbox.Item value="a">a</Listbox.Item>
        </Listbox.Root>
      </SilkProvider>,
    );
    const height = getComputedStyle(options()[0]).minHeight;
    unmount();
    return height;
  };
  expect(rowHeight('compact')).not.toBe(rowHeight());
  expect(rowHeight('compact', 'comfortable')).toBe(rowHeight());
});

test('Popover bounds its width instead of fixing it, so a new size is measured again', () => {
  const rect = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
    if (this.querySelector('[data-testid="popover"]')) return new DOMRect(0, 0, 220, 100);
    return rect.call(this);
  };
  try {
    render(<PickerHarness />);
    fireEvent.click(screen.getByLabelText('Strength'));
    const layer = popover()!.parentElement!;
    expect(layer.style.width).toBe('max-content');
    expect(layer.style.maxWidth).toBe(`${Math.max(0, document.documentElement.clientWidth - 16)}px`);
  } finally {
    HTMLElement.prototype.getBoundingClientRect = rect;
  }
});

test('Popover keeps focus where it is as its placement props change', () => {
  const { rerender } = render(<PickerHarness focusOnOpen sideOffset={4} />);
  fireEvent.click(screen.getByLabelText('Strength'));
  expect(focused()).toBe('1300');
  rerender(<PickerHarness focusOnOpen sideOffset={8} />);
  expect(focused()).toBe('1300');
  expect(popover()).not.toBeNull();
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

test('pointer leaving the list clears the highlight, unless the list holds focus', () => {
  const highlights: (string | undefined)[] = [];
  render(<PickerHarness onHighlight={(value) => highlights.push(value)} />);
  fireEvent.click(screen.getByLabelText('Strength'));
  const list = document.querySelector<HTMLElement>('[role="listbox"]')!;
  const leave = () => {
    const event = new MouseEvent('pointerout', { bubbles: true });
    Object.defineProperty(event, 'pointerType', { value: 'mouse' });
    act(() => {
      list.dispatchEvent(event);
    });
  };
  pointAt(options()[2]!, 'mouse');
  leave();
  expect(options()[2]!.hasAttribute('data-highlighted')).toBe(false);
  expect(highlights).toEqual(['1500', undefined]);
  act(() => options()[0]!.focus());
  leave();
  expect(options()[0]!.getAttribute('data-highlighted')).toBe('true');
});

test('Listbox takes its size from the provider defaults', () => {
  const rowHeight = (defaults?: SilkDefaults) => {
    const { unmount } = render(
      <SilkProvider theme={theme} defaults={defaults}>
        <Listbox.Root accessibilityLabel="Steps" value={undefined} onValueChange={() => {}}>
          <Listbox.Item value="a">a</Listbox.Item>
        </Listbox.Root>
      </SilkProvider>,
    );
    const height = getComputedStyle(options()[0]!).minHeight;
    unmount();
    return height;
  };
  // Space steps 6 + 1 and 7 at the default scale.
  expect(rowHeight({ Listbox: { size: 'sm' } })).toBe('28px');
  expect(rowHeight()).toBe('32px');
});

test("the chosen item's check is not part of its name", () => {
  render(
    <SilkProvider theme={theme}>
      <Listbox.Root accessibilityLabel="Steps" value="b" onValueChange={() => {}}>
        <Listbox.Item value="a">A</Listbox.Item>
        <Listbox.Item value="b">B</Listbox.Item>
      </Listbox.Root>
    </SilkProvider>,
  );
  expect(screen.getByRole('option', { name: 'B' }).getAttribute('aria-selected')).toBe('true');
});

test("Listbox calls the caller's onKeyDown, then handles the key", () => {
  const keys: string[] = [];
  render(
    <SilkProvider theme={theme}>
      <Listbox.Root
        accessibilityLabel="Steps"
        value="a"
        onValueChange={() => {}}
        onKeyDown={(event) => keys.push(event.nativeEvent.key)}
      >
        <Listbox.Item value="a">A</Listbox.Item>
        <Listbox.Item value="b">B</Listbox.Item>
      </Listbox.Root>
    </SilkProvider>,
  );
  act(() => screen.getByRole('option', { name: 'A' }).focus());
  press('ArrowDown');
  expect(keys).toEqual(['ArrowDown']);
  expect(document.activeElement).toBe(screen.getByRole('option', { name: 'B' }));
});

test('Listbox skips disabled items: Tab stop, autoFocus and arrows land on enabled ones', () => {
  render(<PickerHarness focusOnOpen initial="1100" disabled={['1100', '1500']} />);
  fireEvent.click(screen.getByLabelText('Strength'));
  expect(options().map((option) => option.tabIndex)).toEqual([-1, 0, -1, -1]);
  expect(focused()).toBe('1300');
  press('ArrowDown');
  expect(focused()).toBe('1700');
  press('Home');
  expect(focused()).toBe('1300');
});

test('Listbox gives the first item the Tab stop when the chosen one is not shown', () => {
  render(<PickerHarness initial="1900" />);
  fireEvent.click(screen.getByLabelText('Strength'));
  expect(options().map((option) => option.tabIndex)).toEqual([0, -1, -1, -1]);
});

test('Listbox autoFocus focuses as it turns on, on a list already shown', () => {
  function Late() {
    const [focusNow, setFocusNow] = useState(false);
    return (
      <SilkProvider theme={theme}>
        <Pressable accessibilityRole="button" accessibilityLabel="Now" onPress={() => setFocusNow(true)} />
        <Listbox.Root accessibilityLabel="Steps" value="1500" autoFocus={focusNow} onValueChange={() => {}}>
          {STEPS.map((step) => (
            <Listbox.Item key={step} value={step} accessibilityLabel={step}>
              {step}
            </Listbox.Item>
          ))}
        </Listbox.Root>
      </SilkProvider>
    );
  }
  render(<Late />);
  expect(document.activeElement).toBe(document.body);
  fireEvent.click(screen.getByLabelText('Now'));
  expect(focused()).toBe('1500');
});

test('Listbox keeps a Tab stop as items filtered by a child that renders alone come and go', () => {
  let filter: (query: string) => void = () => {};
  function Filtered() {
    const [query, setQuery] = useState('');
    filter = setQuery;
    return STEPS.filter((step) => step.includes(query)).map((step) => (
      <Listbox.Item key={step} value={step} accessibilityLabel={step}>
        {step}
      </Listbox.Item>
    ));
  }
  render(
    <SilkProvider theme={theme}>
      <Listbox.Root accessibilityLabel="Steps" value="1300" onValueChange={() => {}}>
        <Filtered />
      </Listbox.Root>
    </SilkProvider>,
  );
  expect(options().map((option) => option.tabIndex)).toEqual([-1, 0, -1, -1]);
  act(() => filter('7'));
  expect(options().map((option) => option.tabIndex)).toEqual([0]);
  act(() => filter(''));
  expect(options().map((option) => option.tabIndex)).toEqual([-1, 0, -1, -1]);
});

test('Listbox arrows follow items a child reorders on its own', () => {
  let reverse: () => void = () => {};
  function Sorted() {
    const [reversed, setReversed] = useState(false);
    reverse = () => setReversed(true);
    const steps = reversed ? [...STEPS].reverse() : STEPS;
    return steps.map((step) => (
      <Listbox.Item key={step} value={step} accessibilityLabel={step}>
        {step}
      </Listbox.Item>
    ));
  }
  render(
    <SilkProvider theme={theme}>
      <Listbox.Root accessibilityLabel="Steps" value="1300" onValueChange={() => {}}>
        <Sorted />
      </Listbox.Root>
    </SilkProvider>,
  );
  act(() => reverse());
  act(() => options()[0]!.focus());
  expect(focused()).toBe('1700');
  press('ArrowDown');
  expect(focused()).toBe('1500');
});

test('Listbox.ItemText takes the item label color, which follows the item state', () => {
  render(
    <SilkProvider theme={theme}>
      <Listbox.Root accessibilityLabel="Steps" value="b" onValueChange={() => {}}>
        <Listbox.Item value="a">
          <Listbox.ItemText testID="a">A</Listbox.ItemText>
        </Listbox.Item>
        <Listbox.Item value="b">
          <Listbox.ItemText testID="b">B</Listbox.ItemText>
        </Listbox.Item>
      </Listbox.Root>
    </SilkProvider>,
  );
  const color = (id: string) => getComputedStyle(screen.getByTestId(id)).color;
  expect(color('b')).not.toBe(color('a'));
});

test('Listbox.ItemText tone="secondary" is the description, dimmed with a disabled item', () => {
  render(
    <SilkProvider theme={theme}>
      <Listbox.Root accessibilityLabel="Plans" value="a" onValueChange={() => {}}>
        <Listbox.Item value="a">
          <Listbox.ItemText testID="label">A</Listbox.ItemText>
          <Listbox.ItemText tone="secondary" testID="on">One</Listbox.ItemText>
        </Listbox.Item>
        <Listbox.Item value="b" disabled>
          <Listbox.ItemText testID="off-label">B</Listbox.ItemText>
          <Listbox.ItemText tone="secondary" testID="off">Two</Listbox.ItemText>
        </Listbox.Item>
      </Listbox.Root>
    </SilkProvider>,
  );
  const color = (id: string) => getComputedStyle(screen.getByTestId(id)).color;
  expect(color('on')).not.toBe(color('label'));
  expect(color('off')).toBe(color('off-label'));
  expect(color('off')).not.toBe(color('on'));
});

test("only the chosen item draws a check in its indicator", () => {
  render(
    <SilkProvider theme={theme}>
      <Listbox.Root accessibilityLabel="Steps" value="b" onValueChange={() => {}}>
        <Listbox.Item value="a">A</Listbox.Item>
        <Listbox.Item value="b">B</Listbox.Item>
      </Listbox.Root>
    </SilkProvider>,
  );
  const indicator = (name: string) =>
    screen.getByRole('option', { name }).querySelector('[aria-hidden="true"]');
  expect(indicator('A')?.childElementCount).toBe(0);
  expect(indicator('B')?.childElementCount).toBe(1);
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
    width: 200,
    maxWidth: 384,
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
    width: 200,
    maxWidth: 384,
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

test('placeFloating narrows it to the window less the padding on both sides', () => {
  const anchor = { x: 50, y: 100, width: 80, height: 20 };
  const narrow = placeFloating(anchor, { width: 420, height: 100 }, { width: 360, height: 800 }, OPTIONS);
  expect(narrow).toMatchObject({ left: 8, width: 344 });
});

test('placeFloating keeps the side it is given once its height shrinks to the room there', () => {
  const low = { x: 50, y: 700, width: 80, height: 20 };
  const first = placeFloating(low, { width: 200, height: 900 }, WINDOW, OPTIONS);
  expect(first.side).toBe('top');
  const again = placeFloating(low, { width: 200, height: first.maxHeight }, WINDOW, {
    ...OPTIONS,
    side: first.side,
  });
  expect(again).toEqual(first);
});
