import { expect, test } from '@rstest/core';
import { render, within } from '@testing-library/react';
import { SilkProvider } from '@reactive/silk';
import { AppSkeleton, type AppSkeletonState } from './AppSkeleton';

const states: AppSkeletonState[] = [
  'normal',
  'sidebarCollapse',
  'overflow',
  'longContent',
  'compactDensity',
];

function renderFixture(state: AppSkeletonState) {
  return render(
    <SilkProvider colorScheme="light">
      <AppSkeleton state={state} />
    </SilkProvider>,
  );
}

test.each(states)('AppSkeleton state "%s" mounts with required regions', (state) => {
  const { container } = renderFixture(state);
  const root = container.querySelector('[data-fixture="app-skeleton"]');
  expect(root).not.toBeNull();
  expect(root?.getAttribute('data-fixture-state')).toBe(state);

  const scope = within(root as HTMLElement);
  expect(scope.getByText('Silk App')).toBeTruthy();
  expect(root?.querySelector('[data-region="header"]')).not.toBeNull();
  expect(root?.querySelector('[data-region="sidebar"]')).not.toBeNull();
  expect(root?.querySelector('[data-region="content"]')).not.toBeNull();
  expect(root?.querySelector('[data-region="footer"]')).not.toBeNull();
});

test('sidebarCollapse establishes a size container and collapseBelow', () => {
  const { container } = renderFixture('sidebarCollapse');
  const root = container.querySelector(
    '[data-fixture="app-skeleton"]',
  ) as HTMLElement;
  expect(root.getAttribute('data-contain')).toBe('true');
  const body = root.querySelector('[data-region="body"]');
  expect(body?.getAttribute('data-collapse-below')).toBe('md');
  expect(root.style.maxWidth).toBe('22rem');
});

test('overflow state constrains shell height for scroll', () => {
  const { container } = renderFixture('overflow');
  const root = container.querySelector(
    '[data-fixture="app-skeleton"]',
  ) as HTMLElement;
  expect(root.style.maxHeight).toBe('22rem');
  expect(root.style.overflow).toBe('auto');
});

test('longContent state includes unbroken content region', () => {
  const { container } = renderFixture('longContent');
  const long = container.querySelector('[data-region="long-content"]');
  expect(long).not.toBeNull();
  expect(long?.textContent ?? '').toContain('supercalifragilistic');
});

test('compactDensity nests a density scope', () => {
  const { container } = renderFixture('compactDensity');
  const densityRoot = container.querySelector('[data-density="compact"]');
  expect(densityRoot).not.toBeNull();
});

test('fixture output only uses Silk-backed elements (no raw layout tags smuggled)', () => {
  const { container } = renderFixture('normal');
  const root = container.querySelector(
    '[data-fixture="app-skeleton"]',
  ) as HTMLElement;
  // Layout regions are Silk Box/Stack (divs with data-* recipe attrs), not ad-hoc <main>/<aside> chrome.
  expect(root.querySelector('style')).toBeNull();
  expect(root.querySelector('[data-region="header"]')?.hasAttribute('data-padding')).toBe(
    true,
  );
  expect(root.querySelector('[data-region="body"]')?.hasAttribute('data-direction')).toBe(
    true,
  );
});
