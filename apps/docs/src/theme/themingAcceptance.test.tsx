import { SilkProvider } from '@reactive/silk';
import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import { InspectorPanel } from '../fixtures/InspectorPanel';
import { SocialFeed } from '../fixtures/SocialFeed';
import { emberDark, emberLight, oceanDark, oceanLight } from './tenants';

test('SocialFeed renders under both tenant themes and both schemes', () => {
  const themes = [
    ['ocean/light', oceanLight],
    ['ocean/dark', oceanDark],
    ['ember/light', emberLight],
    ['ember/dark', emberDark],
  ] as const;

  for (const [label, theme] of themes) {
    const { container, unmount } = render(
      <SilkProvider theme={theme}>
        <SocialFeed state="normal" />
      </SilkProvider>,
    );
    const root = container.querySelector('[data-fixture="social-feed"]');
    expect(root, label).not.toBeNull();
    const scope = container.firstElementChild as HTMLElement;
    expect(scope.style.getPropertyValue('--silk-color-surface')).not.toBe('');
    expect(scope.getAttribute('data-theme')).toBe(theme.colorScheme);
    unmount();
  }
});

test('InspectorPanel under outer tenant reconstitutes hooks into portal', () => {
  render(
    <SilkProvider
      theme={oceanLight}
      style={{ ['--silk-button-bg' as string]: 'rgb(10, 20, 30)' }}
    >
      <InspectorPanel state="overlaysOpen" />
    </SilkProvider>,
  );

  const menu = document.querySelector('[role="menu"]');
  expect(menu).not.toBeNull();
  const portalScope = menu!.closest('[data-theme]') as HTMLElement | null;
  expect(portalScope).not.toBeNull();
  expect(portalScope!.style.getPropertyValue('--silk-color-surface')).not.toBe(
    '',
  );
  expect(portalScope!.style.getPropertyValue('--silk-button-bg')).toBe(
    'rgb(10, 20, 30)',
  );

  // Theme delivery stays on the style attribute (ScrollArea may add constant
  // <style> elements; those must not carry theme CSS variables).
  const themeStylesheets = [...document.querySelectorAll('style')].filter(
    (el) => (el.textContent ?? '').includes('--silk-color-surface'),
  );
  expect(themeStylesheets).toEqual([]);
});

test('tenant-inside-named and named-inside-tenant nesting', () => {
  const { container: namedInside } = render(
    <SilkProvider
      theme={emberLight}
      style={{ ['--silk-badge-bg' as string]: 'rgb(1, 2, 3)' }}
    >
      <SilkProvider colorScheme="dark">
        <SocialFeed state="normal" />
      </SilkProvider>
    </SilkProvider>,
  );
  const namedScope = (
    namedInside.firstElementChild as HTMLElement
  ).firstElementChild as HTMLElement;
  expect(namedScope.getAttribute('data-theme')).toBe('dark');
  expect(namedScope.style.getPropertyValue('--silk-color-surface')).toBe('');
  expect(namedScope.style.getPropertyValue('--silk-badge-bg')).toBe(
    'rgb(1, 2, 3)',
  );

  const { container: tenantInside } = render(
    <SilkProvider colorScheme="dark">
      <SilkProvider theme={emberLight}>
        <span data-testid="inner">x</span>
      </SilkProvider>
    </SilkProvider>,
  );
  const tenantScope = (
    tenantInside.firstElementChild as HTMLElement
  ).firstElementChild as HTMLElement;
  expect(tenantScope.style.getPropertyValue('--silk-color-surface')).not.toBe(
    '',
  );
  expect(tenantScope.contains(screen.getByTestId('inner'))).toBe(true);
});

test('side-by-side tenants do not insert dynamic stylesheets', () => {
  const before = document.querySelectorAll('style').length;
  const { unmount } = render(
    <>
      <SilkProvider theme={oceanLight}>
        <SocialFeed state="normal" />
      </SilkProvider>
      <SilkProvider theme={emberDark}>
        <SocialFeed state="normal" />
      </SilkProvider>
    </>,
  );
  expect(document.querySelectorAll('style').length).toBe(before);
  unmount();
});
