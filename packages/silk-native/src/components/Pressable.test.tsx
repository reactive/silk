import { createTheme, type ToneName } from '@reactive/silk-core';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@rstest/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { Platform, Text } from 'react-native';
import { SilkProvider } from '../theme/SilkProvider.js';
import { Button } from './Button.js';
import { Card } from './Card.js';
import { Checkbox } from './Checkbox.js';
import { Pressable } from './Pressable.js';
import { RadioGroup } from './RadioGroup.js';
import { Surface } from './Surface.js';
import { Switch } from './Switch.js';

const theme = createTheme({ colorScheme: 'dark' });
/** The tone's ring color, as the DOM writes it back. */
function ring(tone: ToneName) {
  const probe = document.createElement('div');
  probe.style.outlineColor = theme.semantic.color.tones[tone].focusRing;
  return probe.style.outlineColor;
}

/** Focuses `el` as the keyboard would (`:focus-visible`) or a click would. */
function focus(el: HTMLElement, visible: boolean) {
  el.matches = (selector: string) =>
    selector === ':focus-visible' ? visible : Element.prototype.matches.call(el, selector);
  fireEvent.focus(el);
}

const outlineColor = (el: HTMLElement) => el.style.outlineColor;

function renderPressable() {
  const result = render(
    <SilkProvider theme={theme}>
      <Pressable accessibilityRole="button" testID="p" />
    </SilkProvider>,
  );
  return { ...result, el: screen.getByTestId('p') };
}

test('keyboard focus draws the accent ring; blur removes it', () => {
  const { el } = renderPressable();
  expect(outlineColor(el)).toBe('');
  focus(el, true);
  expect(el.style.outlineWidth).toBe(`${theme.semantic.focusRing.width}px`);
  expect(el.style.outlineOffset).toBe(`${theme.semantic.focusRing.offset}px`);
  expect(outlineColor(el)).toBe(ring('accent'));
  fireEvent.blur(el);
  expect(outlineColor(el)).toBe('');
});

test('focus from a click draws no ring', () => {
  const { el } = renderPressable();
  focus(el, false);
  expect(outlineColor(el)).toBe('');
});

test('a key pressed after a click turns the ring on', () => {
  const { el } = renderPressable();
  focus(el, false);
  expect(outlineColor(el)).toBe('');
  // The browser now matches :focus-visible because the keyboard is in use.
  el.matches = (selector: string) => selector === ':focus-visible';
  fireEvent.keyDown(el, { key: ' ' });
  expect(outlineColor(el)).toBe(ring('accent'));
  fireEvent.blur(el);
  fireEvent.keyDown(document, { key: 'a' });
  expect(outlineColor(el)).toBe('');
});

test('unmounting while focused stops watching keys', () => {
  const { el, unmount } = renderPressable();
  const removed: string[] = [];
  const remove = document.removeEventListener.bind(document);
  document.removeEventListener = ((type: string, ...args: [never, never]) => {
    removed.push(type);
    remove(type, ...args);
  }) as typeof document.removeEventListener;
  try {
    focus(el, false);
    unmount();
    expect(removed).toEqual(expect.arrayContaining(['keydown', 'keyup']));
  } finally {
    document.removeEventListener = remove;
  }
});

test('style and children functions receive focusVisible; style can adjust the ring', () => {
  render(
    <SilkProvider theme={theme}>
      <Pressable
        accessibilityRole="button"
        testID="p"
        style={({ focusVisible }) => ({ outlineOffset: -2, opacity: focusVisible ? 0.5 : 1 })}
      >
        {({ focusVisible }) => <Text>{focusVisible ? 'ringed' : 'plain'}</Text>}
      </Pressable>
    </SilkProvider>,
  );
  const el = screen.getByTestId('p');
  focus(el, true);
  expect(el.textContent).toBe('ringed');
  expect(el.style.opacity).toBe('0.5');
  expect(el.style.outlineOffset).toBe('-2px');
  expect(outlineColor(el)).toBe(ring('accent'));
});

test('focusRing picks the tone, or false draws none', () => {
  render(
    <SilkProvider theme={theme}>
      <Pressable accessibilityRole="button" testID="danger" focusRing="danger" />
      <Pressable accessibilityRole="button" testID="none" focusRing={false} />
    </SilkProvider>,
  );
  const danger = screen.getByTestId('danger');
  const none = screen.getByTestId('none');
  focus(danger, true);
  focus(none, true);
  expect(outlineColor(danger)).toBe(ring('danger'));
  expect(outlineColor(none)).toBe('');
});

