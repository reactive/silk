import { expect, test } from '@rstest/core';
import { render, screen, within } from '@testing-library/react';
import { SilkProvider } from '@reactive/silk';
import { setPrefersReducedMotion } from '../../../../test/rstest-setup';
import {
  InspectorPanel,
  type InspectorPanelState,
} from './InspectorPanel';

const states: InspectorPanelState[] = [
  'normal',
  'overlaysOpen',
  'longContent',
  'reducedMotion',
  'nestedTheme',
  'multipleToasts',
];

function renderFixture(state: InspectorPanelState) {
  return render(
    <SilkProvider colorScheme="light">
      <InspectorPanel state={state} />
    </SilkProvider>,
  );
}

test.each(states)(
  'InspectorPanel state "%s" mounts with fixture markers',
  (state) => {
    const { container } = renderFixture(state);
    const root = container.querySelector('[data-fixture="inspector-panel"]');
    expect(root).not.toBeNull();
    expect(root?.getAttribute('data-fixture-state')).toBe(state);
    expect(within(root as HTMLElement).getByText('Inspector')).toBeTruthy();
  },
);

test('overlaysOpen mounts portaled menu, select, tooltip, and toast', () => {
  renderFixture('overlaysOpen');
  // Prefer DOM queries for concurrent overlays — modal layers aria-hide peers.
  expect(document.querySelector('[role="menu"]')).not.toBeNull();
  expect(document.querySelector('[role="listbox"]')).not.toBeNull();
  expect(document.querySelector('[role="tooltip"]')).not.toBeNull();
  expect(screen.getByText('Primary toast')).toBeTruthy();
  expect(document.body.contains(document.querySelector('[role="menu"]'))).toBe(
    true,
  );
});

test('longContent scroll region contains overflow rows', () => {
  const { container } = renderFixture('longContent');
  const root = container.querySelector(
    '[data-fixture="inspector-panel"]',
  ) as HTMLElement;
  const scroll = root.querySelector('[data-region="scroll"]') as HTMLElement;
  expect(within(scroll).getByText('Overflow row 1')).toBeTruthy();
  expect(within(scroll).getByText('Overflow row 24')).toBeTruthy();
});

test('reducedMotion mocks matchMedia and keeps reduced-motion region', () => {
  setPrefersReducedMotion(true);
  const { container } = renderFixture('reducedMotion');
  const root = container.querySelector(
    '[data-fixture="inspector-panel"]',
  ) as HTMLElement;
  expect(root.querySelector('[data-region="reduced-motion"]')).not.toBeNull();
  expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(
    true,
  );
});

test('nestedTheme wraps panel in dark theme provider', () => {
  const { container } = renderFixture('nestedTheme');
  const dark = container.querySelector('[data-theme="dark"]');
  expect(dark).not.toBeNull();
  expect(
    dark?.querySelector('[data-fixture="inspector-panel"]'),
  ).not.toBeNull();
});

test('multipleToasts shows two toast titles', () => {
  renderFixture('multipleToasts');
  expect(screen.getByText('Primary toast')).toBeTruthy();
  expect(screen.getByText('Secondary toast')).toBeTruthy();
});

test('changing state after mount opens and closes overlays', () => {
  const { rerender } = renderFixture('normal');
  expect(document.querySelector('[role="menu"]')).toBeNull();
  expect(document.querySelector('[role="listbox"]')).toBeNull();
  expect(screen.queryByText('Primary toast')).toBeNull();

  const withState = (state: InspectorPanelState) => (
    <SilkProvider colorScheme="light">
      <InspectorPanel state={state} />
    </SilkProvider>
  );

  rerender(withState('overlaysOpen'));
  expect(document.querySelector('[role="menu"]')).not.toBeNull();
  expect(document.querySelector('[role="listbox"]')).not.toBeNull();
  expect(document.querySelector('[role="tooltip"]')).not.toBeNull();
  expect(screen.getByText('Primary toast')).toBeTruthy();

  rerender(withState('normal'));
  expect(document.querySelector('[role="menu"]')).toBeNull();
  expect(document.querySelector('[role="listbox"]')).toBeNull();
  expect(document.querySelector('[role="tooltip"]')).toBeNull();
  expect(screen.queryByText('Primary toast')).toBeNull();

  rerender(withState('multipleToasts'));
  expect(screen.getByText('Primary toast')).toBeTruthy();
  expect(screen.getByText('Secondary toast')).toBeTruthy();
});
