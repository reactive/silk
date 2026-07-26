import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import { Button } from '../components/Button';
import { Stack } from '../components/Stack';
import { SilkProvider } from './SilkProvider';
import { ThemeProvider } from './ThemeProvider';

test('ThemeProvider sets data-density', () => {
  const { container } = render(
    <ThemeProvider density="compact">
      <span>content</span>
    </ThemeProvider>,
  );
  const root = container.firstElementChild as HTMLElement;
  expect(root.getAttribute('data-density')).toBe('compact');
});

test('Button inherits provider density and allows local override', () => {
  render(
    <SilkProvider density="compact">
      <Button>Compact</Button>
      <Button density="comfortable">Comfortable</Button>
    </SilkProvider>,
  );
  expect(
    screen.getByRole('button', { name: 'Compact' }).getAttribute('data-density'),
  ).toBe('compact');
  expect(
    screen
      .getByRole('button', { name: 'Comfortable' })
      .getAttribute('data-density'),
  ).toBe('comfortable');
});

test('Stack under compact provider does not need its own density prop', () => {
  const { container } = render(
    <SilkProvider density="compact">
      <Stack data-testid="stack" gap="3">
        <span>a</span>
      </Stack>
    </SilkProvider>,
  );
  const root = container.firstElementChild as HTMLElement;
  expect(root.getAttribute('data-density')).toBe('compact');
  expect(screen.getByTestId('stack').getAttribute('data-gap')).toBe('3');
});
