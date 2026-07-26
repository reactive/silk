import { expect, test } from '@rstest/core';
import { render } from '@testing-library/react';
import {
  NativeShell,
  nativeShellStates,
  type NativeShellState,
} from './NativeShell';

function renderFixture(state: NativeShellState) {
  return render(<NativeShell state={state} />);
}

test.each(nativeShellStates)(
  'NativeShell state "%s" mounts with fixture markers',
  (state) => {
    const { container, getByText } = renderFixture(state);
    const root = container.querySelector('[data-fixture="native-shell"]');
    expect(root).not.toBeNull();
    expect(root?.getAttribute('data-fixture-state')).toBe(state);
    expect(getByText('Native shell')).toBeTruthy();
  },
);

test('compact and dark report scheme/density in summary', () => {
  const compact = renderFixture('compact');
  expect(compact.getByText(/density=compact/)).toBeTruthy();

  const dark = renderFixture('dark');
  expect(dark.getByText(/scheme=dark/)).toBeTruthy();
});

test('tenant summary includes tenant marker', () => {
  const { getByText } = renderFixture('tenant');
  expect(getByText(/tenant/)).toBeTruthy();
});

test('nested state renders nested region', () => {
  const { container, getByText } = renderFixture('nested');
  expect(container.querySelector('[data-region="nested"]')).not.toBeNull();
  expect(getByText(/Nested dark scheme/)).toBeTruthy();
});

test('longContent region is present', () => {
  const { container } = renderFixture('longContent');
  expect(
    container.querySelector('[data-region="long-content"]'),
  ).not.toBeNull();
});

test('disabled buttons expose disabled state', () => {
  const { getAllByRole } = renderFixture('disabled');
  const buttons = getAllByRole('button');
  expect(buttons.length).toBeGreaterThan(0);
  for (const button of buttons) {
    expect(button.getAttribute('aria-disabled')).toBe('true');
  }
});
