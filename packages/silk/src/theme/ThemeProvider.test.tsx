import { createTheme } from '@reactive/silk-core';
import { expect, test } from '@rstest/core';
import { render } from '@testing-library/react';
import { ThemeProvider } from './ThemeProvider';

test('named provider emits data-theme without inline CSS variables', () => {
  const { container } = render(
    <ThemeProvider colorScheme="dark">
      <span>content</span>
    </ThemeProvider>,
  );
  const root = container.firstElementChild as HTMLElement;
  expect(root.getAttribute('data-theme')).toBe('dark');
  expect(root.style.getPropertyValue('--silk-color-surface')).toBe('');
});

test('custom provider emits inline variables without stylesheet insertion', () => {
  const theme = createTheme({
    semantic: { color: { surface: 'rgb(1, 2, 3)' } },
  });
  const { container } = render(
    <ThemeProvider theme={theme}>
      <span>content</span>
    </ThemeProvider>,
  );
  const root = container.firstElementChild as HTMLElement;
  expect(root.style.getPropertyValue('--silk-color-surface')).toBe('rgb(1, 2, 3)');
  expect(container.querySelector('style')).toBeNull();
});

test('system scheme omits data-theme', () => {
  const { container } = render(
    <ThemeProvider colorScheme="system">
      <span>content</span>
    </ThemeProvider>,
  );
  const root = container.firstElementChild as HTMLElement;
  expect(root.hasAttribute('data-theme')).toBe(false);
});

test('density prop sets data-density; omitted inherits', () => {
  const { container, rerender } = render(
    <ThemeProvider density="compact">
      <span>content</span>
    </ThemeProvider>,
  );
  expect(
    (container.firstElementChild as HTMLElement).getAttribute('data-density'),
  ).toBe('compact');

  rerender(
    <ThemeProvider>
      <span>content</span>
    </ThemeProvider>,
  );
  expect(
    (container.firstElementChild as HTMLElement).hasAttribute('data-density'),
  ).toBe(false);
});

test('nested density-only provider inherits parent colorScheme', () => {
  const { container } = render(
    <ThemeProvider colorScheme="light">
      <ThemeProvider density="compact">
        <span>content</span>
      </ThemeProvider>
    </ThemeProvider>,
  );
  const outer = container.firstElementChild as HTMLElement;
  const inner = outer.firstElementChild as HTMLElement;
  expect(outer.getAttribute('data-theme')).toBe('light');
  expect(inner.getAttribute('data-theme')).toBe('light');
  expect(inner.getAttribute('data-density')).toBe('compact');
});

test('explicit named scheme drops parent semantic vars but keeps component hooks', () => {
  const theme = createTheme({
    semantic: { color: { surface: 'rgb(1, 2, 3)' } },
  });
  const { container } = render(
    <ThemeProvider
      theme={theme}
      style={{ ['--silk-button-bg' as string]: 'rgb(4, 5, 6)' }}
    >
      <ThemeProvider colorScheme="dark">
        <span>content</span>
      </ThemeProvider>
    </ThemeProvider>,
  );
  const outer = container.firstElementChild as HTMLElement;
  const inner = outer.firstElementChild as HTMLElement;
  expect(outer.style.getPropertyValue('--silk-color-surface')).toBe(
    'rgb(1, 2, 3)',
  );
  expect(inner.style.getPropertyValue('--silk-color-surface')).toBe('');
  expect(inner.style.getPropertyValue('--silk-button-bg')).toBe('rgb(4, 5, 6)');
  expect(inner.getAttribute('data-theme')).toBe('dark');
});

test('partial style override merges onto inherited custom vars', () => {
  const theme = createTheme({
    semantic: { color: { surface: 'rgb(1, 2, 3)' } },
  });
  const { container } = render(
    <ThemeProvider theme={theme}>
      <ThemeProvider style={{ ['--silk-color-text-primary' as string]: 'rgb(9, 9, 9)' }}>
        <span>content</span>
      </ThemeProvider>
    </ThemeProvider>,
  );
  const inner = (container.firstElementChild as HTMLElement)
    .firstElementChild as HTMLElement;
  expect(inner.style.getPropertyValue('--silk-color-surface')).toBe(
    'rgb(1, 2, 3)',
  );
  expect(inner.style.getPropertyValue('--silk-color-text-primary')).toBe(
    'rgb(9, 9, 9)',
  );
});
