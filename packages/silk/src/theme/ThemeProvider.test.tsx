import { createTheme } from '@reactive/silk-core';
import { afterEach, expect, test } from '@rstest/core';
import { cleanup, render } from '@testing-library/react';
import { ThemeProvider } from './ThemeProvider';

afterEach(() => {
  cleanup();
});

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
