import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import { SilkProvider } from '../theme/SilkProvider';
import { Field } from './Field';
import { Inline } from './Inline';
import { Input } from './Input';
import { RadioGroup } from './RadioGroup';
import { Stack } from './Stack';

test('Field single mode wires label, description, error to Input', () => {
  render(
    <SilkProvider>
      <Field.Root invalid>
        <Field.Label>Email</Field.Label>
        <Input />
        <Field.Description>Work email preferred</Field.Description>
        <Field.Error>Required</Field.Error>
      </Field.Root>
    </SilkProvider>,
  );

  const input = screen.getByLabelText(/Email/);
  expect(input).toBeTruthy();
  expect(input.getAttribute('aria-invalid')).toBe('true');
  const describedBy = input.getAttribute('aria-describedby') ?? '';
  expect(describedBy.length).toBeGreaterThan(0);
  for (const id of describedBy.split(' ')) {
    expect(document.getElementById(id)).not.toBeNull();
  }
  expect(screen.getByRole('alert').textContent).toBe('Required');
});

test('Field-less Input is a plain control', () => {
  render(
    <SilkProvider>
      <Input aria-label="Standalone" />
    </SilkProvider>,
  );
  const input = screen.getByLabelText('Standalone');
  expect(input.getAttribute('id')).toBeNull();
  expect(input.getAttribute('aria-describedby')).toBeNull();
});

test('Field.Root controlId names the control and the label together', () => {
  render(
    <SilkProvider>
      <Field.Root controlId="custom-id">
        <Field.Label>Name</Field.Label>
        <Input />
      </Field.Root>
    </SilkProvider>,
  );
  const input = screen.getByLabelText(/Name/);
  expect(input.getAttribute('id')).toBe('custom-id');
  expect(screen.getByText(/Name/).getAttribute('for')).toBe('custom-id');
});

test('explicit aria props win over Field context', () => {
  render(
    <SilkProvider>
      <Field.Root invalid>
        <Field.Label>Name</Field.Label>
        <Input aria-describedby="custom-desc" />
        <Field.Description>Ignored for describedby</Field.Description>
        <p id="custom-desc">Custom</p>
      </Field.Root>
    </SilkProvider>,
  );
  const input = screen.getByLabelText(/Name/);
  expect(input.getAttribute('aria-describedby')).toBe('custom-desc');
});

test('Field group mode uses aria-labelledby on RadioGroup', () => {
  render(
    <SilkProvider>
      <Field.Root mode="group">
        <Field.Label>Plan</Field.Label>
        <RadioGroup.Root>
          <RadioGroup.Item value="free">Free</RadioGroup.Item>
          <RadioGroup.Item value="pro">Pro</RadioGroup.Item>
        </RadioGroup.Root>
      </Field.Root>
    </SilkProvider>,
  );

  const group = screen.getByRole('radiogroup');
  const labelledBy = group.getAttribute('aria-labelledby');
  expect(labelledBy).toBeTruthy();
  expect(document.getElementById(labelledBy!)?.textContent).toContain('Plan');
  // Label should not use htmlFor in group mode
  const label = document.getElementById(labelledBy!);
  expect(label?.getAttribute('for')).toBeNull();
});

test('group mode without a Label omits aria-labelledby', () => {
  render(
    <SilkProvider>
      <Field.Root mode="group">
        <RadioGroup.Root aria-label="Plan">
          <RadioGroup.Item value="free">Free</RadioGroup.Item>
        </RadioGroup.Root>
      </Field.Root>
    </SilkProvider>,
  );
  const group = screen.getByRole('radiogroup', { name: 'Plan' });
  expect(group.getAttribute('aria-labelledby')).toBeNull();
});

test('custom Field.Label id is what aria-labelledby points at', () => {
  render(
    <SilkProvider>
      <Field.Root mode="group">
        <Field.Label id="plan-label">Plan</Field.Label>
        <RadioGroup.Root>
          <RadioGroup.Item value="free">Free</RadioGroup.Item>
        </RadioGroup.Root>
      </Field.Root>
    </SilkProvider>,
  );
  const group = screen.getByRole('radiogroup');
  expect(group.getAttribute('aria-labelledby')).toBe('plan-label');
});

