import { compactSpace } from '@reactive/silk-core';
import { expect, test } from '@rstest/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState, type JSX } from 'react';
import { toggleBoxStep } from '../styles/controlGeometry.js';
import { SilkProvider } from '../theme/SilkProvider.js';
import { Checkbox } from './Checkbox.js';
import { Field } from './Field.js';
import { Input } from './Input.js';
import { RadioGroup } from './RadioGroup.js';
import { Switch } from './Switch.js';
import { Textarea } from './Textarea.js';

test('Input wires Field label into accessibilityLabel and controlId', () => {
  render(
    <SilkProvider>
      <Field.Root controlId="name-input">
        <Field.Label>Name</Field.Label>
        <Input testID="input" />
        <Field.Description>Your full name</Field.Description>
      </Field.Root>
    </SilkProvider>,
  );
  const input = screen.getByTestId('input');
  expect(input.getAttribute('id') ?? input.getAttribute('nativeID')).toBeTruthy();
  expect(screen.getByLabelText('Name')).toBeTruthy();
});

test('group Field associates custom slot nativeIDs via accessibilityLabelledBy', () => {
  render(
    <SilkProvider>
      <Field.Root mode="group">
        <Field.Label nativeID="plan-label">Plan</Field.Label>
        <RadioGroup.Root testID="plan">
          <RadioGroup.Item value="free">Free</RadioGroup.Item>
        </RadioGroup.Root>
        <Field.Description nativeID="plan-hint">Billing cycle</Field.Description>
        <Field.Error nativeID="plan-error">Pick one</Field.Error>
      </Field.Root>
    </SilkProvider>,
  );
  const group = screen.getByTestId('plan');
  // RNW maps accessibilityLabelledBy → aria-labelledby.
  expect(group.getAttribute('aria-labelledby')).toBe('plan-label');
  expect(screen.getByText('Plan').getAttribute('id')).toBe('plan-label');
  expect(screen.getByText('Billing cycle').getAttribute('id')).toBe('plan-hint');
  expect(screen.getByRole('alert').getAttribute('id')).toBe('plan-error');
});

test('Field Error has alert role; invalid/required emit ARIA aliases', () => {
  render(
    <SilkProvider>
      <Field.Root invalid required>
        <Field.Label>Email</Field.Label>
        <Input testID="email" />
        <Field.Error>Required</Field.Error>
      </Field.Root>
    </SilkProvider>,
  );
  expect(screen.getByRole('alert').textContent).toContain('Required');
  const input = screen.getByTestId('email');
  expect(input.getAttribute('aria-invalid')).toBe('true');
  expect(input.getAttribute('aria-required')).toBe('true');
  expect(screen.getByLabelText(/Email/)).toBeTruthy();
});

test('explicit disabled on Input wins over Field', () => {
  render(
    <SilkProvider>
      <Field.Root>
        <Field.Label>X</Field.Label>
        <Input disabled testID="x" />
      </Field.Root>
    </SilkProvider>,
  );
  // RN TextInput uses editable={false}; RNW maps to disabled/readOnly.
  const input = screen.getByTestId('x') as HTMLInputElement;
  expect(
    input.getAttribute('disabled') !== null ||
      input.getAttribute('aria-disabled') === 'true' ||
      input.readOnly === true ||
      input.disabled === true,
  ).toBe(true);
});

test('Textarea is multiline', () => {
  render(
    <SilkProvider>
      <Textarea testID="ta" placeholder="Notes" />
    </SilkProvider>,
  );
  expect(screen.getByTestId('ta')).toBeTruthy();
  expect(screen.getByPlaceholderText('Notes')).toBeTruthy();
});

test('Checkbox toggles and emits aria-checked', () => {
  let last: boolean | 'indeterminate' | undefined;
  render(
    <SilkProvider>
      <Checkbox
        accessibilityLabel="Agree"
        onCheckedChange={(v) => {
          last = v;
        }}
      />
    </SilkProvider>,
  );
  const box = screen.getByRole('checkbox', { name: 'Agree' });
  expect(box.getAttribute('aria-checked')).toBe('false');
  fireEvent.click(box);
  expect(last).toBe(true);
  expect(screen.getByRole('checkbox').getAttribute('aria-checked')).toBe(
    'true',
  );
});

