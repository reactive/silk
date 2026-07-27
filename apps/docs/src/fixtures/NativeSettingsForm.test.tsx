import { expect, test } from '@rstest/core';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  NativeSettingsForm,
  nativeSettingsFormStates,
  type NativeSettingsFormState,
} from './NativeSettingsForm';

function renderFixture(state: NativeSettingsFormState) {
  return render(<NativeSettingsForm state={state} />);
}

test.each(nativeSettingsFormStates)(
  'NativeSettingsForm state "%s" mounts with fixture markers',
  (state) => {
    const { container } = renderFixture(state);
    const root = container.querySelector(
      '[data-fixture="native-settings-form"]',
    );
    expect(root).not.toBeNull();
    expect(root?.getAttribute('data-fixture-state')).toBe(state);
    expect(screen.getByText('Settings')).toBeTruthy();
  },
);

test('error state shows alert and summary', () => {
  renderFixture('error');
  expect(screen.getByRole('alert').textContent).toContain('required');
  expect(screen.getByText(/state=error/)).toBeTruthy();
});

test('disabled switches and radios expose disabled', () => {
  renderFixture('disabled');
  expect(
    screen.getByRole('switch').getAttribute('aria-disabled'),
  ).toBe('true');
  for (const radio of screen.getAllByRole('radio')) {
    expect(radio.getAttribute('aria-disabled')).toBe('true');
  }
});

test('invalidDisabled keeps invalid error with disabled controls', () => {
  renderFixture('invalidDisabled');
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(
    screen.getByRole('switch').getAttribute('aria-disabled'),
  ).toBe('true');
});

test('compact and dark report in summary', () => {
  expect(renderFixture('compact').getByText(/density=compact/)).toBeTruthy();
  expect(renderFixture('dark').getByText(/scheme=dark/)).toBeTruthy();
});

test('rtl sets dir attribute', () => {
  const { container } = renderFixture('rtl');
  expect(
    container
      .querySelector('[data-fixture="native-settings-form"]')
      ?.getAttribute('dir'),
  ).toBe('rtl');
});

test('indeterminate checkbox starts mixed then becomes checked', () => {
  renderFixture('indeterminate');
  const box = screen.getByRole('checkbox', { name: /Select all/i });
  expect(box.getAttribute('aria-checked')).toBe('mixed');
  fireEvent.click(box);
  expect(
    screen.getByRole('checkbox', { name: /Select all/i }).getAttribute(
      'aria-checked',
    ),
  ).toBe('true');
});

test('progress exposes aria-valuenow', () => {
  renderFixture('normal');
  const bar = screen.getByLabelText('Profile completeness');
  expect(bar.getAttribute('aria-valuenow')).toBe('72');
});

test('longContent region present', () => {
  const { container } = renderFixture('longContent');
  expect(
    container.querySelector('[data-region="long-content"]'),
  ).not.toBeNull();
});

test('reducedMotion region present', () => {
  const { container } = renderFixture('reducedMotion');
  expect(
    container.querySelector('[data-region="reduced-motion"]'),
  ).not.toBeNull();
});