test('custom Description/Error ids appear in aria-describedby', () => {
  render(
    <SilkProvider>
      <Field.Root invalid>
        <Field.Label>Email</Field.Label>
        <Input />
        <Field.Description id="my-desc">Hint</Field.Description>
        <Field.Error id="my-err">Bad</Field.Error>
      </Field.Root>
    </SilkProvider>,
  );
  const input = screen.getByLabelText(/Email/);
  expect(input.getAttribute('aria-describedby')).toBe('my-desc my-err');
});

test('group mode finds Label nested in layout wrappers', () => {
  render(
    <SilkProvider>
      <Field.Root mode="group">
        <Stack gap="2">
          <Field.Label>Plan</Field.Label>
          <RadioGroup.Root>
            <RadioGroup.Item value="free">Free</RadioGroup.Item>
          </RadioGroup.Root>
        </Stack>
      </Field.Root>
    </SilkProvider>,
  );

  const group = screen.getByRole('radiogroup');
  const labelledBy = group.getAttribute('aria-labelledby');
  expect(labelledBy).toBeTruthy();
  expect(document.getElementById(labelledBy!)?.textContent).toContain('Plan');
});

test('Description/Error nested in layout wrappers still describe the control', () => {
  render(
    <SilkProvider>
      <Field.Root invalid>
        <Inline gap="2" align="center">
          <Field.Label>Email</Field.Label>
          <Input />
        </Inline>
        <Stack gap="1">
          <Field.Description>Work email</Field.Description>
          <Field.Error>Required</Field.Error>
        </Stack>
      </Field.Root>
    </SilkProvider>,
  );

  const input = screen.getByLabelText(/Email/);
  const describedBy = input.getAttribute('aria-describedby') ?? '';
  expect(describedBy.split(' ')).toHaveLength(2);
  for (const id of describedBy.split(' ')) {
    expect(document.getElementById(id)).not.toBeNull();
  }
  expect(document.getElementById(describedBy.split(' ')[0]!)?.textContent).toBe(
    'Work email',
  );
});

test('nested Field.Root slots do not leak into the outer Field', () => {
  render(
    <SilkProvider>
      <Field.Root mode="group">
        <RadioGroup.Root aria-label="Outer">
          <RadioGroup.Item value="a">A</RadioGroup.Item>
        </RadioGroup.Root>
        {/* Wrapper ensures the boundary is hit during descendant walk. */}
        <Stack gap="2">
          <Field.Root>
            <Field.Label>Inner</Field.Label>
            <Input />
            <Field.Description>Inner hint</Field.Description>
          </Field.Root>
        </Stack>
      </Field.Root>
    </SilkProvider>,
  );

  const group = screen.getByRole('radiogroup', { name: 'Outer' });
  expect(group.getAttribute('aria-labelledby')).toBeNull();
  expect(group.getAttribute('aria-describedby')).toBeNull();

  const inner = screen.getByLabelText(/Inner/);
  const innerDescribedBy = inner.getAttribute('aria-describedby');
  expect(innerDescribedBy).toBeTruthy();
  expect(document.getElementById(innerDescribedBy!)?.textContent).toBe(
    'Inner hint',
  );
});

test('explicit aria-invalid grammar is preserved; false clears visual invalid', () => {
  render(
    <SilkProvider>
      <Field.Root invalid>
        <Field.Label>Email</Field.Label>
        <Input aria-invalid="grammar" aria-label="g" />
      </Field.Root>
      <Field.Root invalid>
        <Input aria-invalid={false} aria-label="ok" />
      </Field.Root>
    </SilkProvider>,
  );
  expect(screen.getByLabelText('g').getAttribute('aria-invalid')).toBe(
    'grammar',
  );
  expect(screen.getByLabelText('g').getAttribute('data-invalid')).toBe('true');
  expect(screen.getByLabelText('ok').getAttribute('aria-invalid')).toBe(
    'false',
  );
  expect(screen.getByLabelText('ok').getAttribute('data-invalid')).toBeNull();
});