test('Checkbox indeterminate → checked transition', () => {
  function Harness(): JSX.Element {
    const [checked, setChecked] = useState<boolean | 'indeterminate'>(
      'indeterminate',
    );
    return (
      <Checkbox
        checked={checked}
        accessibilityLabel="Select all"
        onCheckedChange={setChecked}
      />
    );
  }
  render(
    <SilkProvider>
      <Harness />
    </SilkProvider>,
  );
  const box = screen.getByRole('checkbox', { name: 'Select all' });
  expect(box.getAttribute('aria-checked')).toBe('mixed');
  fireEvent.click(box);
  expect(screen.getByRole('checkbox').getAttribute('aria-checked')).toBe(
    'true',
  );
});

test('Switch toggles with aria-checked', () => {
  render(
    <SilkProvider>
      <Switch accessibilityLabel="Dark mode" />
    </SilkProvider>,
  );
  const sw = screen.getByRole('switch', { name: 'Dark mode' });
  expect(sw.getAttribute('aria-checked')).toBe('false');
  fireEvent.click(sw);
  expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true');
});

test('RadioGroup exclusive selection', () => {
  render(
    <SilkProvider>
      <RadioGroup.Root accessibilityLabel="Plan">
        <RadioGroup.Item value="free">Free</RadioGroup.Item>
        <RadioGroup.Item value="pro">Pro</RadioGroup.Item>
      </RadioGroup.Root>
    </SilkProvider>,
  );
  const free = screen.getByRole('radio', { name: 'Free' });
  const pro = screen.getByRole('radio', { name: 'Pro' });
  fireEvent.click(free);
  expect(free.getAttribute('aria-checked')).toBe('true');
  fireEvent.click(pro);
  expect(pro.getAttribute('aria-checked')).toBe('true');
  expect(screen.getByRole('radio', { name: 'Free' }).getAttribute('aria-checked')).toBe(
    'false',
  );
});

test('RadioGroup.Item gap honors compact density', () => {
  render(
    <SilkProvider density="compact">
      <RadioGroup.Root accessibilityLabel="Plan">
        <RadioGroup.Item value="free">Free</RadioGroup.Item>
      </RadioGroup.Root>
    </SilkProvider>,
  );
  const radio = screen.getByRole('radio', { name: 'Free' });
  expect(getComputedStyle(radio).gap).toBe(`${compactSpace[2]}px`);
});

test('Checkbox children sit beside the control, not inside the box', () => {
  render(
    <SilkProvider density="compact">
      <Checkbox accessibilityLabel="Agree">Notify me</Checkbox>
    </SilkProvider>,
  );
  const control = screen.getByRole('checkbox', { name: 'Agree' });
  const boxEdge = compactSpace[toggleBoxStep.md];
  expect(getComputedStyle(control).flexDirection).toBe('row');
  expect(getComputedStyle(control).gap).toBe(`${compactSpace[2]}px`);
  // Fixed box size must not clamp the Pressable that holds the label.
  expect(getComputedStyle(control).width).not.toBe(`${boxEdge}px`);
  expect(screen.getByText('Notify me')).toBeTruthy();
});

test('disabled Checkbox suppresses press', () => {
  let flips = 0;
  render(
    <SilkProvider>
      <Checkbox
        disabled
        accessibilityLabel="Locked"
        onCheckedChange={() => {
          flips += 1;
        }}
      />
    </SilkProvider>,
  );
  fireEvent.click(screen.getByRole('checkbox', { name: 'Locked' }));
  expect(flips).toBe(0);
  expect(
    screen.getByRole('checkbox').getAttribute('aria-disabled'),
  ).toBe('true');
});
