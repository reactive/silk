import { afterEach, expect, test } from '@rstest/core';
import { cleanup, render, screen } from '@testing-library/react';
import { Button } from './Button';
import { SilkProvider } from '../theme/SilkProvider';

afterEach(() => {
  cleanup();
});

test('Button renders recipe defaults as data attributes', () => {
  render(<Button>Save</Button>);
  const button = screen.getByRole('button', { name: 'Save' });
  expect(button.getAttribute('data-variant')).toBe('solid');
  expect(button.getAttribute('data-tone')).toBe('accent');
  expect(button.getAttribute('data-size')).toBe('md');
  expect(button.getAttribute('data-density')).toBe('comfortable');
});

test('Button respects SilkProvider defaults and prop overrides', () => {
  render(
    <SilkProvider defaults={{ Button: { variant: 'soft', tone: 'neutral' } }}>
      <Button tone="danger">Delete</Button>
    </SilkProvider>,
  );
  const button = screen.getByRole('button', { name: 'Delete' });
  expect(button.getAttribute('data-variant')).toBe('soft');
  expect(button.getAttribute('data-tone')).toBe('danger');
});

test('Button accepts className escape hatch', () => {
  render(<Button className="consumer-override">Go</Button>);
  expect(screen.getByRole('button', { name: 'Go' }).className).toContain(
    'consumer-override',
  );
});
