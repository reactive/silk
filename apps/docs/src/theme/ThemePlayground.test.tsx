import { expect, test } from '@rstest/core';
import { act, render, screen } from '@testing-library/react';
import { ThemePlayground } from './ThemePlayground';

test('ThemePlayground mounts gallery and contrast readout', async () => {
  render(<ThemePlayground brandSeed="#0ea5e9" colorScheme="dark" />);
  const root = document.querySelector('[data-fixture="theme-playground"]');
  expect(root).not.toBeNull();
  expect(root?.getAttribute('data-scheme')).toBe('dark');
  expect(screen.getByText(/Contrast: pass/)).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Accent' })).toBeTruthy();
});

test('invalid intermediate seed keeps last valid theme', async () => {
  const { rerender } = render(
    <ThemePlayground brandSeed="#0ea5e9" colorScheme="light" />,
  );
  expect(screen.getByText(/Contrast: pass/)).toBeTruthy();

  rerender(<ThemePlayground brandSeed="#zz" colorScheme="light" />);
  await act(async () => {
    await new Promise((r) => setTimeout(r, 200));
  });
  expect(screen.getByText(/holding last valid theme/)).toBeTruthy();
  expect(screen.getByText(/Contrast: pass/)).toBeTruthy();
});
