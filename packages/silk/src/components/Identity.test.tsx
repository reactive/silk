import { afterEach, expect, test } from '@rstest/core';
import { cleanup, render, screen } from '@testing-library/react';
import { Identity } from './Identity';

afterEach(() => {
  cleanup();
});

test('Identity convenience form renders name and meta', () => {
  render(
    <Identity name="Ada Lovelace" meta="@ada" fallback="AL" />,
  );
  expect(screen.getByText('Ada Lovelace')).toBeTruthy();
  expect(screen.getByText('@ada')).toBeTruthy();
  expect(screen.getByText('AL')).toBeTruthy();
});

test('Identity compound parts share size context', () => {
  render(
    <Identity.Root size="lg">
      <Identity.Avatar fallback="AL" />
      <Identity.Name>Ada</Identity.Name>
      <Identity.Meta>Mathematician</Identity.Meta>
    </Identity.Root>,
  );
  const root = screen.getByText('Ada').closest('[data-size]');
  expect(root?.getAttribute('data-size')).toBe('lg');
  expect(screen.getByText('AL').getAttribute('data-size')).toBe('lg');
});
