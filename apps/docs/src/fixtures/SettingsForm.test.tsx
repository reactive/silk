import { expect, test } from '@rstest/core';
import { render, within } from '@testing-library/react';
import { SilkProvider } from '@reactive/silk';
import { SettingsForm, type SettingsFormState } from './SettingsForm';

const states: SettingsFormState[] = [
  'normal',
  'error',
  'disabled',
  'loading',
  'reducedMotion',
  'narrowLongContent',
];

function renderFixture(state: SettingsFormState) {
  return render(
    <SilkProvider colorScheme="light">
      <SettingsForm state={state} />
    </SilkProvider>,
  );
}

test.each(states)(
  'SettingsForm state "%s" mounts with fixture markers',
  (state) => {
    const { container } = renderFixture(state);
    const root = container.querySelector('[data-fixture="settings-form"]');
    expect(root).not.toBeNull();
    expect(root?.getAttribute('data-fixture-state')).toBe(state);
    expect(within(root as HTMLElement).getByText('Account settings')).toBeTruthy();
  },
);

test('error state associates Field error with the display name input', () => {
  const { container } = renderFixture('error');
  const root = container.querySelector(
    '[data-fixture="settings-form"]',
  ) as HTMLElement;
  const input = within(root).getByLabelText(/Display name/);
  expect(input.getAttribute('aria-invalid')).toBe('true');
  const describedBy = input.getAttribute('aria-describedby') ?? '';
  expect(describedBy.length).toBeGreaterThan(0);
  expect(within(root).getByRole('alert').textContent).toMatch(/required/i);
});

test('disabled state disables primary controls', () => {
  const { container } = renderFixture('disabled');
  const root = container.querySelector(
    '[data-fixture="settings-form"]',
  ) as HTMLElement;
  expect(
    (within(root).getByLabelText(/Display name/) as HTMLInputElement).disabled,
  ).toBe(true);
  expect(
    (
      within(root).getByRole('button', {
        name: 'Save changes',
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
});

test('loading state shows skeleton and status spinner', () => {
  const { container } = renderFixture('loading');
  const root = container.querySelector(
    '[data-fixture="settings-form"]',
  ) as HTMLElement;
  expect(root.querySelector('[data-region="loading"]')).not.toBeNull();
  expect(root.querySelector('[data-region="reduced-motion-preview"]')).toBeNull();
  expect(within(root).getByRole('status')).toBeTruthy();
});

test('reducedMotion keeps the form and adds a motion preview region', () => {
  const { container } = renderFixture('reducedMotion');
  const root = container.querySelector(
    '[data-fixture="settings-form"]',
  ) as HTMLElement;
  expect(root.querySelector('[data-region="form"]')).not.toBeNull();
  expect(root.querySelector('[data-region="loading"]')).toBeNull();
  const preview = root.querySelector(
    '[data-region="reduced-motion-preview"]',
  ) as HTMLElement;
  expect(preview).not.toBeNull();
  expect(within(preview).getByRole('status')).toBeTruthy();
  expect(preview.querySelector('[data-shape="text"]')).not.toBeNull();
  expect(preview.querySelector('[data-shape="rect"]')).not.toBeNull();
  expect(
    preview.querySelector('[data-progress="indeterminate"]'),
  ).not.toBeNull();
});

test('narrowLongContent constrains width and keeps long copy', () => {
  const { container } = renderFixture('narrowLongContent');
  const root = container.querySelector(
    '[data-fixture="settings-form"]',
  ) as HTMLElement;
  expect(root.style.maxWidth).toBe('18rem');
  expect(root.textContent ?? '').toContain('Extremely long helper copy');
});

test('group field labels the plan radiogroup', () => {
  const { container } = renderFixture('normal');
  const root = container.querySelector(
    '[data-fixture="settings-form"]',
  ) as HTMLElement;
  const group = within(root).getByRole('radiogroup');
  const labelledBy = group.getAttribute('aria-labelledby');
  expect(labelledBy).toBeTruthy();
  expect(document.getElementById(labelledBy!)?.textContent).toContain('Plan');
});
