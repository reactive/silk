import { expect, test } from '@rstest/core';
import { render, within } from '@testing-library/react';
import { TenantGallery } from './TenantGallery';
import {
  emberDark,
  emberLight,
  oceanDark,
  oceanLight,
  tenantThemes,
} from './tenants';

const panels = [
  'Ocean / light',
  'Ocean / dark',
  'Ember / light',
  'Ember / dark',
] as const;

test('TenantGallery mounts four side-by-side tenant panels', () => {
  const { container } = render(<TenantGallery />);
  const root = container.querySelector('[data-fixture="tenant-gallery"]');
  expect(root).not.toBeNull();
  expect(root?.getAttribute('data-fixture-state')).toBe('side-by-side');

  for (const label of panels) {
    const panel = container.querySelector(`[data-tenant-panel="${label}"]`);
    expect(panel).not.toBeNull();
    expect(
      within(panel as HTMLElement).getByRole('button', { name: 'Accent' }),
    ).toBeTruthy();
  }
});

test('each tenant theme panel applies inline CSS variables (no stylesheet insert)', () => {
  const styleCountBefore = document.querySelectorAll('style').length;
  const { container } = render(<TenantGallery />);

  for (const label of panels) {
    const panel = container.querySelector(
      `[data-tenant-panel="${label}"]`,
    ) as HTMLElement;
    const scope = panel.closest('[data-theme]') as HTMLElement | null;
    expect(scope).not.toBeNull();
    expect(scope!.style.getPropertyValue('--silk-color-surface')).not.toBe('');
    expect(scope!.style.getPropertyValue('--silk-color-tone-accent-solid')).not.toBe(
      '',
    );
  }

  expect(document.querySelectorAll('style').length).toBe(styleCountBefore);
});

test('tenantThemes exports ocean and ember', () => {
  expect(Object.keys(tenantThemes)).toEqual(['ocean', 'ember']);
  expect(oceanLight.colorScheme).toBe('light');
  expect(oceanDark.colorScheme).toBe('dark');
  expect(emberLight.colorScheme).toBe('light');
  expect(emberDark.colorScheme).toBe('dark');
});
