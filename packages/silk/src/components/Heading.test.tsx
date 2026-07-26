import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import { SilkProvider } from '../theme/SilkProvider';
import { Heading } from './Heading';

test('Heading level derives the tag; size defaults from level', () => {
  render(
    <SilkProvider>
      <Heading level="1">Title</Heading>
    </SilkProvider>,
  );
  const el = screen.getByRole('heading', { level: 1 });
  expect(el.tagName).toBe('H1');
  expect(el.getAttribute('data-size')).toBe('xl');
});

test('Heading size can diverge from level', () => {
  render(
    <SilkProvider>
      <Heading level="3" size="xl">
        Big h3
      </Heading>
    </SilkProvider>,
  );
  const el = screen.getByRole('heading', { level: 3 });
  expect(el.getAttribute('data-size')).toBe('xl');
});
