import { mediaScale, mediaScaleSizes } from '@reactive/silk-core';
import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import { expectNoAxeViolations } from '../test/a11y';
import { Identity } from './Identity';

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

test('Identity name and meta roles track mediaScale size', () => {
  for (const size of mediaScaleSizes) {
    const { unmount } = render(
      <Identity.Root size={size}>
        <Identity.Name>Ada</Identity.Name>
        <Identity.Meta>@ada</Identity.Meta>
      </Identity.Root>,
    );
    expect(screen.getByText('Ada').getAttribute('data-role')).toBe(
      mediaScale[size].primaryRole,
    );
    expect(screen.getByText('@ada').getAttribute('data-role')).toBe(
      mediaScale[size].metaRole,
    );
    unmount();
  }
  expect(mediaScale.sm.primaryRole).toBe('label');
  expect(mediaScale.md.primaryRole).toBe('headingSm');
  expect(mediaScale.lg.primaryRole).toBe('headingSm');
});

test('Identity model supplies defaults; explicit props override', () => {
  render(
    <Identity
      model={{
        id: 'u1',
        name: 'From Model',
        meta: '@model',
        fallback: 'FM',
      }}
      name="Override"
      meta={null}
    />,
  );
  expect(screen.getByText('Override')).toBeTruthy();
  expect(screen.queryByText('@model')).toBeNull();
  expect(screen.getByText('FM')).toBeTruthy();
});

test('Identity parts throw outside Root', () => {
  expect(() => render(<Identity.Name>X</Identity.Name>)).toThrow(
    /within Identity\.Root/,
  );
});

test('Identity has no axe violations', async () => {
  const { container } = render(
    <Identity name="Ada Lovelace" meta="@ada" fallback="AL" />,
  );
  await expectNoAxeViolations(container);
});
