import { createTheme, type Theme } from '@reactive/silk-core';
import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import { Button } from '../components/Button.js';
import { Text } from '../components/Text.js';
import { mapButtonStyle, mapTextStyle } from '../styles/mapStyles.js';
import { SilkProvider } from './SilkProvider.js';
import { ThemeProvider, useTheme } from './ThemeProvider.js';

function Cap({
  on,
}: {
  readonly on: (v: ReturnType<typeof useTheme>) => void;
}): null {
  on(useTheme());
  return null;
}

test('root defaults to light / comfortable', () => {
  let value: ReturnType<typeof useTheme> | undefined;
  render(
    <ThemeProvider>
      <Cap on={(v) => { value = v; }} />
    </ThemeProvider>,
  );
  expect(value?.theme.colorScheme).toBe('light');
  expect(value?.density).toBe('comfortable');
});

test('nested omission inherits parent Theme identity and density', () => {
  const tenant = createTheme({
    colorScheme: 'light',
    semantic: { color: { surface: 'rgb(1, 2, 3)' } },
  });
  let outer: ReturnType<typeof useTheme> | undefined;
  let inner: ReturnType<typeof useTheme> | undefined;

  render(
    <ThemeProvider theme={tenant} density="compact">
      <Cap on={(v) => { outer = v; }} />
      <ThemeProvider>
        <Cap on={(v) => { inner = v; }} />
      </ThemeProvider>
    </ThemeProvider>,
  );

  expect(inner?.theme).toBe(outer?.theme);
  expect(inner?.density).toBe('compact');
});

test('density-only nested override preserves theme identity', () => {
  const tenant = createTheme({
    semantic: { color: { surface: 'rgb(9, 9, 9)' } },
  });
  let outer: ReturnType<typeof useTheme> | undefined;
  let inner: ReturnType<typeof useTheme> | undefined;

  render(
    <ThemeProvider theme={tenant} density="comfortable">
      <Cap on={(v) => { outer = v; }} />
      <ThemeProvider density="compact">
        <Cap on={(v) => { inner = v; }} />
      </ThemeProvider>
    </ThemeProvider>,
  );

  expect(inner?.theme).toBe(outer?.theme);
  expect(inner?.density).toBe('compact');
  expect(outer?.density).toBe('comfortable');
});

test('nested colorScheme replaces custom parent theme', () => {
  const tenant = createTheme({
    colorScheme: 'light',
    semantic: { color: { surface: 'rgb(1, 2, 3)' } },
  });
  let inner: ReturnType<typeof useTheme> | undefined;

  render(
    <ThemeProvider theme={tenant}>
      <ThemeProvider colorScheme="dark">
        <Cap on={(v) => { inner = v; }} />
      </ThemeProvider>
    </ThemeProvider>,
  );

  expect(inner?.theme.colorScheme).toBe('dark');
  expect(inner?.theme.semantic.color.surface).not.toBe('rgb(1, 2, 3)');
});

test('theme wins over colorScheme', () => {
  const darkTenant = createTheme({
    colorScheme: 'dark',
    semantic: { color: { surface: 'rgb(5, 5, 5)' } },
  });
  let value: ReturnType<typeof useTheme> | undefined;

  render(
    <ThemeProvider theme={darkTenant} colorScheme="light">
      <Cap on={(v) => { value = v; }} />
    </ThemeProvider>,
  );

  expect(value?.theme).toBe(darkTenant);
  expect(value?.theme.colorScheme).toBe('dark');
});

test('system scheme resolves via Appearance (defaults to light under RNW)', () => {
  let value: ReturnType<typeof useTheme> | undefined;
  render(
    <ThemeProvider colorScheme="system">
      <Cap on={(v) => { value = v; }} />
    </ThemeProvider>,
  );
  expect(['light', 'dark']).toContain(value?.theme.colorScheme);
});

test('nested defaults replace rather than merge — Button loses parent default', () => {
  let captured: ReturnType<typeof useTheme> | undefined;
  render(
    <SilkProvider
      defaults={{ Button: { tone: 'danger' }, Text: { tone: 'secondary' } }}
    >
      <SilkProvider defaults={{ Text: { tone: 'accent' } }}>
        <Cap on={(v) => { captured = v; }} />
        <Button>Go</Button>
        <Text>Label</Text>
      </SilkProvider>
    </SilkProvider>,
  );

  expect(captured).toBeTruthy();
  const { theme } = captured!;
  // Nested map has no Button key → recipe default accent, not parent danger.
  expect(mapButtonStyle(theme, {}).view.backgroundColor).toBe(
    theme.semantic.color.tones.accent.solid,
  );
  expect(mapTextStyle(theme, { tone: 'accent' }).color).toBe(
    theme.semantic.color.tones.accent.text,
  );
  expect(screen.getByRole('button', { name: 'Go' })).toBeTruthy();
  expect(screen.getByText('Label')).toBeTruthy();
});

test('SilkProvider Button defaults apply and props override tone', () => {
  let captured: ReturnType<typeof useTheme> | undefined;
  render(
    <SilkProvider defaults={{ Button: { variant: 'soft', tone: 'neutral' } }}>
      <Cap on={(v) => { captured = v; }} />
      <Button tone="danger">Delete</Button>
    </SilkProvider>,
  );
  expect(captured).toBeTruthy();
  const { theme } = captured!;
  // Prop tone=danger wins; Soft + danger uses tone.text for FG.
  expect(mapButtonStyle(theme, { variant: 'soft', tone: 'danger' }).text.color).toBe(
    theme.semantic.color.tones.danger.text,
  );
  expect(screen.getByRole('button', { name: 'Delete' })).toBeTruthy();
});

test('density-only change keeps Theme identity when using colorScheme', () => {
  let first: Theme | undefined;
  let second: Theme | undefined;
  const { rerender } = render(
    <ThemeProvider colorScheme="light" density="comfortable">
      <Cap on={(v) => { first = v.theme; }} />
    </ThemeProvider>,
  );
  rerender(
    <ThemeProvider colorScheme="light" density="compact">
      <Cap on={(v) => { second = v.theme; }} />
    </ThemeProvider>,
  );
  expect(first).toBeTruthy();
  expect(second).toBe(first);
});

test('useTheme throws outside ThemeProvider', () => {
  expect(() => {
    render(<Cap on={() => {}} />);
  }).toThrow(/useTheme must be used within ThemeProvider/);
});