test('consumer onFocus and onBlur still fire', () => {
  const calls: string[] = [];
  render(
    <SilkProvider theme={theme}>
      <Pressable
        accessibilityRole="button"
        testID="p"
        onFocus={() => calls.push('focus')}
        onBlur={() => calls.push('blur')}
      />
    </SilkProvider>,
  );
  const el = screen.getByTestId('p');
  focus(el, true);
  fireEvent.blur(el);
  expect(calls).toEqual(['focus', 'blur']);
});

test('Silk controls ring in their tone, and in danger when invalid', () => {
  render(
    <SilkProvider theme={theme}>
      <Button tone="success">Save</Button>
      <Checkbox invalid testID="box">
        Agree
      </Checkbox>
      <Switch invalid testID="switch" accessibilityLabel="Alerts" />
      <Switch tone="success" testID="switch-ok" accessibilityLabel="Sync" />
      <RadioGroup.Root value="a" accessibilityLabel="Pick">
        <RadioGroup.Item value="a" testID="radio">
          A
        </RadioGroup.Item>
      </RadioGroup.Root>
    </SilkProvider>,
  );
  const button = screen.getByRole('button', { name: 'Save' });
  const box = screen.getByTestId('box');
  const radio = screen.getByTestId('radio');
  const sw = screen.getByTestId('switch');
  const swOk = screen.getByTestId('switch-ok');
  for (const el of [button, box, radio, sw, swOk]) focus(el, true);
  // The invalid Switch's 2px ring replaces its 1px invalid outline.
  expect(outlineColor(sw)).toBe(ring('danger'));
  expect(sw.style.outlineWidth).toBe(`${theme.semantic.focusRing.width}px`);
  expect(outlineColor(swOk)).toBe(ring('success'));
  expect(outlineColor(button)).toBe(ring('success'));
  expect(outlineColor(box)).toBe(ring('danger'));
  expect(outlineColor(radio)).toBe(ring('accent'));
});

test('pressable Card and Surface ring too', () => {
  render(
    <SilkProvider theme={theme}>
      <Card testID="card" onPress={() => {}} />
      <Surface testID="surface" onPress={() => {}} />
    </SilkProvider>,
  );
  for (const id of ['card', 'surface']) {
    const el = screen.getByTestId(id);
    focus(el, true);
    expect(outlineColor(el)).toBe(ring('accent'));
  }
});

test('a focused child rings itself, not the pressable around it', () => {
  render(
    <SilkProvider theme={theme}>
      <Card testID="card" onPress={() => {}}>
        <Checkbox testID="box">Agree</Checkbox>
      </Card>
    </SilkProvider>,
  );
  const card = screen.getByTestId('card');
  const box = screen.getByTestId('box');
  focus(box, true);
  fireEvent.focusIn(box);
  expect(outlineColor(box)).toBe(ring('accent'));
  expect(outlineColor(card)).toBe('');
});

test('on native, every focus rings', () => {
  const os = Platform.OS;
  Object.assign(Platform, { OS: 'android' });
  try {
    const { el } = renderPressable();
    focus(el, false);
    expect(outlineColor(el)).toBe(ring('accent'));
  } finally {
    Object.assign(Platform, { OS: os });
  }
});

test("no source file uses React Native's Pressable or Touchables directly", () => {
  const src = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const wrapper = path.join('components', 'Pressable.tsx');
  const files = (readdirSync(src, { recursive: true }) as string[]).filter(
    (f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f) && f !== wrapper,
  );
  // An import or re-export from react-native that names these components, a
  // namespace or star import or export of it, or require() / import() of it.
  const bypass =
    /(?:import|export)\s[^;]*?\b(?:Pressable|Touchable\w*)\b[^;]*?from\s*['"]react-native['"]|(?:import\s*\*\s*as\s*\w+|export\s*\*)\s*from\s*['"]react-native['"]|(?:require|import)\(\s*['"]react-native['"]\s*\)/;
  const offenders = files.filter((f) => bypass.test(readFileSync(path.join(src, f), 'utf8')));
  // Import Silk's Pressable ('./Pressable.js') so every pressable rings on focus.
  expect(offenders).toEqual([]);
});
